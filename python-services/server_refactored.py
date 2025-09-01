# server.py - Refactored and cleaned version

# Standard library imports
import os
import time
import base64
import ctypes
import uuid
import platform
import threading
from ctypes import c_int, c_void_p, c_ubyte, POINTER, byref
from typing import Optional
from datetime import datetime, timezone, timedelta

# Third-party imports
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import psycopg
from psycopg import OperationalError
from psycopg import errors as pg_errors

# APScheduler imports (tolerant if not available)
SCHED_AVAILABLE = True
try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.cron import CronTrigger
except Exception as _e:
    print("[SCHED][WARN] APScheduler no disponible:", _e)
    SCHED_AVAILABLE = False

# Load environment variables
load_dotenv()

# ============================================================================
# CONSTANTS AND CONFIGURATION
# ============================================================================

ARCH_BITS = 64 if platform.architecture()[0].startswith("64") else 32
PG_URL = os.environ.get("DATABASE_URL")
MATCH_THRESHOLD = int(os.environ.get("ZK_MATCH_THRESHOLD", "45"))
FORCE_FALLBACK = os.environ.get("ZK_FORCE_FALLBACK", "true").lower() == "true"

# Database configuration
USER_COL = "user_id"
CREATEDCOL = "created_at"
UPDATEDCOL = "updated_at"
HAS_ID = False

DDL = """
CREATE TABLE IF NOT EXISTS fingerprints (
  user_id    TEXT PRIMARY KEY,
  template   BYTEA NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
"""

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class FingerprintData(BaseModel):
    user_id: str
    fingerprint: str

class MultiFingerprintData(BaseModel):
    user_id: str
    fingerprints: list[str]  # base64 de 2-3 capturas

class IdentifyPayload(BaseModel):
    fingerprint: str  # template en base64

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def lima_now():
    """Utilidad simple para hora de Lima (UTC-5 fijo)"""
    return datetime.now(timezone.utc) + timedelta(hours=-5)

def _has_symbols(dll, names):
    """Check if DLL has required symbols"""
    try:
        for n in names:
            getattr(dll, n)
        return True
    except Exception:
        return False

def _load_lib():
    """
    Intenta cargar una DLL que realmente exponga ZKFPM_*
    y que corresponda a la arquitectura de Python (32/64).
    """
    candidates = [
        os.environ.get("ZK_DLL_PATH"),
        r"C:\Program Files\ZKTeco\ZKFinger SDK\lib\libzkfp.dll",
        r"C:\Program Files (x86)\ZKTeco\ZKFinger SDK\lib\libzkfp.dll",
        r"C:\Windows\System32\libzkfp.dll",
        r"C:\Windows\SysWOW64\libzkfp.dll",
        "./zkfinger10.dll",  # DLL local
        "./ZKFPCap.dll",     # DLL local
    ]

    required = ["ZKFPM_Init", "ZKFPM_OpenDevice", "ZKFPM_GetDeviceCount"]

    last_err = None
    tried = []
    for p in candidates:
        if not p or not os.path.exists(p):
            tried.append(f"{p} (no existe)")
            continue
        try:
            print(f"[DEBUG] Intentando cargar: {p}")
            dll = ctypes.WinDLL(p)
            if not _has_symbols(dll, required):
                tried.append(f"{p} (sin ZKFPM_*)")
                continue
            print(f"[DLL] Cargada: {p} (py={ARCH_BITS}bit)")
            return dll
        except Exception as e:
            last_err = e
            tried.append(f"{p} ({e})")

    error_msg = "No pude cargar una libzkfp válida. Intentos:\n  - " + "\n  - ".join(tried)
    if last_err:
        error_msg += f"\nÚltimo error: {last_err}"
    print(f"[ERROR] {error_msg}")
    raise RuntimeError(error_msg)

# ============================================================================
# DATABASE FUNCTIONS
# ============================================================================

def pg_conn():
    """Get PostgreSQL connection"""
    if not PG_URL:
        raise RuntimeError("Falta DATABASE_URL para Postgres")
    return psycopg.connect(PG_URL)

def _detect_cols():
    """Detect database column names"""
    with pg_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'fingerprints'
        """
        )
        cols = {r[0] for r in cur.fetchall()}
    user_col = '"userId"' if "userId" in cols else "user_id"
    created_col = '"createdAt"' if "createdAt" in cols else "created_at"
    updated_col = '"updatedAt"' if "updatedAt" in cols else "updated_at"
    has_id = "id" in cols
    return user_col, created_col, updated_col, has_id

def db_get_template(user_id: str) -> Optional[bytes]:
    """Get fingerprint template for user"""
    with pg_conn() as conn, conn.cursor() as cur:
        cur.execute(
            f"SELECT template FROM fingerprints WHERE {USER_COL}=%s", (user_id,)
        )
        row = cur.fetchone()
        return row[0] if row else None

def db_upsert_template(user_id: str, tpl: bytes):
    """Insert or update fingerprint template"""
    with pg_conn() as conn, conn.cursor() as cur:
        try:
            if HAS_ID:
                gen_id = str(uuid.uuid4())
                cur.execute(
                    f"""
                    INSERT INTO fingerprints (id, {USER_COL}, template, {CREATEDCOL}, {UPDATEDCOL})
                    VALUES (%s, %s, %s, NOW(), NOW())
                    ON CONFLICT ({USER_COL})
                    DO UPDATE SET template = EXCLUDED.template, {UPDATEDCOL} = NOW()
                    """,
                    (gen_id, user_id, tpl),
                )
            else:
                cur.execute(
                    f"""
                    INSERT INTO fingerprints ({USER_COL}, template, {CREATEDCOL}, {UPDATEDCOL})
                    VALUES (%s, %s, NOW(), NOW())
                    ON CONFLICT ({USER_COL})
                    DO UPDATE SET template = EXCLUDED.template, {UPDATEDCOL} = NOW()
                    """,
                    (user_id, tpl),
                )
            conn.commit()
        except (pg_errors.NotNullViolation, pg_errors.ForeignKeyViolation):
            conn.rollback()
            raise

def db_all_templates() -> list[tuple[str, bytes]]:
    """Get all fingerprint templates"""
    with pg_conn() as conn, conn.cursor() as cur:
        cur.execute(f"SELECT {USER_COL}, template FROM fingerprints")
        return [(r[0], r[1]) for r in cur.fetchall()]

# ============================================================================
# ZKDEVICE CLASS
# ============================================================================

class ZKDevice:
    """ZKTeco fingerprint device wrapper"""
    
    def __init__(self):
        self.lib = _load_lib()
        self._setup_function_signatures()
        self._initialize_state()

    def _setup_function_signatures(self):
        """Setup ctypes function signatures for the DLL"""
        # Basic signatures
        self.lib.ZKFPM_Init.restype = c_int
        self.lib.ZKFPM_Terminate.restype = None

        self.lib.ZKFPM_GetDeviceCount.argtypes = []
        self.lib.ZKFPM_GetDeviceCount.restype = c_int

        self.lib.ZKFPM_OpenDevice.argtypes = [c_int]
        self.lib.ZKFPM_OpenDevice.restype = c_void_p

        self.lib.ZKFPM_CloseDevice.argtypes = [c_void_p]
        self.lib.ZKFPM_CloseDevice.restype = None

        self.lib.ZKFPM_GetParameters.argtypes = [
            c_void_p, c_int, c_void_p, POINTER(c_int),
        ]
        self.lib.ZKFPM_GetParameters.restype = c_int

        # AcquireFingerprint (5 args)
        self.has_acq5 = hasattr(self.lib, "ZKFPM_AcquireFingerprint")
        if self.has_acq5:
            try:
                self.lib.ZKFPM_AcquireFingerprint.argtypes = [
                    c_void_p, POINTER(c_ubyte), c_int, POINTER(c_ubyte), POINTER(c_int),
                ]
                self.lib.ZKFPM_AcquireFingerprint.restype = c_int
            except Exception:
                self.has_acq5 = False

        # DB APIs
        self.has_dbinit = hasattr(self.lib, "ZKFPM_DBInit")
        if self.has_dbinit:
            self.lib.ZKFPM_DBInit.argtypes = [c_int]
            self.lib.ZKFPM_DBInit.restype = c_int

        self.has_dbfree = hasattr(self.lib, "ZKFPM_DBFree")
        if self.has_dbfree:
            self.lib.ZKFPM_DBFree.argtypes = []
            self.lib.ZKFPM_DBFree.restype = None

        self.has_dbmatch = hasattr(self.lib, "ZKFPM_DBMatch")
        if self.has_dbmatch:
            self.lib.ZKFPM_DBMatch.argtypes = [
                POINTER(c_ubyte), c_int, POINTER(c_ubyte), c_int,
            ]
            self.lib.ZKFPM_DBMatch.restype = c_int

        # Merge templates
        self.has_merge = hasattr(self.lib, "ZKFPM_MergeTemplates")
        if self.has_merge:
            self.lib.ZKFPM_MergeTemplates.argtypes = [
                POINTER(c_ubyte), c_int, POINTER(c_ubyte), c_int,
                POINTER(c_ubyte), c_int, POINTER(c_ubyte), POINTER(c_int),
            ]
            self.lib.ZKFPM_MergeTemplates.restype = c_int

    def _initialize_state(self):
        """Initialize device state variables"""
        self.db_inited = False
        self.handle: c_void_p | None = None
        self.width = None
        self.height = None
        self.img_capacity = None

    def init(self) -> int:
        """Initialize the SDK"""
        return self.lib.ZKFPM_Init()

    def terminate(self):
        """Terminate the SDK"""
        try:
            if self.db_inited and self.has_dbfree:
                try:
                    self.lib.ZKFPM_DBFree()
                except Exception:
                    pass
            self.lib.ZKFPM_Terminate()
        except Exception:
            pass
        self.db_inited = False

    def get_count(self) -> int:
        """Get device count"""
        return self.lib.ZKFPM_GetDeviceCount()

    def _get_int_param(self, code: int) -> int:
        """Get integer parameter from device"""
        val = c_int(0)
        sz = c_int(ctypes.sizeof(c_int))
        r = self.lib.ZKFPM_GetParameters(self.handle, code, byref(val), byref(sz))
        if r != 0:
            raise RuntimeError(f"GetParameters({code})={r}")
        return val.value

    def open(self, index: int = 0) -> int:
        """Open device"""
        h = self.lib.ZKFPM_OpenDevice(index)
        self.handle = h
        if not h:
            return -1
        try:
            self.width = self._get_int_param(1)
            self.height = self._get_int_param(2)
        except Exception:
            self.width, self.height = 256, 360
        self.img_capacity = int(self.width * self.height)

        # Try to initialize DB but don't fail if it doesn't work
        try:
            self.ensure_db(2048)
        except Exception as e:
            print(f"[DEBUG] DBInit en open() falló: {e}, continuando...")
        
        return 0

    def close(self):
        """Close device"""
        if self.handle:
            try:
                self.lib.ZKFPM_CloseDevice(self.handle)
            finally:
                self.handle = None
        self.free_db()

    def _err(self, code: int) -> str:
        """Get error message for code"""
        return {
            -1: "Cancelado",
            -2: "Sistema",
            -3: "Sin dispositivo",
            -4: "Parámetro inválido",
            -5: "No se pudo abrir",
            -6: "Init falló",
            -7: "No soportado",
            -8: "No abierto/Inválido/Timeout",
            -10: "Timeout",
        }.get(code, f"Error {code}")

    def capture_template(self, timeout_s: float = 8.0):
        """Capture fingerprint template"""
        if not self.handle:
            return False, {"code": -100, "message": "Dispositivo no abierto"}

        IMG_N = self.img_capacity or (256 * 360)
        img_buf = (c_ubyte * IMG_N)()
        tmpl_cap = 8192
        tmpl_buf = (c_ubyte * tmpl_cap)()
        tmpl_sz = c_int(tmpl_cap)

        t0 = time.time()
        last = None
        while (time.time() - t0) < timeout_s:
            if self.has_acq5:
                r = self.lib.ZKFPM_AcquireFingerprint(
                    self.handle, img_buf, c_int(IMG_N), tmpl_buf, byref(tmpl_sz)
                )
                if r == 0:
                    data = bytes(tmpl_buf[: tmpl_sz.value])
                    b64 = base64.b64encode(data).decode("ascii")
                    return True, {"template": b64, "len": tmpl_sz.value}
                last = {"code": r, "message": f"Acquire error {r}: {self._err(r)}"}
                if r in (-8, -10):
                    time.sleep(0.12)
                    continue
                break

            return False, {"code": -99, "message": "DLL sin métodos de captura soportados"}

        return False, last or {"code": -10, "message": "Timeout"}

    def _score(self, a: bytes, b: bytes) -> int:
        """Score two templates"""
        try:
            if self.has_dbmatch:
                self.ensure_db(2048)
                A = (c_ubyte * len(a)).from_buffer_copy(a)
                B = (c_ubyte * len(b)).from_buffer_copy(b)
                return int(self.lib.ZKFPM_DBMatch(A, len(a), B, len(b)))
        except Exception:
            pass
        return 1 if a == b else 0

    def _pick_best(self, tpls: list[bytes]) -> bytes:
        """Pick best template from list"""
        tpls = [t for t in tpls if t]
        if not tpls:
            raise ValueError("Sin muestras válidas")
        if len(tpls) == 1:
            return tpls[0]
        best_idx, best_sum = 0, -1
        for i, ti in enumerate(tpls):
            s = 0
            for j, tj in enumerate(tpls):
                if i == j:
                    continue
                s += self._score(ti, tj)
            if s > best_sum:
                best_idx, best_sum = i, s
        return tpls[best_idx]

    def merge_templates(self, samples: list[bytes]) -> tuple[bytes, dict]:
        """
        Si la DLL soporta merge, lo usa; si no, devuelve la mejor muestra.
        Retorna (tpl, meta) con métricas.
        """
        meta = {"lens": [len(s) for s in samples]}
        pairwise = []
        for i, a in enumerate(samples):
            row = []
            for j, b in enumerate(samples):
                row.append(None if i == j else self._score(a, b))
            pairwise.append(row)
        meta["pairwise"] = pairwise

        if self.has_merge and len(samples) >= 3:
            out_cap = 8192
            out_buf = (c_ubyte * out_cap)()
            out_sz = c_int(out_cap)
            t1, t2, t3 = samples[0], samples[1], samples[2]
            rc = self.lib.ZKFPM_MergeTemplates(
                (c_ubyte * len(t1)).from_buffer_copy(t1), len(t1),
                (c_ubyte * len(t2)).from_buffer_copy(t2), len(t2),
                (c_ubyte * len(t3)).from_buffer_copy(t3), len(t3),
                out_buf, byref(out_sz),
            )
            if rc == 0 and out_sz.value > 0:
                tpl = bytes(out_buf[: out_sz.value])
                meta["merged"] = True
                meta["best_len"] = len(tpl)
                meta["merge_rc"] = rc
                return tpl, meta
            meta["merge_rc"] = rc

        best = self._pick_best(samples)
        meta["merged"] = False
        meta["best_len"] = len(best)
        return best, meta

    def ensure_db(self, size: int = 2048) -> bool:
        """Inicializa la DB interna de la DLL una sola vez."""
        if not self.has_dbinit or self.db_inited:
            return self.db_inited
        try:
            # algunas DLLs requieren tamaño; si diera TypeError, probamos sin arg
            try:
                rc = int(self.lib.ZKFPM_DBInit(int(size)))
            except TypeError:
                rc = int(self.lib.ZKFPM_DBInit())
            print(f"[DEBUG] ZKFPM_DBInit({size}) -> {rc}")
            self.db_inited = rc == 0 or rc == 1  # 1 = already inited en algunos SDK
        except Exception as e:
            print(f"[DEBUG] DBInit exception: {e}")
            self.db_inited = False
        return self.db_inited

    def free_db(self):
        """Free database resources"""
        if self.db_inited and self.has_dbfree:
            try:
                self.lib.ZKFPM_DBFree()
            except Exception:
                pass
            self.db_inited = False

# ============================================================================
# SIMILARITY CALCULATION
# ============================================================================

def calculate_similarity(a: bytes, b: bytes) -> int:
    """Calcula similitud entre dos templates usando múltiples algoritmos"""
    # Si las longitudes son muy diferentes, usar un enfoque más tolerante
    if len(a) != len(b):
        # Método para templates de diferentes tamaños
        min_len = min(len(a), len(b))
        max_len = max(len(a), len(b))
        
        # Si la diferencia es muy grande, es probable que sean diferentes dedos
        if max_len / min_len > 1.5:
            return 0
        
        # Usar solo la parte común para comparar
        common_a = a[:min_len]
        common_b = b[:min_len]
        
        # Calcular similitud en la parte común
        hamming_distance = sum(bin(common_a[i] ^ common_b[i]).count('1') for i in range(min_len))
        total_bits = min_len * 8
        similarity = max(0, 100 - (hamming_distance / total_bits) * 100)
        
        # Penalizar más severamente por diferencia de tamaño
        size_penalty = (max_len - min_len) / max_len * 50
        final_similarity = max(0, similarity - size_penalty)
        
        return int(final_similarity)
    
    # Método 1: Distancia de Hamming (más estricto)
    hamming_distance = sum(bin(a[i] ^ b[i]).count('1') for i in range(min(len(a), len(b))))
    total_bits = len(a) * 8
    hamming_similarity = max(0, 100 - (hamming_distance / total_bits) * 100)
    
    # Método 2: Correlación de bytes (más tolerante)
    byte_correlations = []
    for i in range(min(len(a), len(b))):
        if a[i] == b[i]:
            byte_correlations.append(100)
        else:
            # Calcular similitud basada en diferencia absoluta
            diff = abs(a[i] - b[i])
            similarity = max(0, 100 - (diff / 255) * 100)
            byte_correlations.append(similarity)
    
    correlation_similarity = sum(byte_correlations) / len(byte_correlations) if byte_correlations else 0
    
    # Método 3: Patrones de bits (intermedio)
    bit_patterns_a = [bin(a[i])[2:].zfill(8) for i in range(min(len(a), len(b)))]
    bit_patterns_b = [bin(b[i])[2:].zfill(8) for i in range(min(len(a), len(b)))]
    
    pattern_matches = 0
    total_patterns = len(bit_patterns_a) * 8
    
    for i in range(len(bit_patterns_a)):
        for j in range(8):
            if bit_patterns_a[i][j] == bit_patterns_b[i][j]:
                pattern_matches += 1
    
    pattern_similarity = (pattern_matches / total_patterns) * 100 if total_patterns > 0 else 0
    
    # Combinar los tres métodos con pesos más estrictos
    final_similarity = (
        hamming_similarity * 0.6 +      # 60% peso al método más estricto
        correlation_similarity * 0.3 +   # 30% peso al método intermedio
        pattern_similarity * 0.1         # 10% peso al método más tolerante
    )
    
    return int(final_similarity)

# ============================================================================
# SCHEDULER FUNCTIONS
# ============================================================================

def _auto_close_attendance():
    """
    Marca checkOutTime=NOW() a todas las asistencias del día que quedaron abiertas
    cuando pasó la hora de cierre (22:00 L–V, 20:00 Sáb). Domingos no se atiende.
    """
    try:
        now = lima_now()
        dow = now.weekday()  # 0=Mon..6=Sun
        close_hhmm = (22, 0) if dow in (0,1,2,3,4) else ((20,0) if dow == 5 else None)
        if not close_hhmm:
            return  # domingo

        start = now.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
        end   = now.replace(hour=23, minute=59, second=59, microsecond=999000).astimezone(timezone.utc)

        with pg_conn() as conn, conn.cursor() as cur:
            cur.execute("""
                UPDATE attendance
                   SET "checkOutTime" = NOW()
                 WHERE "checkOutTime" IS NULL
                   AND "checkInTime" BETWEEN %s AND %s
                   AND (EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'America/Lima')) > %s
                        OR (EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'America/Lima')) = %s
                            AND EXTRACT(MINUTE FROM (NOW() AT TIME ZONE 'America/Lima')) >= %s))
            """, (start, end, close_hhmm[0], close_hhmm[0], close_hhmm[1]))
            conn.commit()
            print(f"[AUTO-CLOSE] filas actualizadas: {cur.rowcount}")
    except Exception as e:
        print(f"[AUTO-CLOSE][ERROR] {e}")

# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(title="ZKTeco Fingerprint Service", version="1.0.0")

# Global variables
device: Optional[ZKDevice] = None
sdk_lock = threading.Lock()
_device_inited = False
_device_opened = False

@app.on_event("startup")
def startup_event():
    """Application startup event"""
    # 1) Initialize database and detect columns
    global USER_COL, CREATEDCOL, UPDATEDCOL, HAS_ID
    try:
        with pg_conn() as conn, conn.cursor() as cur:
            cur.execute(DDL)
            conn.commit()
        USER_COL, CREATEDCOL, UPDATEDCOL, HAS_ID = _detect_cols()
        print(f"[INIT] columnas -> user:{USER_COL} created:{CREATEDCOL} updated:{UPDATEDCOL} has_id:{HAS_ID}")
    except Exception as e:
        print(f"[INIT][WARN] No se pudo preparar/verificar la DB: {e}")

    # 2) Initialize device
    global device
    try:
        device = ZKDevice()
        print("[INIT] ZKDevice inicializado correctamente")
    except Exception as e:
        print(f"[INIT][ERROR] Error inicializando ZKDevice: {e}")
        device = None

    # 3) Initialize scheduler if available
    if SCHED_AVAILABLE:
        try:
            sched = BackgroundScheduler(timezone="America/Lima")
            # Run every 10 minutes and also at exact closing time
            sched.add_job(_auto_close_attendance, CronTrigger(minute="0/10"))
            sched.add_job(_auto_close_attendance, CronTrigger(hour=22, minute=0, day_of_week="mon-fri"))
            sched.add_job(_auto_close_attendance, CronTrigger(hour=20, minute=0, day_of_week="sat"))
            sched.start()
            print("[SCHED] auto-close iniciado")
        except Exception as e:
            print("[SCHED][WARN] No se pudo iniciar el scheduler:", e)

# ============================================================================
# DEVICE ENDPOINTS
# ============================================================================

@app.post("/device/open")
def device_open():
    """Open fingerprint device"""
    global device, _device_inited, _device_opened
    with sdk_lock:
        device = device or ZKDevice()
        rc = device.init()
        cnt = device.get_count()
        print(f"[DEBUG] init={rc} count={cnt}")

        if rc not in (0, 1):
            return {"ok": False, "code": rc, "message": f"Init error {rc}"}
        _device_inited = True

        if cnt <= 0:
            return {"ok": False, "code": -3, "message": "No hay dispositivos"}

        if _device_opened and device.handle:
            return {"ok": True, "code": 1, "alreadyOpen": True, "message": "Ya abierto"}

        rc2 = device.open(0)
        _device_opened = rc2 == 0
        return {
            "ok": _device_opened,
            "code": rc2 if rc2 != 0 else 0,
            "alreadyOpen": False,
            "message": ("OK" if rc2 == 0 else f"Open error {rc2}"),
        }

@app.post("/device/capture")
def device_capture():
    """Capture fingerprint"""
    global device, _device_opened
    with sdk_lock:
        # If device is not open, try to open it automatically
        if device is None or device.handle is None:
            device = device or ZKDevice()
            rc = device.init()
            if rc not in (0, 1):
                return {"ok": False, "code": rc, "message": f"Init error {rc}"}
            
            cnt = device.get_count()
            if cnt <= 0:
                return {"ok": False, "code": -3, "message": "No hay dispositivos disponibles"}
            
            rc2 = device.open(0)
            if rc2 != 0:
                return {"ok": False, "code": rc2, "message": f"Error abriendo dispositivo: {rc2}"}
            
            _device_opened = True
            print("[DEBUG] Dispositivo abierto automáticamente")
        
        ok, data = device.capture_template()
        if ok:
            return {"ok": True, "template": data["template"], "size": data["len"]}
        return {"ok": False, **data}

@app.post("/device/close")
def device_close():
    """Close device"""
    global device, _device_opened
    with sdk_lock:
        if device:
            try:
                device.close()
            except Exception:
                pass
        _device_opened = False
        return {"ok": True, "message": "Device closed"}

@app.post("/device/terminate")
def device_terminate():
    """Terminate device"""
    global device, _device_inited, _device_opened
    with sdk_lock:
        if device:
            device.close()
            device.terminate()
            device = None
        _device_opened = False
        _device_inited = False
    return {"ok": True}

# ============================================================================
# FINGERPRINT ENDPOINTS
# ============================================================================

@app.get("/fingerprint/status/{user_id}")
def fingerprint_status(user_id: str):
    """Check if user has fingerprint registered"""
    try:
        has = db_get_template(user_id) is not None
        return {"ok": True, "hasFingerprint": has}
    except Exception as e:
        return {"ok": False, "hasFingerprint": False, "message": f"Error DB: {e}"}

@app.post("/register-fingerprint")
def register_fingerprint(payload: FingerprintData):
    """Register single fingerprint"""
    try:
        tpl = base64.b64decode(payload.fingerprint)
    except Exception:
        return JSONResponse(
            {"ok": False, "message": "template inválido (base64)"}, status_code=400
        )

    try:
        db_upsert_template(payload.user_id, tpl)
        return {"ok": True, "message": "Huella registrada/reemplazada"}
    except pg_errors.ForeignKeyViolation:
        return JSONResponse(
            {"ok": False, "message": "Usuario no existe en la tabla users"},
            status_code=400,
        )
    except OperationalError:
        return JSONResponse(
            {"ok": False, "message": "Base de datos no disponible"}, status_code=503
        )
    except Exception as e:
        return JSONResponse(
            {"ok": False, "message": f"Error registrando: {e}"}, status_code=500
        )

@app.post("/register-fingerprint-multi")
def register_fingerprint_multi(payload: MultiFingerprintData):
    """Register multiple fingerprints and merge them"""
    if not payload.fingerprints:
        return JSONResponse({"ok": False, "message": "Sin muestras"}, status_code=400)
    try:
        samples = [base64.b64decode(b) for b in payload.fingerprints if b]
        if len(samples) < 2:
            return JSONResponse(
                {"ok": False, "message": "Se requieren al menos 2 muestras"},
                status_code=400,
            )

        zk = device if (device and device.lib) else ZKDevice()
        tpl, meta = zk.merge_templates(samples)

        db_upsert_template(payload.user_id, tpl)
        return {"ok": True, "message": "Huella registrada", **meta}
    except pg_errors.ForeignKeyViolation:
        return JSONResponse(
            {"ok": False, "message": "Usuario no existe en users"}, status_code=400
        )
    except OperationalError:
        return JSONResponse(
            {"ok": False, "message": "Base de datos no disponible"}, status_code=503
        )
    except Exception as e:
        return JSONResponse(
            {"ok": False, "message": f"Error registrando: {e}"}, status_code=500
        )

@app.post("/verify-fingerprint")
def verify_fingerprint(payload: FingerprintData):
    """Verify fingerprint against stored template"""
    stored = db_get_template(payload.user_id)
    if not stored:
        return {
            "ok": False,
            "match": False,
            "score": 0,
            "threshold": MATCH_THRESHOLD,
            "message": "Usuario sin huella registrada",
        }

    # Decode live fingerprint
    try:
        live = base64.b64decode(payload.fingerprint)
    except Exception:
        return {
            "ok": False,
            "match": False,
            "score": 0,
            "threshold": MATCH_THRESHOLD,
            "message": "template inválido (base64)",
        }

    try:
        # Use global device instance
        global device, _device_opened
        if not device:
            device = ZKDevice()
        
        # Auto-open device if needed
        if device.handle is None:
            rc = device.init()
            if rc not in (0, 1):
                return {
                    "ok": False, "match": False, "score": 0,
                    "threshold": MATCH_THRESHOLD, "message": f"Init error {rc}",
                }
            
            cnt = device.get_count()
            if cnt <= 0:
                return {
                    "ok": False, "match": False, "score": 0,
                    "threshold": MATCH_THRESHOLD, "message": "No hay dispositivos disponibles",
                }
            
            rc2 = device.open(0)
            if rc2 != 0:
                return {
                    "ok": False, "match": False, "score": 0,
                    "threshold": MATCH_THRESHOLD, "message": f"Error abriendo dispositivo: {rc2}",
                }
            
            _device_opened = True
            print("[DEBUG] Dispositivo abierto automáticamente para verificación")
        
        lib = device.lib

        # Try to initialize DB matcher
        db_init_success = False
        if hasattr(lib, "ZKFPM_DBInit") and not FORCE_FALLBACK:
            try:
                try:
                    init_rc = lib.ZKFPM_DBInit(2048)
                except TypeError:
                    init_rc = lib.ZKFPM_DBInit()
                
                if init_rc in (0, 1):
                    db_init_success = True
                    print(f"[DEBUG] DBInit exitoso: {init_rc}")
                else:
                    print(f"[DEBUG] DBInit falló con código: {init_rc}")
                    
            except Exception as e:
                print(f"[DEBUG] Excepción en DBInit: {e}")

        # Use DBMatch if available
        if hasattr(lib, "ZKFPM_DBMatch") and db_init_success and not FORCE_FALLBACK:
            try:
                lib.ZKFPM_DBMatch.argtypes = [
                    POINTER(c_ubyte), c_int, POINTER(c_ubyte), c_int,
                ]
                lib.ZKFPM_DBMatch.restype = c_int

                a = (c_ubyte * len(stored)).from_buffer_copy(stored)
                b = (c_ubyte * len(live)).from_buffer_copy(live)
                score = int(lib.ZKFPM_DBMatch(a, len(stored), b, len(live)))

                if score >= 0:
                    match = score >= MATCH_THRESHOLD
                    return {
                        "ok": True,
                        "match": bool(match),
                        "score": score,
                        "threshold": MATCH_THRESHOLD,
                        "len_stored": len(stored),
                        "len_live": len(live),
                        "message": "Coincide" if match else "No coincide",
                    }
                else:
                    print(f"[DEBUG] DBMatch error: {score}, usando fallback")
            except Exception as e:
                print(f"[DEBUG] Excepción en DBMatch: {e}, usando fallback")

    except Exception as e:
        return {
            "ok": False, "match": False, "score": 0,
            "threshold": MATCH_THRESHOLD, "len_stored": len(stored),
            "len_live": len(live), "message": f"Excepción en matcher: {e}",
        }

    # Fallback similarity algorithm
    similarity_score = calculate_similarity(stored, live)
    match = similarity_score >= MATCH_THRESHOLD
    
    # Debug information
    print(f"[DEBUG] Similitud calculada: {similarity_score}% (threshold: {MATCH_THRESHOLD}%)")
    print(f"[DEBUG] Longitudes - stored: {len(stored)}, live: {len(live)}")
    print(f"[DEBUG] Match: {match}")
    
    # Determine fallback reason
    fallback_reason = "Forzado por configuración" if FORCE_FALLBACK else "DBMatch no disponible"
    
    return {
        "ok": True,
        "match": bool(match),
        "score": similarity_score,
        "threshold": MATCH_THRESHOLD,
        "len_stored": len(stored),
        "len_live": len(live),
        "fallback_used": True,
        "fallback_reason": fallback_reason,
        "similarity_algorithm": "Enhanced Hamming Distance",
        "message": f"{'Coincide' if match else 'No coincide'} (fallback - {fallback_reason})",
    }

@app.post("/identify-fingerprint")
def identify_fingerprint(payload: IdentifyPayload):
    """Identify fingerprint (1:N matching)"""
    # Decode live fingerprint
    try:
        live = base64.b64decode(payload.fingerprint)
    except Exception:
        return JSONResponse({"ok": False, "message": "template inválido (base64)"}, status_code=400)

    # Get all templates
    rows = db_all_templates()
    if not rows:
        return {"ok": True, "match": False, "message": "No hay huellas enroladas"}

    # Prepare matcher
    global device
    if not device:
        device = ZKDevice()
    lib = device.lib

    use_dbmatch = False
    if hasattr(lib, "ZKFPM_DBInit") and hasattr(lib, "ZKFPM_DBMatch") and not FORCE_FALLBACK:
        try:
            try:
                init_rc = lib.ZKFPM_DBInit(2048)
            except TypeError:
                init_rc = lib.ZKFPM_DBInit()
            use_dbmatch = init_rc in (0, 1)
        except Exception:
            use_dbmatch = False

    best_user, best_score = None, -1

    if use_dbmatch:
        lib.ZKFPM_DBMatch.argtypes = [POINTER(c_ubyte), c_int, POINTER(c_ubyte), c_int]
        lib.ZKFPM_DBMatch.restype = c_int
        B = (c_ubyte * len(live)).from_buffer_copy(live)
        for uid, stored in rows:
            A = (c_ubyte * len(stored)).from_buffer_copy(stored)
            sc = int(lib.ZKFPM_DBMatch(A, len(stored), B, len(live)))
            if sc >= 0 and sc > best_score:
                best_score, best_user = sc, uid
    else:
        for uid, stored in rows:
            sc = calculate_similarity(stored, live)
            if sc > best_score:
                best_score, best_user = sc, uid

    match = best_score >= MATCH_THRESHOLD
    return {
        "ok": True,
        "match": bool(match),
        "user_id": best_user if match else None,
        "score": int(best_score),
        "threshold": MATCH_THRESHOLD,
        "fallback_used": not use_dbmatch or FORCE_FALLBACK,
    }

# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@app.get("/health")
def health():
    """Health check endpoint"""
    return {"ok": True, "status": "healthy"}

@app.get("/debug/info")
def debug_info():
    """Debug information endpoint"""
    global device
    dev = device or ZKDevice()
    return {
        "dll_loaded": True,
        "dll_path_hint": os.environ.get("ZK_DLL_PATH") or "auto",
        "arch_bits": 64 if ctypes.sizeof(ctypes.c_void_p) == 8 else 32,
        "has_acq5": getattr(dev, "has_acq5", False),
        "has_dbmatch": getattr(dev, "has_dbmatch", False),
        "has_dbinit": getattr(dev, "has_dbinit", False),
        "has_merge": getattr(dev, "has_merge", False),
        "db_inited": getattr(dev, "db_inited", False),
        "width": dev.width,
        "height": dev.height,
        "match_threshold": MATCH_THRESHOLD,
        "force_fallback": FORCE_FALLBACK,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

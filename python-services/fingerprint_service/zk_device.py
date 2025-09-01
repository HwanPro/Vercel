# fingerprint_service/zk_device.py
import os, base64, ctypes, time
from ctypes import c_int, c_void_p, c_ubyte, POINTER, byref

# ---------------- Carga robusta de libzkfp ----------------
import platform
ARCH_BITS = 64 if platform.architecture()[0].startswith("64") else 32

def _has_symbols(dll, names):
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
    # 1) Candidatos: primero ENV (si lo pones al .dll exacto del demo), luego rutas conocidas.
    candidates = [
        os.environ.get("ZK_DLL_PATH"),
        r"C:\Program Files\ZKTeco\ZKFinger SDK\lib\libzkfp.dll",
        r"C:\Program Files (x86)\ZKTeco\ZKFinger SDK\lib\libzkfp.dll",
        r"C:\Windows\System32\libzkfp.dll",
        r"C:\Windows\SysWOW64\libzkfp.dll",
    ]

    required = ["ZKFPM_Init", "ZKFPM_OpenDevice", "ZKFPM_GetDeviceCount"]

    last_err = None
    tried = []
    for p in candidates:
        if not p or not os.path.exists(p):
            continue
        try:
            dll = ctypes.WinDLL(p)
            if not _has_symbols(dll, required):
                tried.append(f"{p} (sin ZKFPM_*)")
                continue

            # Chequeo de arquitectura: no es 100% fiable, pero al menos registramos
            # (si te equivocas de bitness, normalmente ni carga o crashea)
            print(f"[DLL] Cargada: {p} (py={ARCH_BITS}bit)")
            return dll
        except Exception as e:
            last_err = e
            tried.append(f"{p} ({e})")

    raise RuntimeError(
        "No pude cargar una libzkfp válida. Intentos:\n  - " + "\n  - ".join(tried) +
        (f"\nÚltimo error: {last_err}" if last_err else "")
    )

class ZKDevice:
    def __init__(self):
        self.lib = _load_lib()

        # ---- firmas básicas
        self.lib.ZKFPM_Init.restype = c_int
        self.lib.ZKFPM_Terminate.restype = None

        self.lib.ZKFPM_GetDeviceCount.argtypes = []
        self.lib.ZKFPM_GetDeviceCount.restype  = c_int

        self.lib.ZKFPM_OpenDevice.argtypes = [c_int]
        self.lib.ZKFPM_OpenDevice.restype  = c_void_p  # HANDLE

        self.lib.ZKFPM_CloseDevice.argtypes = [c_void_p]
        self.lib.ZKFPM_CloseDevice.restype  = None

        # GetParameters(handle, code, buffer, size*)
        self.lib.ZKFPM_GetParameters.argtypes = [c_void_p, c_int, c_void_p, POINTER(c_int)]
        self.lib.ZKFPM_GetParameters.restype  = c_int

        # ¿Tiene AcquireFingerprint con 5 args?
        self.has_acq5 = hasattr(self.lib, "ZKFPM_AcquireFingerprint")
        if self.has_acq5:
            try:
                self.lib.ZKFPM_AcquireFingerprint.argtypes = [
                    c_void_p,                       # handle
                    POINTER(c_ubyte), c_int,        # image*, cbImage
                    POINTER(c_ubyte), POINTER(c_int)# template*, cbTemplate*
                ]
                self.lib.ZKFPM_AcquireFingerprint.restype = c_int
            except Exception:
                self.has_acq5 = False  # por si no acepta esa firma

        # Fallbacks opcionales
        self.has_acq_image = hasattr(self.lib, "ZKFPM_AcquireFingerprintImage")
        if self.has_acq_image:
            self.lib.ZKFPM_AcquireFingerprintImage.argtypes = [c_void_p, POINTER(c_ubyte), POINTER(c_int)]
            self.lib.ZKFPM_AcquireFingerprintImage.restype  = c_int

        self.has_generate = hasattr(self.lib, "ZKFPM_GenerateTemplate")
        if self.has_generate:
            self.lib.ZKFPM_GenerateTemplate.argtypes = [POINTER(c_ubyte), POINTER(c_ubyte), POINTER(c_int)]
            self.lib.ZKFPM_GenerateTemplate.restype  = c_int

        # ---- DB helpers (para evitar duplicados y verificar)
        self.has_dbinit  = hasattr(self.lib, "ZKFPM_DBInit")
        self.has_dbfree  = hasattr(self.lib, "ZKFPM_DBFree")
        self.has_dbmatch = hasattr(self.lib, "ZKFPM_DBMatch")
        if self.has_dbmatch:
            self.lib.ZKFPM_DBMatch.argtypes = [
                POINTER(c_ubyte), c_int,
                POINTER(c_ubyte), c_int
            ]
            self.lib.ZKFPM_DBMatch.restype  = c_int

        self.db_inited = False

        # estado
        self.handle: c_void_p | None = None
        self.width = None
        self.height = None
        self.img_capacity = None
    def _score(self, a: bytes, b: bytes) -> int:
        if self.has_dbmatch:
            A = (c_ubyte * len(a)).from_buffer_copy(a)
            B = (c_ubyte * len(b)).from_buffer_copy(b)
            return int(self.lib.ZKFPM_DBMatch(A, len(a), B, len(b)))
        return 1 if a == b else 0
    def _pick_best(self, tpls: list[bytes]) -> bytes:
        if len(tpls) == 1:
            return tpls[0]
        scores = []
        for i, ti in enumerate(tpls):
            s = 0
            for j, tj in enumerate(tpls):
                if i == j: 
                    continue
                s += self._score(ti, tj)
            scores.append(s)
            idx = max(range(len(tpls)), key=lambda i: scores[i])
            return tpls[idx]    


    # ----------------- utilidades
    def init(self) -> int:
        return self.lib.ZKFPM_Init()

    def terminate(self):
        try:
            if self.db_inited and self.has_dbfree:
                self.lib.ZKFPM_DBFree()
            self.lib.ZKFPM_Terminate()
        except Exception:
            pass
        self.db_inited = False

    def get_count(self) -> int:
        return self.lib.ZKFPM_GetDeviceCount()

    def _get_int_param(self, code: int) -> int:
        """ZKFPM_GetParameters(handle, code, buf, size*) con entero de 4 bytes"""
        val = c_int(0)
        sz  = c_int(ctypes.sizeof(c_int))
        r = self.lib.ZKFPM_GetParameters(self.handle, code, byref(val), byref(sz))
        if r != 0:
            raise RuntimeError(f"GetParameters({code})={r}")
        return val.value

    def open(self, index: int = 0) -> int:
        h = self.lib.ZKFPM_OpenDevice(index)
        self.handle = h
        if not h:
            return -1

        # Inicializa DB interna si está disponible
        if self.has_dbinit and not self.db_inited:
            try:
                self.lib.ZKFPM_DBInit(2048)
                self.db_inited = True
            except Exception:
                self.db_inited = False

        # width(1) / height(2). Si falla, valores típicos de ZK9500
        try:
            self.width  = self._get_int_param(1)
            self.height = self._get_int_param(2)
        except Exception:
            self.width, self.height = 256, 360

        self.img_capacity = int(self.width * self.height)  # 8bpp
        return 0

    def close(self):
        if self.handle:
            try:
                self.lib.ZKFPM_CloseDevice(self.handle)
            finally:
                self.handle = None

        if self.db_inited and self.has_dbfree:
            try:
                self.lib.ZKFPM_DBFree()
            except:
                pass
            self.db_inited = False

    def _err_msg(self, code: int) -> str:
        return {
            -1: "Cancelado",
            -2: "Error del sistema",
            -3: "Sin dispositivo",
            -4: "Parámetro inválido",
            -5: "No se pudo abrir",
            -6: "Falló inicialización",
            -7: "No soportado",
            -8: "No abierto/Parámetro inválido/Timeout",
            -10:"Timeout de captura",
        }.get(code, f"Error {code}")

    # ----------------- captura robusta con reintentos
    def _err(self, code: int) -> str:
        return self._err_msg(code)

    def capture_template(self, timeout_s: float = 8.0):
        if not self.handle:
            return False, {"code": -100, "message": "Dispositivo no abierto"}

        IMG_N = self.img_capacity or (256 * 360)
        img_buf  = (c_ubyte * IMG_N)()
        tmpl_cap = 8192
        tmpl_buf = (c_ubyte * tmpl_cap)()
        tmpl_sz  = c_int(tmpl_cap)

        t0 = time.time()
        last = None
        while (time.time() - t0) < timeout_s:
            # 1) Preferido: AcquireFingerprint (5 args)
            if self.has_acq5:
                r = self.lib.ZKFPM_AcquireFingerprint(
                    self.handle,
                    img_buf, c_int(IMG_N),
                    tmpl_buf, byref(tmpl_sz)
                )
                if r == 0:
                    data = bytes(tmpl_buf[: tmpl_sz.value])
                    b64  = base64.b64encode(data).decode("ascii")
                    return True, {"template": b64, "len": tmpl_sz.value}
                last = {"code": r, "message": f"Acquire error {r}: {self._err(r)}"}
                if r in (-8, -10):
                    time.sleep(0.12)
                    continue
                break

            # 2) (opcional) Fallback: Acquire image + GenerateTemplate
            if hasattr(self.lib, "ZKFPM_AcquireFingerprintImage") and hasattr(self.lib, "ZKFPM_GenerateTemplate"):
                img_len = c_int(IMG_N)
                r = self.lib.ZKFPM_AcquireFingerprintImage(self.handle, img_buf, byref(img_len))
                if r == 0:
                    tmpl_sz = c_int(tmpl_cap)
                    r2 = self.lib.ZKFPM_GenerateTemplate(img_buf, tmpl_buf, byref(tmpl_sz))
                    if r2 == 0:
                        data = bytes(tmpl_buf[: tmpl_sz.value])
                        b64  = base64.b64encode(data).decode("ascii")
                        return True, {"template": b64, "len": tmpl_sz.value}
                    last = {"code": r2, "message": f"GenerateTemplate {self._err(r2)}"}
                    break
                last = {"code": r, "message": self._err(r)}
                if r in (-8, -10):
                    time.sleep(0.12)
                    continue
                break

            return False, {"code": -99, "message": "DLL sin métodos de captura soportados"}

        return False, last or {"code": -10, "message": "Timeout"}

    # ----------------- comparación de plantillas
    def match_templates(self, a: bytes, b: bytes) -> int:
        """
        Devuelve el 'score' si la DLL lo soporta, >0 == match.
        Si no existe DBMatch, devolvemos 1 si son iguales (fallback).
        """
        if self.has_dbmatch:
            pa = (c_ubyte * len(a)).from_buffer_copy(a)
            pb = (c_ubyte * len(b)).from_buffer_copy(b)
            return int(self.lib.ZKFPM_DBMatch(pa, len(a), pb, len(b)))
        return 1 if a == b else 0

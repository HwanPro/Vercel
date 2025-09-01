from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from fingerprint_service.zk_device import capture_fingerprint, enroll_fingerprint
from fingerprint_service.crud import get_user_by_id, save_fingerprint, get_fingerprints_by_user
from fingerprint_service.db import get_db
from fingerprint_service.utils import get_logger

# Inicialización de FastAPI y logger
app = FastAPI(title="Fingerprint Service")
logger = get_logger()


# --- MODELOS ---
class EnrollRequest(BaseModel):
    user_id: str


class VerifyRequest(BaseModel):
    user_id: str


# --- RUTAS ---
@app.post("/fingerprint/enroll")
def enroll(data: EnrollRequest, db: Session = Depends(get_db)):
    """
    Registrar huella digital para un usuario.
    """
    user = get_user_by_id(db, data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Capturar huella desde el dispositivo
    template = enroll_fingerprint()
    save_fingerprint(db, data.user_id, template)

    logger.info(f"Huella registrada para user_id={data.user_id}")
    return {"status": "success", "message": "Fingerprint enrolled"}


@app.post("/fingerprint/verify")
def verify(data: VerifyRequest, db: Session = Depends(get_db)):
    """
    Verificar huella digital de un usuario.
    """
    user = get_user_by_id(db, data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Capturar huella en tiempo real
    captured = capture_fingerprint()

    # Recuperar huellas guardadas del usuario
    stored = get_fingerprints_by_user(db, data.user_id)
    if not stored:
        raise HTTPException(status_code=404, detail="No fingerprints for this user")

    # Comparación (versión simplificada: igualdad exacta de template)
    if any(fp.template == captured for fp in stored):
        logger.info(f"Fingerprint match para user_id={data.user_id}")
        return {"status": "success", "message": "Fingerprint verified"}
    else:
        logger.warning(f"Fingerprint mismatch para user_id={data.user_id}")
        raise HTTPException(status_code=401, detail="Fingerprint mismatch")

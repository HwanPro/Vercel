# funciones: get_user_by_id, save_fingerprint, get_fingerprints_by_user
# ... existing code ...
import uuid
from sqlalchemy.orm import Session
from .models import User, Fingerprint

def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.query(User).filter(User.id == user_id).first()

def save_fingerprint(db: Session, user_id: str, template: str) -> Fingerprint:
    fp = Fingerprint(id=str(uuid.uuid4()), userId=user_id, template=template)
    db.add(fp)
    db.commit()
    db.refresh(fp)
    return fp

def get_fingerprints_by_user(db: Session, user_id: str) -> list[Fingerprint]:
    return db.query(Fingerprint).filter(Fingerprint.userId == user_id).all()
# ... existing code ...
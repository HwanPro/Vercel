import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    # Carga .env del root del repo (../../.env) como fallback
    try:
        from dotenv import load_dotenv
        import os as _os
        _root_dir = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", ".."))
        _dotenv_path = _os.path.join(_root_dir, ".env")
        if _os.path.exists(_dotenv_path):
            load_dotenv(_dotenv_path)
            DATABASE_URL = os.getenv('DATABASE_URL')
        else:
            # Intentar carga genérica (cwd)
            load_dotenv()
            DATABASE_URL = os.getenv('DATABASE_URL')
    except Exception:
        pass

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no está configurado. Configura tu conexión de Railway (Postgres).")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
# ... existing code ...
import logging
import os

def get_logger():
    logger = logging.getLogger("fingerprint_service")
    if logger.handlers:
        return logger

    # LOG_FILE puede venir por .env; default a logs/app.log en el root
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    default_log_path = os.path.join(root_dir, "logs", "app.log")
    log_path = os.getenv("LOG_FILE", default_log_path)

    os.makedirs(os.path.dirname(log_path), exist_ok=True)

    logger.setLevel(logging.DEBUG)
    fmt = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')

    fh = logging.FileHandler(log_path, encoding="utf-8")
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    sh = logging.StreamHandler()
    sh.setFormatter(fmt)
    logger.addHandler(sh)

    return logger
# ... existing code ...
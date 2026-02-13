import logging
from logging.handlers import RotatingFileHandler

logger = logging.getLogger("app_logger")
logger.setLevel(logging.INFO)

handler = RotatingFileHandler("logs/app.log", maxBytes=1000000, backupCount=3)
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)

logger.addHandler(handler)

def get_logger():
    return logger

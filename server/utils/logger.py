from loguru import logger as _loguru_logger
import sys


def setup_logger(name: str):
    _loguru_logger.remove()
    _loguru_logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan> | {message}",
        level="DEBUG",
        colorize=True,
    )
    _loguru_logger.add(
        "logs/pipeline.log",
        rotation="10 MB",
        retention="7 days",
        level="INFO",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name} | {message}",
    )
    return _loguru_logger.bind(name=name)
"""
utils/serializer.py
────────────────────
Converts MongoDB documents to JSON-safe dicts.
Handles: datetime, ObjectId, numpy types, NaN/Inf.
"""

import math
from datetime import datetime, date

try:
    from bson import ObjectId
    HAS_BSON = True
except ImportError:
    HAS_BSON = False

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False


def serialize_doc(doc: dict) -> dict:
    """Recursively make a single MongoDB document JSON-serializable."""
    if doc is None:
        return {}
    return {k: _serialize(v) for k, v in doc.items()}


def serialize_docs(docs: list) -> list:
    """Serialize a list of MongoDB documents."""
    return [serialize_doc(d) for d in docs]


def _serialize(val):
    """Convert a single value to a JSON-safe type."""
    if val is None:
        return None

    # Dates and datetimes
    if isinstance(val, datetime):
        return val.isoformat()
    if isinstance(val, date):
        return val.isoformat()

    # MongoDB ObjectId
    if HAS_BSON and isinstance(val, ObjectId):
        return str(val)

    # Numpy types
    if HAS_NUMPY:
        if isinstance(val, np.integer):
            return int(val)
        if isinstance(val, np.floating):
            f = float(val)
            if math.isnan(f) or math.isinf(f):
                return None
            return f
        if isinstance(val, np.bool_):
            return bool(val)
        if isinstance(val, np.ndarray):
            return [_serialize(v) for v in val.tolist()]

    # Plain Python float — guard against NaN/Inf
    if isinstance(val, float):
        if math.isnan(val) or math.isinf(val):
            return None
        return val

    # Nested dict
    if isinstance(val, dict):
        return {k: _serialize(v) for k, v in val.items()}

    # List or tuple
    if isinstance(val, (list, tuple)):
        return [_serialize(v) for v in val]

    return val
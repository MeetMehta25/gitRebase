import math
from typing import Dict, Any

def make_decision(
    walk_forward: Dict[str, Any],
    overfitting: Dict[str, Any],
    monte_carlo: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Converts validation outputs into a single actionable signal 
    (ACCEPT / CAUTION / REJECT / ERROR).
    """
    
    # 1. Extract Key Metrics safely
    wf = walk_forward or {}
    ov = overfitting or {}
    mc = monte_carlo or {}
    
    # Check for underlying errors or missing inputs
    if wf.get("error") or mc.get("error") or ov.get("error"):
        return {
            "decision": "ERROR",
            "confidence": 0.0,
            "confidence_pct": 0,
            "risk_level": "Unknown",
            "summary": "Validation failed due to insufficient data or system error.",
            "warnings": ["Validation pipeline error"],
            "deployable": False
        }

    try:
        consistency_score = float(wf.get("fold_consistency", wf.get("consistency_score", 50.0)))
        overfit_score = float(ov.get("score", ov.get("overfit_score", 50.0)))
        risk_score = float(mc.get("risk_score", 50.0))
        num_folds = int(wf.get("num_folds", len(wf.get("folds", []))))
        
        # NaNs check
        if math.isnan(consistency_score) or math.isnan(overfit_score) or math.isnan(risk_score):
            raise ValueError("NaN encountered in metrics")
            
    except (ValueError, TypeError):
        return {
            "decision": "ERROR",
            "confidence": 0.0,
            "confidence_pct": 0,
            "risk_level": "Unknown",
            "summary": "Validation failed due to insufficient data or system error.",
            "warnings": ["Invalid metric encountered (NaN or missing)"],
            "deployable": False
        }

    # 2. Normalize values to 0-1 scale
    stability_norm = max(0.0, min(1.0, consistency_score / 100.0))
    overfit_norm = max(0.0, min(1.0, overfit_score / 100.0))
    risk_norm = max(0.0, min(1.0, risk_score / 100.0))

    # 3. Compute Final Confidence (weighted formula)
    confidence = 0.4 * stability_norm + 0.3 * (1.0 - overfit_norm) + 0.3 * (1.0 - risk_norm)
    confidence = float(max(0.0, min(1.0, confidence)))

    # Degrade confidence if < 2 folds
    if num_folds < 2:
        confidence = float(max(0.0, confidence - 0.2))

    # 4. Decision Logic
    if confidence > 0.7 and risk_score < 40.0:
        decision = "ACCEPT"
    elif 0.4 <= confidence <= 0.7:
        decision = "CAUTION"
    else:
        decision = "REJECT"

    # 5. Risk Level Classification
    if risk_score < 30.0:
        risk_level = "Low"
    elif risk_score <= 70.0:
        risk_level = "Moderate"
    else:
        risk_level = "High"

    # 6 & 7. Generate Summary and Warnings
    warnings = []
    
    if overfit_score > 60.0:
        warnings.append("High overfitting detected")
    if risk_score > 70.0:
        warnings.append("Significant downside risk in simulations")
    if stability_norm < 0.5:
        warnings.append("Inconsistent performance across time")
    if num_folds < 2:
        warnings.append("Insufficient data folds for reliable validation")

    if decision == "ACCEPT":
        summary = "Strategy shows stable performance with low overfitting and controlled downside risk."
    elif decision == "CAUTION":
        summary = "Strategy exhibits moderate instability and potential overfitting under stress."
    else:
        summary = "Strategy demonstrates high risk and poor generalization."

    if len(warnings) >= 2 and decision != "REJECT":
        summary = "Strategy has multiple concerning risk factors despite moderate overall confidence."

    deployable = (decision == "ACCEPT")
    confidence_pct = int(round(confidence * 100))

    return {
        "decision": decision,
        "confidence": round(confidence, 4),
        "confidence_pct": confidence_pct,
        "risk_level": risk_level,
        "summary": summary,
        "warnings": warnings,
        "deployable": deployable
    }

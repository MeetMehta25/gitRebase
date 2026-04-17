"""
Data Validator.
Runs quality checks before data is written to MongoDB.
Returns a validation report — the pipeline logs this per run.
"""

import pandas as pd
from datetime import datetime, timezone
from dataclasses import dataclass, field
from utils.logger import setup_logger

logger = setup_logger(__name__)


@dataclass
class ValidationReport:
    ticker: str
    passed: bool
    record_count: int
    date_range: tuple[str, str]
    issues: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    quality_score: float = 1.0   # 0.0 → 1.0
    validated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "ticker": self.ticker,
            "passed": self.passed,
            "record_count": self.record_count,
            "date_range": self.date_range,
            "issues": self.issues,
            "warnings": self.warnings,
            "quality_score": self.quality_score,
            "validated_at": self.validated_at,
        }


def validate_ohlcv(records: list[dict], ticker: str) -> ValidationReport:
    """Full OHLCV quality check. Returns ValidationReport."""
    issues   = []
    warnings = []

    if not records:
        return ValidationReport(
            ticker=ticker, passed=False, record_count=0,
            date_range=("", ""), issues=["No records returned"], quality_score=0.0
        )

    df = pd.DataFrame(records)
    df["date"] = pd.to_datetime(df["date"], utc=True)
    df = df.sort_values("date")

    record_count = len(df)
    date_range   = (str(df["date"].min().date()), str(df["date"].max().date()))

    # ── Hard failures ────────────────────────────────────────────────────────
    if record_count < 30:
        issues.append(f"Too few records ({record_count}) — need ≥30 for indicators")

    required_cols = ["open", "high", "low", "close", "volume"]
    for col in required_cols:
        if col not in df.columns:
            issues.append(f"Missing required column: {col}")
        elif df[col].isna().sum() > record_count * 0.05:
            issues.append(f"Column '{col}' has >{5:.0f}% NaN values")

    # ── Warnings (don't fail, just flag) ─────────────────────────────────────
    # Gaps
    expected_trading_days = pd.bdate_range(df["date"].min(), df["date"].max())
    gap_pct = 1 - record_count / max(len(expected_trading_days), 1)
    if gap_pct > 0.1:
        warnings.append(f"Data gap rate {gap_pct:.1%} — possible delisting or data issue")

    # Staleness
    days_since_last = (datetime.now(timezone.utc) - df["date"].max()).days
    if days_since_last > 5:
        warnings.append(f"Last data point is {days_since_last} days old")

    # Zero volume days
    if "volume" in df.columns:
        zero_vol_pct = (df["volume"] == 0).sum() / record_count
        if zero_vol_pct > 0.05:
            warnings.append(f"{zero_vol_pct:.1%} of rows have zero volume")

    # Sudden price spike check
    returns = df["close"].pct_change().abs()
    spikes = (returns > 0.5).sum()  # >50% single-day move
    if spikes > 0:
        warnings.append(f"{spikes} single-day price moves >50% — check for splits/errors")

    # ── Quality score ─────────────────────────────────────────────────────────
    score = 1.0
    score -= len(issues)   * 0.25
    score -= len(warnings) * 0.05
    score -= gap_pct       * 0.2
    score = max(0.0, min(1.0, score))

    passed = len(issues) == 0

    report = ValidationReport(
        ticker=ticker,
        passed=passed,
        record_count=record_count,
        date_range=date_range,
        issues=issues,
        warnings=warnings,
        quality_score=round(score, 3),
    )

    if passed:
        logger.info(f"Validation PASSED for {ticker} | score={score:.2f} | {record_count} rows | {date_range}")
    else:
        logger.error(f"Validation FAILED for {ticker} | issues={issues}")

    return report
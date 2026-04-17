import pandas as pd
from config.database import get_db


def load_market_data(ticker, timeframe="1d"):

    db = get_db()

    cursor = db.market_data.find(
        {"ticker": ticker}
    ).sort("date", 1)

    data = list(cursor)

    if not data:
        raise ValueError(f"No data found for {ticker}")

    df = pd.DataFrame(data)

    # normalize column names
    df = df.rename(columns={
        "date": "timestamp"
    })

    df["timestamp"] = pd.to_datetime(df["timestamp"])

    df = df[[
        "timestamp",
        "open",
        "high",
        "low",
        "close",
        "volume",
        "adj_close"
    ]]

    df.set_index("timestamp", inplace=True)

    return df
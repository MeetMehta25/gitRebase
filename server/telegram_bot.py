import os
import yfinance as yf
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import ApplicationBuilder, MessageHandler, CommandHandler, ContextTypes, filters

load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Send me an NSE ticker like RELIANCE.NS, INFY.NS, TCS.NS and I will return stock data."
    )


async def stock_lookup(update: Update, context: ContextTypes.DEFAULT_TYPE):

    ticker = update.message.text.upper().strip()

    try:
        stock = yf.Ticker(ticker)

        info = stock.info
        hist = stock.history(period="1d")

        if hist.empty:
            await update.message.reply_text("Stock not found.")
            return

        price = hist["Close"].iloc[-1]
        currency = info.get("currency", "INR")

        message = f"""
📈 Stock: {ticker}

Price: {currency} {price:.2f}
Company: {info.get('longName','N/A')}
Market Cap: {info.get('marketCap','N/A')}
Sector: {info.get('sector','N/A')}
Industry: {info.get('industry','N/A')}
52W High: {info.get('fiftyTwoWeekHigh','N/A')}
52W Low: {info.get('fiftyTwoWeekLow','N/A')}
Volume: {info.get('volume','N/A')}
"""

        await update.message.reply_text(message)

    except Exception as e:
        await update.message.reply_text("Error fetching stock data.")


def main():

    app = ApplicationBuilder().token(TOKEN).build()

    app.add_handler(CommandHandler("start", start))

    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, stock_lookup))

    print("Bot is running...")

    app.run_polling()


if __name__ == "__main__":
    main()
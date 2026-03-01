"""
bot.py - sBTC Sentinel Telegram Bot
Commands: /start, /sentiment, /price, /help
"""

import os
import logging
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from sentiment import analyze_sentiment, get_btc_price, get_fear_greed_index

load_dotenv()

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


def score_to_emoji(score):
    if score <= 20:
        return "EXTREME FEAR"
    elif score <= 40:
        return "FEAR"
    elif score <= 60:
        return "NEUTRAL"
    elif score <= 80:
        return "GREED"
    else:
        return "EXTREME GREED"


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome = (
        "sBTC Sentinel\n"
        "━━━━━━━━━━━━━━━━━━\n"
        "AI-Powered Bitcoin Intelligence for Stacks DeFi\n\n"
        "/sentiment - AI sentiment analysis\n"
        "/price - Current BTC price\n"
        "/help - All commands\n\n"
        "Built on Stacks - Powered by AI"
    )
    await update.message.reply_text(welcome)


async def sentiment_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Analyzing market sentiment with AI...")

    try:
        analysis = analyze_sentiment()

        response = (
            f"sBTC Sentinel Report\n"
            f"━━━━━━━━━━━━━━━━━━\n\n"
            f"Sentiment Score: {analysis['score']}/100\n"
            f"{score_to_emoji(analysis['score'])}\n\n"
            f"AI Analysis:\n{analysis['summary']}\n\n"
            f"sBTC Outlook:\n{analysis['sbtc_outlook']}\n\n"
            f"Suggestion:\n{analysis['recommendation']}\n\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"BTC: ${analysis['raw_data']['btc']['price_usd']:,} "
            f"({analysis['raw_data']['btc']['change_24h']:+.2f}%)\n"
            f"Fear/Greed: {analysis['raw_data']['fear_greed']['value']}/100\n"
            f"sBTC TVL: ${analysis['raw_data']['sbtc']['tvl_usd']:,}\n"
        )

        await update.message.reply_text(response)

    except Exception as e:
        logger.error(f"Error in sentiment command: {e}")
        await update.message.reply_text("Error fetching sentiment data. Please try again.")


async def price_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        btc = get_btc_price()
        fng = get_fear_greed_index()

        change_emoji = "UP" if btc["change_24h"] >= 0 else "DOWN"

        response = (
            f"Bitcoin Price\n"
            f"━━━━━━━━━━━━━━━━━━\n\n"
            f"Price: ${btc['price_usd']:,}\n"
            f"{change_emoji} 24h Change: {btc['change_24h']:+.2f}%\n"
            f"Fear/Greed: {fng['value']}/100 ({fng['classification']})\n"
        )

        await update.message.reply_text(response)

    except Exception as e:
        logger.error(f"Error in price command: {e}")
        await update.message.reply_text("Error fetching price data.")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    help_text = (
        "sBTC Sentinel Commands\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        "/sentiment - Full AI sentiment analysis\n"
        "/price - Quick BTC price check\n"
        "/help - Show this message\n\n"
        "About:\n"
        "sBTC Sentinel uses AI to analyze Bitcoin market "
        "sentiment and provides insights for sBTC holders "
        "on the Stacks ecosystem.\n\n"
        "Sentiment data is stored on-chain via Clarity smart contracts."
    )
    await update.message.reply_text(help_text)


def main():
    token = os.getenv("TELEGRAM_BOT_TOKEN")

    if not token:
        print("ERROR: TELEGRAM_BOT_TOKEN not found in .env file!")
        return

    app = Application.builder().token(token).build()

    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("sentiment", sentiment_command))
    app.add_handler(CommandHandler("price", price_command))
    app.add_handler(CommandHandler("help", help_command))

    print("sBTC Sentinel bot is running! Press Ctrl+C to stop.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
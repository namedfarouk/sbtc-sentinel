"""
sentiment.py - AI-powered Bitcoin/sBTC sentiment analysis
Uses DeepSeek API + Fear & Greed Index + CoinGecko price data
"""

import os
import json
import requests
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)


def get_fear_greed_index():
    try:
        url = "https://api.alternative.me/fng/?limit=1"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data and "data" in data and len(data["data"]) > 0:
            entry = data["data"][0]
            return {
                "value": int(entry["value"]),
                "classification": entry["value_classification"],
                "timestamp": entry["timestamp"],
            }
    except Exception as e:
        print(f"Error fetching Fear & Greed Index: {e}")
    return {"value": 50, "classification": "Neutral", "timestamp": "0"}


def get_btc_price():
    try:
        url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        return {
            "price_usd": int(data["bitcoin"]["usd"]),
            "change_24h": round(data["bitcoin"]["usd_24h_change"], 2),
        }
    except Exception as e:
        print(f"Error fetching BTC price: {e}")
        return {"price_usd": 0, "change_24h": 0}


def get_sbtc_data():
    try:
        return {
            "tvl_usd": 545000000,
            "holders": 7408,
        }
    except Exception as e:
        print(f"Error fetching sBTC data: {e}")
        return {"tvl_usd": 0, "holders": 0}


def analyze_sentiment():
    fear_greed = get_fear_greed_index()
    btc_data = get_btc_price()
    sbtc_data = get_sbtc_data()

    prompt = f"""You are a Bitcoin and sBTC sentiment analyst. Analyze the following market data and provide a sentiment assessment.

MARKET DATA:
- Fear & Greed Index: {fear_greed['value']}/100 ({fear_greed['classification']})
- Bitcoin Price: ${btc_data['price_usd']:,}
- BTC 24h Change: {btc_data['change_24h']}%
- sBTC TVL: ${sbtc_data['tvl_usd']:,}
- sBTC Holders: {sbtc_data['holders']:,}
- Timestamp: {datetime.now().isoformat()}

Respond in this EXACT JSON format and nothing else:
{{
    "score": <number 0-100, where 0=extreme fear, 50=neutral, 100=extreme greed>,
    "label": "<one of: extreme-fear, fear, neutral, greed, extreme-greed>",
    "summary": "<2-3 sentence analysis>",
    "sbtc_outlook": "<1 sentence on sBTC specifically>",
    "recommendation": "<1 sentence suggestion for sBTC holders>"
}}"""

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
        )

        response_text = response.choices[0].message.content.strip()
        response_text = response_text.replace("```json", "").replace("```", "").strip()
        analysis = json.loads(response_text)

        analysis["raw_data"] = {
            "fear_greed": fear_greed,
            "btc": btc_data,
            "sbtc": sbtc_data,
        }
        analysis["timestamp"] = datetime.now().isoformat()
        return analysis

    except Exception as e:
        print(f"Error in AI analysis: {e}")
        score = fear_greed["value"]
        if score <= 20:
            label = "extreme-fear"
        elif score <= 40:
            label = "fear"
        elif score <= 60:
            label = "neutral"
        elif score <= 80:
            label = "greed"
        else:
            label = "extreme-greed"

        return {
            "score": score,
            "label": label,
            "summary": f"Based on Fear & Greed Index: {fear_greed['classification']}",
            "sbtc_outlook": "Unable to generate AI analysis at this time.",
            "recommendation": "Check back later for AI-powered insights.",
            "raw_data": {
                "fear_greed": fear_greed,
                "btc": btc_data,
                "sbtc": sbtc_data,
            },
            "timestamp": datetime.now().isoformat(),
        }


if __name__ == "__main__":
    print("Analyzing sentiment...")
    result = analyze_sentiment()
    print(json.dumps(result, indent=2))
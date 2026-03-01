"""
api.py - REST API for the sBTC Sentinel web dashboard
"""

from flask import Flask, jsonify
from flask_cors import CORS
from sentiment import analyze_sentiment, get_btc_price, get_fear_greed_index, get_sbtc_data

app = Flask(__name__)
CORS(app)


@app.route("/api/sentiment", methods=["GET"])
def sentiment():
    try:
        data = analyze_sentiment()
        return jsonify({"status": "ok", "data": data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/price", methods=["GET"])
def price():
    try:
        data = get_btc_price()
        return jsonify({"status": "ok", "data": data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/fear-greed", methods=["GET"])
def fear_greed():
    try:
        data = get_fear_greed_index()
        return jsonify({"status": "ok", "data": data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/sbtc", methods=["GET"])
def sbtc():
    try:
        data = get_sbtc_data()
        return jsonify({"status": "ok", "data": data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "sbtc-sentinel-api"})


if __name__ == "__main__":
    print("sBTC Sentinel API running on http://localhost:5001")
    app.run(host="0.0.0.0", port=5001, debug=True)
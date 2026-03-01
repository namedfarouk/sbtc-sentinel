# sBTC Sentinel

AI-Powered Bitcoin Intelligence for Stacks DeFi

## What is sBTC Sentinel?

sBTC Sentinel is an on-chain sentiment oracle that uses AI to analyze Bitcoin/sBTC market sentiment and stores the results on the Stacks blockchain via a Clarity smart contract. Other dApps can read this data to make informed decisions.

## Features

- AI-powered sentiment analysis (DeepSeek API)
- On-chain sentiment oracle (Clarity smart contract)
- Telegram bot for instant sentiment checks (@sentinel_stacks_bot)
- Web dashboard with live market data
- Bitcoin price + Fear & Greed Index integration
- sBTC TVL and holder tracking

## Tech Stack

- **Smart Contract**: Clarity (Stacks)
- **Backend**: Python, Flask, DeepSeek API
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Bot**: python-telegram-bot
- **Blockchain**: @stacks/connect, @stacks/transactions

## Quick Start

### Smart Contract
```bash
cd contracts
clarinet check
npm install
npm test
```

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add your API keys
python api.py
python bot.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Contract Functions

| Function | Type | Description |
|---|---|---|
| submit-sentiment | Public | Submit a new sentiment snapshot (authorized only) |
| get-latest-sentiment | Read-only | Get the most recent sentiment data |
| get-snapshot | Read-only | Get a historical snapshot by ID |
| get-snapshot-count | Read-only | Total snapshots recorded |
| add-updater | Public | Authorize a new data submitter |
| remove-updater | Public | Remove an authorized submitter |
| is-updater | Read-only | Check if address is authorized |

## Architecture
```
Users --> Telegram Bot / Web Dashboard
              |
         Python Backend (Flask API)
              |
    DeepSeek AI + CoinGecko + Fear & Greed Index
              |
    Stacks Blockchain (Clarity Contract)
```

## Built For

Stacks Getting Started Grant - Q1 2026

## License

MIT
```

Save. Now create one more file — right-click **backend** folder → **New File** → name it `.env.example`:
```
DEEPSEEK_API_KEY=your_deepseek_api_key_here 
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here 
STACKS_API_URL=https://api.testnet.hiro.so 
CONTRACT_ADDRESS=your_stacks_address_here 
CONTRACT_NAME=sentinel 

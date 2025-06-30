# Forex Predictions Client (Next.js)

This is the web client for the Forex Predictions platform. It provides a modern, interactive interface for viewing forex predictions, searching symbols, analyzing sentiment, and visualizing model statistics.

---

## Features
- Search and view major forex currency pairs
- Interactive charts and model statistics
- Sentiment analysis integration
- Fast, modern UI built with Next.js and TypeScript

---

## Getting Started

### 1. Install dependencies
```bash
pnpm install
# or
yarn install
# or
npm install
```

### 2. Set up your Alpha Vantage API key
This app requires an [Alpha Vantage](https://www.alphavantage.co/support/#api-key) API key **with a paid subscription** to fetch forex data.

- Get your API key here: [Alpha Vantage Get API Key](https://www.alphavantage.co/support/#api-key)
- Add your key to a `.env.local` file in the `client/` directory:
  ```env
  NEXT_PUBLIC_ALPHA_VANTAGE_KEY=your_api_key_here
  ```

### 3. Run the development server
```bash
pnpm dev
# or
yarn dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to use the app.

---

## Project Structure
- `app/` - Main Next.js app and routes
- `components/` - UI and chart components
- `lib/` - Utility functions
- `public/` - Static assets

---

## Notes
- You must have a valid Alpha Vantage API key with a paid subscription for full functionality.
- For backend/API details, see the [server README](../server/README.md).
- For ML model training, see the [ml-training README](../ml-training/README.md).

---

## License
MIT License. See the main project `LICENSE` file for details.

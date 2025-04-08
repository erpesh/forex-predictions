import { NextResponse } from "next/server"

const TIME_PERIODS = {
  "1d": 24,
  "5d": 120,
  "1m": 30,
  "6m": 180,
  "1y": 365,
}

const OFFSETS = { // Offset in hours
  '1d': 1,
  '5d': 1,
  '1m': 24,
  '6m': 24,
  '1y': 24,
}

const formatTimeframeToPeriod = (timeframe: string) => {
  switch (timeframe) {
    case '1d':
      return 'm15'
    case '5d':
      return 'h4'
    case '1m':
      return 'd1'
    case '6m':
      return 'd1'
    default:
      return 'd1' 
  }
}

// const ALPHA_VANTAGE_API_KEY = "GVS645A0H1CNI10V"
const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY
const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;

  const { searchParams } = new URL(request.url)
  const timeframe = searchParams.get("timeframe") || "1m"
  const dataPoints = TIME_PERIODS[timeframe] || 30
  const period = formatTimeframeToPeriod(timeframe)

  const historicalData = await fetchHistoricalData(symbol, dataPoints)
  const sentimentData = await fetchSentimentData(symbol) // Fetch sentiment for both currencies
  const predictions = await getPredictionsFromFastAPI(symbol, historicalData, timeframe, period, sentimentData)

  return NextResponse.json({
    historical: historicalData,
    predictions: predictions,
  })
}

// Fetch historical forex data from Alpha Vantage
async function fetchHistoricalData(symbol: string, dataPoints: number) {
  const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${symbol.substring(0, 3)}&to_symbol=${symbol.substring(3)}&apikey=${ALPHA_VANTAGE_API_KEY}`
  
  const response = await fetch(url)
  const data = await response.json()

  if (data.Note || !data["Time Series FX (Daily)"]) {
    return []
  }

  const timeSeries = data["Time Series FX (Daily)"]

  const historicalData = Object.entries(timeSeries).slice(0, dataPoints).map(([time, values]) => {
    return {
      time: time, // The date is in format YYYY-MM-DD
      price: parseFloat(values["4. close"]), // Close price of the forex pair
      ohlcv: {
        Open: parseFloat(values["1. open"]),
        High: parseFloat(values["2. high"]),
        Low: parseFloat(values["3. low"]),
        Close: parseFloat(values["4. close"]),
        Volume: 10000, // Placeholder volume value
      }
    }
  })

  historicalData.reverse() // Reverse the array so that the oldest data is first
  return historicalData
}

// Fetch sentiment data for both currencies in the pair
async function fetchSentimentData(symbol: string) {
  const baseCurrency = symbol.substring(0, 3)
  const quoteCurrency = symbol.substring(3)

  // Fetch sentiment for base and quote currencies
  const sentimentBaseCurrency = await fetchSentimentForCurrency(baseCurrency)
  const sentimentQuoteCurrency = await fetchSentimentForCurrency(quoteCurrency)

  // Combine sentiment data by averaging scores
  const combinedSentiment = sentimentBaseCurrency.concat(sentimentQuoteCurrency)
  const averageSentiment = combinedSentiment.reduce((acc, val) => acc + val.sentiment_score, 0) / combinedSentiment.length

  console.log('avgsen', averageSentiment)

  return averageSentiment
}

// Fetch news sentiment for a single currency
async function fetchSentimentForCurrency(currency: string) {
  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=FOREX:${currency}&apikey=${ALPHA_VANTAGE_API_KEY}&limit=50`
  
  const response = await fetch(url)
  const data = await response.json()

  if (data.Note) {
    console.error("Alpha Vantage error:", data.Note)
    return []
  }

  const sentimentScores = data.feed?.map(article => ({
    sentiment_score: article.overall_sentiment_score || 0,
    title: article.title,
    description: article.summary,
  })) || []

  return sentimentScores
}

// Function to fetch predictions from FastAPI
async function getPredictionsFromFastAPI(symbol: string, historicalData: any, timeframe: string, period: string, sentimentData: number) {
  const body = {
    data: historicalData.map((data: any) => data.ohlcv),
    sentiment: sentimentData, // Sentiment data used as an input feature
  }
  
  const response = await fetch(`${FASTAPI_URL}/predict/${symbol}/${period}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error("Failed to get predictions from FastAPI")
  }

  const data = await response.json()
  return formatPredictions(data.predictions, timeframe, sentimentData)
}

// Format predictions with sentiment-enhanced predictions
function formatPredictions(predictions: any[], timeframe: string, sentimentData: number) {
  const now = new Date()
  const formattedPredictions: { name: string; points: { time: string; value: number }[] }[] = []

  const points = predictions.map((pred, index) => {
      const date = new Date(now)
      date.setHours(date.getHours() + (1 + index) * OFFSETS[timeframe]) // Add interval in hours

      const adjustedPred = pred
      // Adjust prediction based on sentiment score
      console.log(sentimentData)

      return {
        time: date.toISOString(),
        value: adjustedPred,
      }
    })

    formattedPredictions.push({
      name: `LSTM`,
      points: points
    })
  
  return formattedPredictions
}

import { NextResponse } from "next/server"

interface OHLCV {
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}

interface HistoricalDataPoint {
  time: Date
  price: number;
  ohlcv: OHLCV;
}

export interface Prediction {
  time: Date,
  value: number,
}

export interface PredictionData {
  name: string
  points: Prediction[]
}

const TIME_PERIODS: Record<string, number> = {
  "1d": 24,
  "5d": 120,
  "1m": 30,
  "3m": 90,
}

const formatTimeframeToPeriod = (timeframe: string) => {
  switch (timeframe) {
    case '1d':
      return 'm15'
    case '5d':
      return 'h4'
    case '1m':
      return 'd1'
    case '3m':
      return 'd1'
    default:
      return 'd1' 
  }
}

const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY
const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;

  const { searchParams } = new URL(request.url)
  const timeframe = searchParams.get("timeframe") || "1m"
  const period = formatTimeframeToPeriod(timeframe)

  const historicalData = await fetchHistoricalData(symbol)
  const [sentimentScore, newsData, sentimentMessage] = await fetchSentimentData(symbol) // Fetch sentiment for both currencies
  const predictions = await getPredictionsFromFastAPI(symbol, historicalData, period, sentimentScore)

  return NextResponse.json({
    historical: historicalData.slice(-TIME_PERIODS[timeframe]), // Limit historical data to the specified timeframe
    predictions: predictions,
    newsData: newsData,
    sentiment: {
      score: sentimentScore,
      message: sentimentMessage,
    },
  })
}

// Fetch historical forex data from Alpha Vantage
async function fetchHistoricalData(symbol: string): Promise<HistoricalDataPoint[]> {
  const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${symbol.substring(0, 3)}&to_symbol=${symbol.substring(3)}&apikey=${ALPHA_VANTAGE_API_KEY}`
  const response = await fetch(url)
  const data = await response.json()

  if (data.Note || !data["Time Series FX (Daily)"]) {
    return []
  }

  const timeSeries = data["Time Series FX (Daily)"]

  const historicalData = Object.entries(timeSeries).map(([time, values]) => {
    const typedValues = values as Record<string, string>; // Explicitly type 'values'
    return {
      time: (new Date(time)).toISOString().slice(0, -5), // The date is in format YYYY-MM-DD
      price: parseFloat(typedValues["4. close"]), // Close price of the forex pair
      ohlcv: {
        Open: parseFloat(typedValues["1. open"]),
        High: parseFloat(typedValues["2. high"]),
        Low: parseFloat(typedValues["3. low"]),
        Close: parseFloat(typedValues["4. close"]),
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
  const baseFeed = await fetchSentimentForCurrency(baseCurrency)
  const quoteFeed = await fetchSentimentForCurrency(quoteCurrency)

  // Calculate weighted sentiment for base currency
  const weightedBaseSentiment = calculateWeightedSentiment(baseFeed);
  
  // Calculate weighted sentiment for quote currency (invert sentiment for quote)
  const weightedQuoteSentiment = calculateWeightedSentiment(quoteFeed) * -1; // Invert the quote currency sentiment

  // Combine the weighted sentiments to get the overall sentiment score
  const combinedSentiment = weightedBaseSentiment + weightedQuoteSentiment;

  // Generate the sentiment message based on the combined sentiment score
  const sentimentMessage = generateSentimentMessage(combinedSentiment, [...baseFeed, ...quoteFeed]);

  return [
    combinedSentiment, 
    {[baseCurrency]: baseFeed, [quoteCurrency]: quoteFeed},
    sentimentMessage
  ]
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

  const feed = data.feed.map(article => {
    return {
      ...article,
      relevance: parseFloat(article.ticker_sentiment.find(t => t.ticker === `FOREX:${currency}`)?.relevance_score) || 0,
      sentiment_score : parseFloat(article.ticker_sentiment.find(t => t.ticker === `FOREX:${currency}`)?.ticker_sentiment_score) || 0,
    }
  })

  return feed
}

// Function to calculate the weighted sentiment score for each article
function calculateWeightedSentiment(sentimentData) {
  let totalSentiment = 0;
  let totalWeight = 0;

  sentimentData.forEach((article) => {
    const sentimentScore = article.sentiment_score;
    const relevance = parseFloat(article.relevance);

    // Weighted sentiment calculation: relevance * sentiment score
    totalSentiment += sentimentScore * relevance;
    totalWeight += relevance;
  });

  // Return weighted sentiment (normalized by the total weight)
  return totalWeight > 0 ? totalSentiment / totalWeight : 0;
}

interface PredictionResponse {
  LSTM_predictions: Prediction[],
  LSTM_sentiment_predictions: Prediction[],
}

// Function to fetch predictions from FastAPI
async function getPredictionsFromFastAPI(symbol: string, historicalData: HistoricalDataPoint[], period: string, sentimentScore: number) {
  const body = {
    data: historicalData.map((data) => data.ohlcv),
    sentimentScore: sentimentScore, // Sentiment data used as an input feature
  }
  
  const response = await fetch(`${API_URL}/predict/${symbol}/${period}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error("Failed to get predictions from FastAPI")
  }

  const data: PredictionResponse = await response.json()
  
  return [
    {
      name: `Machine Learning`,
      points: data.LSTM_predictions
    },
    {
      name: `ML with Sentiment`,
      points: data.LSTM_sentiment_predictions
    },
  ]
}

function generateSentimentMessage(averageSentiment: number, newsData): string {
  let sentimentMessage = '';
  let sentimentLabel = '';
  let sentimentDetails = '';

  // Define the sentiment categories based on the score ranges
  if (averageSentiment >= 0.5) {
    sentimentLabel = 'Very Bullish';
    sentimentMessage = 'The sentiment is overwhelmingly positive. The market appears highly optimistic about the currency pair\'s future performance.';
    sentimentDetails = 'Market sentiment is very strong, with positive expectations driving potential gains.';
  } else if (averageSentiment >= 0.35) {
    sentimentLabel = 'Bullish';
    sentimentMessage = 'The sentiment is strongly positive, suggesting that investors are confident in the direction of the currency pair.';
    sentimentDetails = 'There’s a clear upward trend in sentiment, with optimism prevailing in market outlook.';
  } else if (averageSentiment >= 0.15) {
    sentimentLabel = 'Somewhat Bullish';
    sentimentMessage = 'The sentiment is mildly positive, indicating that there is some optimism in the market, but not a strong consensus.';
    sentimentDetails = 'Investors are cautiously optimistic, but there’s still some hesitation in the market.';
  } else if (averageSentiment > -0.15) {
    sentimentLabel = 'Neutral';
    sentimentMessage = 'The sentiment is neutral, suggesting that the market is unsure or balanced about the currency pair\'s future movements.';
    sentimentDetails = 'There’s little directional movement in sentiment, with equal optimism and caution in the market.';
  } else if (averageSentiment > -0.35) {
    sentimentLabel = 'Somewhat Bearish';
    sentimentMessage = 'The sentiment is somewhat negative, indicating that there’s some pessimism in the market, but it is not overwhelming.';
    sentimentDetails = 'The outlook is cautious, with some concerns influencing the market’s expectations for the currency pair.';
  } else {
    sentimentLabel = 'Bearish';
    sentimentMessage = 'The sentiment is strongly negative, suggesting a lack of confidence in the currency pair\'s performance.';
    sentimentDetails = 'Market participants are concerned, with pessimistic views dominating the outlook for the currency pair.';
  }

  // Mention the most significant news (if any)
  let newsMention = '';
  if (newsData.length > 0) {
    // Sort news articles by relevance score to find the most significant ones
    const sortedNews = newsData.sort((a, b) => b.relevance - a.relevance);
    const significantNews = sortedNews.slice(0, 2); // Get top 2 most relevant news
    
    newsMention = '\nSignificant News: ';
    significantNews.forEach((article) => {
      newsMention += `- "${article.title}" (Relevance: ${article.relevance}): ${article.summary}\n`;
    });
  }

  // Return the full message with sentiment and news
  return `The current sentiment for the currency pair is ${sentimentLabel}. ${sentimentMessage} ${newsMention}Details: ${sentimentDetails}`;
}


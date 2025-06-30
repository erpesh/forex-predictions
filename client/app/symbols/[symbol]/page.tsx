import { Card } from "@/components/ui/card"
import Chart from "@/components/chart"
import Timeframes from "./timeframes"
import CurrencyNews from "@/components/currency-news"
import { SentimentAnalysis } from "@/components/sentiment-analysis"
import { ModelStatsCard } from "@/components/model-stats"
import {splitSymbol, getCurrencyName, dateDiff} from '@/lib/utils';
import { calculateStats } from "@/lib/stats"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export interface DataPoint {
  time: Date
  price: number
}

export interface Prediction {
  name: string
  points: DataPoint[]
}

// Fetch historical data and predictions
const fetchData = async (symbol: string, timeframe: string) => {
  try {
    const response = await fetch(
      `${SITE_URL}/api/symbols/${symbol}?timeframe=${timeframe}`
    )
    if (!response.ok) throw new Error("Failed to fetch data")
    return await response.json()
  } catch (error) {
    console.error("Error fetching data:", error)
    return null
  }
}

export default async function SymbolPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>
  searchParams: Promise<{ timeframe: string }>
}) {
  const { timeframe = "1m" } = await searchParams
  const { symbol } = await params

  const splitResult = splitSymbol(symbol)
  const base = splitResult?.base || "Unknown"
  const quote = splitResult?.quote || "Unknown"

  const data = await fetchData(symbol, timeframe)

  if (!data) {
    return <div>Failed to load data</div>
  }

  const { historical, predictions, newsData, sentiment } = data
  const averagePrice = historical.reduce((acc, point) => acc + point.price, 0) / historical.length
  const stats = calculateStats(historical, predictions);
  const predictionsTimeframe = dateDiff(predictions[0].points[0].time, predictions[0].points[predictions[0].points.length - 6].time)

  console.log(stats)

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <h1 className="text-2xl font-bold">{base + "/" + quote}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {getCurrencyName(base)} / {getCurrencyName(quote)}
        </p>
      </div>

      <Card className="p-4">

        <Chart historical={historical} predictions={predictions} timeframe={timeframe} symbol={symbol} />

        <div className="flex justify-between items-center">
          <Timeframes selectedTimeframe={timeframe} />
        </div>
      </Card>

      <div className={"flex gap-4"}>
        <ModelStatsCard
          timeframe={`${predictionsTimeframe.value} ${predictionsTimeframe.unit}`}
          currencyPair={symbol}
          averageValue={averagePrice}
          models={predictions.map((prediction, index) => ({
            name: prediction.name,
            mae: stats.mae[index],
            mse: stats.mse[index],
            directionAccuracy: stats.directionAccuracy[index],
          }))}
        />
        <SentimentAnalysis message={sentiment.message} score={sentiment.score} />
      </div>

      <CurrencyNews newsData={newsData} symbol={symbol} />
    </div>
  )
}

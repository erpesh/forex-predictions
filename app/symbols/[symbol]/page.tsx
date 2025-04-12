import { Card } from "@/components/ui/card"
import Chart from "@/components/chart"
import Timeframes from "./timeframes"
import CurrencyNews from "@/components/currency-news"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

const formatSymbol = (symbol: string) => symbol.replace(/([A-Z]{3})([A-Z]{3})/, "$1/$2")

export default async function SymbolPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>
  searchParams: Promise<{ timeframe: string }>
}) {
  const { timeframe = "1m" } = await searchParams
  const { symbol } = await params
  const formattedSymbol = formatSymbol(symbol)

  // Fetch historical data and predictions
  const fetchData = async () => {
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

  const data = await fetchData()

  if (!data) {
    return <div>Failed to load data</div>
  }

  const { historical, predictions, newsData } = data

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{formattedSymbol}</h1>
      </div>

      <Card className="p-4">

        <Chart data={historical} predictions={predictions} timeframe={timeframe} symbol={symbol}/>
        
        <div className="flex justify-between items-center">
          <Timeframes selectedTimeframe={timeframe} />
        </div>
      </Card>

      <CurrencyNews newsData={newsData} symbol={symbol}/>
    </div>
  )
}

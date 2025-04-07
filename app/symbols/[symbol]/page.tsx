import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import Chart from "@/components/chart"
import Timeframes from "./timeframes"


const PREDICTION_MODELS = [
  { name: "LSTM", color: "#22c55e" },
]

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
        `http://localhost:3000/api/symbols/${symbol}?timeframe=${timeframe}`
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

  const { historical, predictions } = data

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{formattedSymbol}</h1>
      </div>

      <Card className="p-4">

        <Chart data={historical} predictions={predictions} timeframe={timeframe} />
        
        <div className="flex justify-between items-center">
          <Timeframes selectedTimeframe={timeframe} />

          <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-lg">
            <span className="text-sm font-medium">Models:</span>
            {PREDICTION_MODELS.map((model) => (
              <div key={model.name} className="flex items-center">
                <Checkbox
                  id={model.name}
                />
                <label htmlFor={model.name} className="text-xs font-medium">{model.name.split(" ")[0]}</label>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

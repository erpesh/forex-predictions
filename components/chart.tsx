"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback, useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
  ReferenceLine,
} from "recharts"
import { Maximize2, Camera, TrendingUp, LineChartIcon } from "lucide-react"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Label } from "./ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { DataPoint, Prediction } from "@/app/symbols/[symbol]/page"

const NUM_OF_PREDICTIONS = 5 // Number of prediction models to show

// Define moving average periods
const MOVING_AVERAGES = [
  { period: 7, name: "7-Day MA", color: "#f43f5e" },
  { period: 14, name: "14-Day MA", color: "#8b5cf6" },
  { period: 30, name: "30-Day MA", color: "#ec4899" },
]

const PREDICTION_COLORS: { [key: string]: string } = {
  "Machine Learning": "#22c55e",
  "ML with Sentiment": "#f97316",
}

const Chart = ({
  historical,
  predictions,
  timeframe,
  symbol,
}: { historical: DataPoint[]; predictions: Prediction[]; timeframe: string; symbol?: string }) => {
  const [isFullChart, setIsFullChart] = useState(false)
  const [showMovingAverages, setShowMovingAverages] = useState<{ [key: number]: boolean }>({
    7: false,
    14: false,
    30: false,
  })

  const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null)

  // State to track visible prediction models
  const [visibleModels, setVisibleModels] = useState<string[]>(predictions.map((model) => model.name))

  // Calculate moving averages
  const calculateMovingAverage = useCallback((data: any[], period: number) => {
    return data.map((point, index) => {
      if (index < period - 1) return { ...point, [`ma${period}`]: null }

      let sum = 0
      for (let i = 0; i < period; i++) {
        sum += data[index - i].price || 0
      }

      return {
        ...point,
        [`ma${period}`]: sum / period,
      }
    })
  }, [])

  // Toggle moving average
  const toggleMovingAverage = (period: number) => {
    setShowMovingAverages((prev) => ({
      ...prev,
      [period]: !prev[period],
    }))
  }

  // Toggle prediction model visibility
  const togglePredictionModel = (modelName: string) => {
    setVisibleModels((prev) => {
      if (prev.includes(modelName)) {
        return prev.filter((name) => name !== modelName)
      } else {
        return [...prev, modelName]
      }
    })
  }

  // Handle brush change for range selection
  const handleBrushChange = (e: any) => {
    if (e && e.startIndex !== undefined && e.endIndex !== undefined) {
      setSelectedRange([e.startIndex, e.endIndex])
    } else {
      setSelectedRange(null)
    }
  }

  // Format time for display
  const formatTime = (time: string) => {
    if (!time) return ""

    const date = new Date(time)
    switch (timeframe) {
      case "1d":
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      case "5d":
        return `${date.toLocaleDateString("en-US", { weekday: "short" })} ${date.toLocaleTimeString("en-US", { hour: "2-digit" })}`
      case "1m":
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      case "6m":
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      case "1y":
        return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
      default:
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  // Prepare chart data with moving averages and aligned predictions
  const chartData = useMemo(() => {
    if (!historical || historical.length === 0) return []

    // Start with the original data
    let processedData = [...historical]

    // Calculate moving averages for each period
    MOVING_AVERAGES.forEach((ma) => {
      if (showMovingAverages[ma.period]) {
        processedData = calculateMovingAverage(processedData, ma.period)
      }
    })

    // Create a map to store all prediction points by time
    const predictionsByTime = new Map()

    // Process each model's predictions to start from the same point
    // Only include visible models
    predictions
      .filter((model) => visibleModels.includes(model.name))
      .forEach((modelPrediction) => {
        // Sort prediction points by time
        const sortedPoints = [...modelPrediction.points].sort(
          (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
        )

        // Add each prediction point to the map
        sortedPoints.forEach((point) => {
          if (!predictionsByTime.has(point.time)) {
            predictionsByTime.set(point.time, { time: point.time })
          }

          // Use the model name as the key for this prediction value
          predictionsByTime.get(point.time)[modelPrediction.name] = point.value
        })
      })

    // Convert the map to an array and sort by time
    const predictionPoints = Array.from(predictionsByTime.values()).sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    )

    // If prediction data matched historical data, merge the prediction points into the historical data
    const pastPredictions = predictionPoints.slice(0, predictionPoints.length - NUM_OF_PREDICTIONS);
    pastPredictions.reverse();
    const futurePredictions = predictionPoints.slice(predictionPoints.length - NUM_OF_PREDICTIONS);

    // Iterate processedData from the end to the beginning and merge corresponding past predictions into processed data values
    for (let i = 0; i < processedData.length; i++) {
      const j = processedData.length - 1 - i;
      processedData[j] = {...processedData[j], ...pastPredictions[i]} // Create a shallow copy of the object
    }

    return [...processedData, ...futurePredictions]
  }, [historical, predictions, showMovingAverages, calculateMovingAverage, visibleModels])

  // Get statistics for the selected range or full data
  const getStatistics = useMemo(() => {
    if (!historical || historical.length === 0) return { high: 0, low: 0, avg: 0 }

    let dataToUse = historical

    if (selectedRange) {
      dataToUse = historical.slice(selectedRange[0], selectedRange[1] + 1)
    }

    const prices = dataToUse.map((d) => d.price || 0).filter((p) => p > 0)

    if (prices.length === 0) return { high: 0, low: 0, avg: 0 }

    const high = Math.max(...prices)
    const low = Math.min(...prices)
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length

    return { high, low, avg }
  }, [historical, selectedRange])

  // Get current exchange rate
  const getCurrentRate = useMemo(() => {
    if (!historical || historical.length === 0) return 0
    return historical[historical.length - 1]?.price || 0
  }, [historical])

  // Format currency pair for display
  const formatCurrencyPair = useMemo(() => {
    if (!symbol) return { base: "USD", quote: "EUR" }

    // Handle formats like EURUSD, EUR/USD, etc.
    const cleanSymbol = symbol.replace("/", "")
    if (cleanSymbol.length === 6) {
      return {
        base: cleanSymbol.substring(0, 3),
        quote: cleanSymbol.substring(3, 6),
      }
    }

    return { base: "USD", quote: "EUR" }
  }, [symbol])

  return (
    <div className={`space-y-4 ${isFullChart ? "fixed inset-0 bg-background z-50 p-4" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="text-sm bg-muted px-2 py-1 rounded mr-4">
            <span className="font-medium">
              1 {formatCurrencyPair.base} = {getCurrentRate.toFixed(6)} {formatCurrencyPair.quote}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <LineChartIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <Tabs defaultValue="predictions">
                <TabsList className="w-full mb-2">
                  <TabsTrigger value="predictions" className="flex-1">
                    Predictions
                  </TabsTrigger>
                  <TabsTrigger value="indicators" className="flex-1">
                    Indicators
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="predictions" className="space-y-2">
                  <h3 className="font-medium mb-1">Prediction Models</h3>
                  <div className="space-y-2">
                    {predictions.map((model) => (
                      <div key={model.name} className="flex items-center space-x-2">
                        <Checkbox
                          id={`model-${model.name}`}
                          checked={visibleModels.includes(model.name)}
                          onCheckedChange={() => togglePredictionModel(model.name)}
                        />
                        <Label htmlFor={`model-${model.name}`} className="text-sm flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: PREDICTION_COLORS[model.name] }}
                          ></div>
                          {model.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="indicators" className="space-y-2">
                  <h3 className="font-medium mb-1">Moving Averages</h3>
                  <div className="space-y-2">
                    {MOVING_AVERAGES.map((ma) => (
                      <div key={ma.period} className="flex items-center space-x-2">
                        <Checkbox
                          id={`ma-${ma.period}`}
                          checked={showMovingAverages[ma.period]}
                          onCheckedChange={() => toggleMovingAverage(ma.period)}
                        />
                        <Label htmlFor={`ma-${ma.period}`} className="text-sm flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: ma.color }}></div>
                          {ma.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <TrendingUp className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="space-y-2">
                <h3 className="font-medium">Chart Statistics</h3>
                <div className="bg-muted p-3 rounded space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">High:</span>
                    <span className="font-medium">{getStatistics.high.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Low:</span>
                    <span className="font-medium">{getStatistics.low.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average:</span>
                    <span className="font-medium">{getStatistics.avg.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" disabled>
            <Camera className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setIsFullChart(!isFullChart)}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={`${isFullChart ? "flex-grow" : "h-[400px]"} mb-4`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="time" tickFormatter={formatTime} interval="preserveStartEnd" minTickGap={50} />
            <YAxis domain={["auto", "auto"]} tickFormatter={(value) => value.toFixed(4)} width={80} />
            <Tooltip
              labelFormatter={(label) => `Time: ${formatTime(label)}`}
              formatter={(value) => [value.toFixed(4), "Price"]}
            />
            <Legend />

            {/* Moving average lines */}
            {MOVING_AVERAGES.map(
              (ma) =>
                showMovingAverages[ma.period] && (
                  <Line
                    key={`ma-${ma.period}`}
                    type="monotone"
                    dataKey={`ma${ma.period}`}
                    stroke={ma.color}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={false}
                    name={ma.name}
                    connectNulls={true}
                  />
                ),
            )}

            {/* Main price line */}
            <Line
              type="linear"
              dataKey="price"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              name="Actual Price"
              connectNulls={true}
            />

            {/* Prediction lines with custom colors - only show visible models */}
            {predictions
              .filter((model) => visibleModels.includes(model.name))
              .map((modelPrediction) => (
                <Line
                  key={modelPrediction.name}
                  type="linear"
                  dataKey={modelPrediction.name}
                  stroke={PREDICTION_COLORS[modelPrediction.name]}
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                  name={`${modelPrediction.name} Prediction`}
                  connectNulls={true}
                />
              ))}

            {/* Range selector brush */}
            <Brush
              dataKey="time"
              height={15}
              stroke="#8884d8"
              tickFormatter={formatTime}
              onChange={handleBrushChange}
              startIndex={selectedRange ? selectedRange[0] : undefined}
              endIndex={selectedRange ? selectedRange[1] : undefined}
            />

            {/* Statistics reference lines */}
            {selectedRange && (
              <>
                <ReferenceLine
                  y={getStatistics.high}
                  stroke="#22c55e"
                  strokeDasharray="3 3"
                  label={{
                    value: `High: ${getStatistics.high.toFixed(4)}`,
                    position: "right",
                    fill: "#22c55e",
                    fontSize: 10,
                  }}
                />
                <ReferenceLine
                  y={getStatistics.low}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{
                    value: `Low: ${getStatistics.low.toFixed(4)}`,
                    position: "right",
                    fill: "#ef4444",
                    fontSize: 10,
                  }}
                />
                <ReferenceLine
                  y={getStatistics.avg}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{
                    value: `Avg: ${getStatistics.avg.toFixed(4)}`,
                    position: "right",
                    fill: "#f59e0b",
                    fontSize: 10,
                  }}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Chart

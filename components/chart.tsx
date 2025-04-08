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
import { Maximize2, Camera, TrendingUp } from "lucide-react"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Label } from "./ui/label"

// Define moving average periods
const MOVING_AVERAGES = [
  { period: 7, name: "7-Day MA", color: "#f43f5e" },
  { period: 14, name: "14-Day MA", color: "#8b5cf6" },
  { period: 30, name: "30-Day MA", color: "#ec4899" },
]

const Chart = ({ data, predictions, timeframe }: { data: any[]; predictions: any[]; timeframe: string }) => {
  const [isFullChart, setIsFullChart] = useState(false)
  const [showMovingAverages, setShowMovingAverages] = useState<{ [key: number]: boolean }>({
    7: false,
    14: false,
    30: false,
  })
  const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null)

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

  // Prepare chart data with moving averages
  const chartData = useMemo(() => {
    // Start with the original data
    let processedData = [...data]

    // Calculate moving averages for each period
    MOVING_AVERAGES.forEach((ma) => {
      if (showMovingAverages[ma.period]) {
        processedData = calculateMovingAverage(processedData, ma.period)
      }
    })

    // Add prediction data
    const combinedData = [
      ...processedData,
      ...predictions.flatMap((modelPrediction) =>
        modelPrediction.points.map((point: any) => ({
          time: point.time,
          [modelPrediction.name]: point.value,
        })),
      ),
    ]

    return combinedData
  }, [data, predictions, showMovingAverages, calculateMovingAverage])

  // Get statistics for the selected range or full data
  const getStatistics = useMemo(() => {
    if (!data || data.length === 0) return { high: 0, low: 0, avg: 0 }

    let dataToUse = data

    if (selectedRange) {
      dataToUse = data.slice(selectedRange[0], selectedRange[1] + 1)
    }

    const prices = dataToUse.map((d) => d.price || 0).filter((p) => p > 0)

    if (prices.length === 0) return { high: 0, low: 0, avg: 0 }

    const high = Math.max(...prices)
    const low = Math.min(...prices)
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length

    return { high, low, avg }
  }, [data, selectedRange])

  return (
    <div className={`space-y-4 ${isFullChart ? "fixed inset-0 bg-background z-50 p-4" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {selectedRange && (
            <div className="text-sm bg-muted px-2 py-1 rounded mr-4">
              <span className="text-muted-foreground">High: {getStatistics.high.toFixed(4)}</span>
              <span className="mx-2">|</span>
              <span className="text-muted-foreground">Low: {getStatistics.low.toFixed(4)}</span>
              <span className="mx-2">|</span>
              <span className="text-muted-foreground">Avg: {getStatistics.avg.toFixed(4)}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <TrendingUp className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="space-y-2">
                <h3 className="font-medium">Moving Averages</h3>
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
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon">
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

            {/* Prediction lines */}
            {predictions.map((modelPrediction) => (
              <Line
                key={modelPrediction.name}
                type="linear"
                dataKey={modelPrediction.name}
                stroke={modelPrediction.color || "#999"}
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
              height={30}
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

"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Maximize2, Camera } from "lucide-react"
import { useState } from "react"
import { Button } from "./ui/button"

const Chart = ({ data, predictions, timeframe }: { data: any[], predictions: any[], timeframe: string }) => {
  const [isFullChart, setIsFullChart] = useState(false)

  const formatTime = (time: string) => {
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

  return (
    <div className={`space-y-4 ${isFullChart ? "fixed inset-0 bg-background z-50 p-4" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
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
          <LineChart data={[...data, ...predictions.flatMap((modelPrediction) => modelPrediction.points.map((point: any) => ({
            time: point.time,
            [modelPrediction.name]: point.value
          })))]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="time" tickFormatter={formatTime} interval="preserveStartEnd" minTickGap={50} />
            <YAxis domain={["auto", "auto"]} tickFormatter={(value) => value.toFixed(4)} width={80} />
            <Tooltip labelFormatter={(label) => `Time: ${formatTime(label)}`} formatter={(value) => [value.toFixed(4), "Price"]} />
            <Legend />
            <Line type="linear" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={false} name="Actual Price" connectNulls={true} />
            {predictions.map((modelPrediction) => {
              return (
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
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Chart

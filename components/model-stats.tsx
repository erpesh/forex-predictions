"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InfoIcon, TrendingDownIcon, TrendingUpIcon, BarChart2Icon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ModelMetrics {
  name: string
  mae: number
  mse: number
  directionAccuracy: number
}

interface ModelStatsProps {
  timeframe?: string
  currencyPair?: string
  averageValue?: number // Average value of the currency pair
  models: [ModelMetrics, ModelMetrics] // Exactly two models
}

export function ModelStatsCard({
  timeframe,
  currencyPair,
  averageValue = 1.0, // Default to 1.0 (similar to EURUSD)
  models,
}: ModelStatsProps) {
  const [activeTab, setActiveTab] = useState<string>(models[0].name)

  // Calculate scale factor based on the average value
  // Using 1.0 as the reference (similar to EURUSD)
  const scaleFactor = averageValue / 1.0

  // Base thresholds for a currency with average value of 1.0 (like EURUSD)
  const baseThresholds = {
    // Error metrics (lower is better)
    mse: { excellent: 0.000001, good: 0.00001, average: 0.0001, poor: 0.001 },
    mae: { excellent: 0.0008, good: 0.002, average: 0.004, poor: 0.008 },
    // Accuracy metrics (higher is better)
    directionAccuracy: { excellent: 0.75, good: 0.65, average: 0.6, poor: 0.55 }, // Direction accuracy is relative, so no scaling needed
  }

  // Scale the thresholds based on the currency pair's average value
  const thresholds = {
    mse: {
      excellent: baseThresholds.mse.excellent * scaleFactor * scaleFactor, // MSE scales with square of the value
      good: baseThresholds.mse.good * scaleFactor * scaleFactor,
      average: baseThresholds.mse.average * scaleFactor * scaleFactor,
      poor: baseThresholds.mse.poor * scaleFactor * scaleFactor,
    },
    mae: {
      excellent: baseThresholds.mae.excellent * scaleFactor,
      good: baseThresholds.mae.good * scaleFactor,
      average: baseThresholds.mae.average * scaleFactor,
      poor: baseThresholds.mae.poor * scaleFactor,
    },
    // These metrics are relative, so they don't need scaling
    directionAccuracy: baseThresholds.directionAccuracy,
  }

  // Helper function to determine if error metrics are good (lower is better)
  const isErrorMetricGood = (value: number, metricName: "mse" | "mae") => {
    const threshold = thresholds[metricName]
    if (value <= threshold.excellent) return "excellent"
    if (value <= threshold.good) return "good"
    if (value <= threshold.average) return "average"
    if (value <= threshold.poor) return "poor"
    return "very-poor"
  }

  // Helper function to determine if accuracy metrics are good (higher is better)
  const isAccuracyMetricGood = (value: number, metricName: "directionAccuracy") => {
    const threshold = thresholds[metricName]
    if (value >= threshold.excellent) return "excellent"
    if (value >= threshold.good) return "good"
    if (value >= threshold.average) return "average"
    if (value >= threshold.poor) return "poor"
    return "very-poor"
  }

  // Generate interpretation for error metrics
  const getErrorMetricInterpretation = (value: number, metricName: string, quality: string) => {
    const metricFullNames: Record<string, string> = {
      mse: "Mean Squared Error",
      mae: "Mean Absolute Error",
    }

    const fullName = metricFullNames[metricName] || metricName

    // Format value based on metric type
    const formattedValue = metricName === "mse" ? value.toFixed(8) : value.toFixed(6)

    const currencyContext = currencyPair ? ` for ${currencyPair}` : ""

    switch (quality) {
      case "excellent":
        return `${fullName} is excellent at ${formattedValue}, indicating very high prediction accuracy${currencyContext}.`
      case "good":
        return `${fullName} is good at ${formattedValue}, showing strong predictive performance${currencyContext}.`
      case "average":
        return `${fullName} is average at ${formattedValue}, indicating acceptable prediction accuracy${currencyContext}.`
      case "poor":
        return `${fullName} is below average at ${formattedValue}, suggesting room for improvement${currencyContext}.`
      case "very-poor":
        return `${fullName} is high at ${formattedValue}, indicating the model may need significant improvement${currencyContext}.`
      default:
        return `${fullName}: ${formattedValue}`
    }
  }

  // Generate interpretation for accuracy metrics
  const getAccuracyMetricInterpretation = (value: number, metricName: string, quality: string) => {
    const metricFullNames: Record<string, string> = {
      directionAccuracy: "Direction Accuracy",
    }

    const fullName = metricFullNames[metricName] || metricName
    const formattedValue = `${(value * 100).toFixed(2)}%`

    const currencyContext = currencyPair ? ` for ${currencyPair}` : ""

    switch (quality) {
      case "excellent":
        return `${fullName} is excellent at ${formattedValue}, indicating very high predictive power${currencyContext}.`
      case "good":
        return `${fullName} is good at ${formattedValue}, showing strong model performance${currencyContext}.`
      case "average":
        return `${fullName} is average at ${formattedValue}, indicating acceptable predictive capability${currencyContext}.`
      case "poor":
        return `${fullName} is below average at ${formattedValue}, suggesting room for improvement${currencyContext}.`
      case "very-poor":
        return `${fullName} is low at ${formattedValue}, indicating the model may need significant improvement${currencyContext}.`
      default:
        return `${fullName}: ${formattedValue}`
    }
  }

  // Helper function to determine color based on metric quality
  const getMetricColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "text-green-600 dark:text-green-400"
      case "good":
        return "text-emerald-600 dark:text-emerald-400"
      case "average":
        return "text-blue-600 dark:text-blue-400"
      case "poor":
        return "text-amber-600 dark:text-amber-400"
      case "very-poor":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  // Helper function to get the appropriate icon
  const getMetricIcon = (metricType: "error" | "accuracy", quality: string) => {
    // For error metrics, lower is better (trending down is good)
    // For accuracy metrics, higher is better (trending up is good)
    const isGood =
      metricType === "error"
        ? quality === "excellent" || quality === "good"
        : quality === "excellent" || quality === "good"

    const colorClass = getMetricColor(quality)

    if (metricType === "error") {
      return isGood ? (
        <TrendingDownIcon className={`h-4 w-4 ${colorClass}`} />
      ) : (
        <TrendingUpIcon className={`h-4 w-4 ${colorClass}`} />
      )
    } else {
      return isGood ? (
        <TrendingUpIcon className={`h-4 w-4 ${colorClass}`} />
      ) : (
        <TrendingDownIcon className={`h-4 w-4 ${colorClass}`} />
      )
    }
  }

  // Helper function to get progress color
  const getProgressColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "bg-green-600"
      case "good":
        return "bg-emerald-600"
      case "average":
        return "bg-blue-600"
      case "poor":
        return "bg-amber-600"
      case "very-poor":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  // Helper function to normalize error metrics for progress bar
  // Lower values are better for error metrics, so we invert the scale
  const normalizeErrorMetric = (value: number, metricName: "mse" | "mae") => {
    let max

    switch (metricName) {
      case "mse":
        max = thresholds.mse.poor * 10
        break
      case "mae":
        max = thresholds.mae.poor * 10
        break
      default:
        max = 0.1
    }

    // Clamp value between 0 and max
    const clampedValue = Math.min(Math.max(value, 0), max)
    // Invert the scale (lower is better)
    return 100 - (clampedValue / max) * 100
  }

  // Helper function to normalize accuracy metrics for progress bar
  // Higher values are better for accuracy metrics
  const normalizeAccuracyMetric = (value: number, metricName: "directionAccuracy") => {
    let min, max

    switch (metricName) {
      case "directionAccuracy":
        min = 0.5 // Random guessing
        max = 1
        break
      default:
        min = 0
        max = 1
    }

    // Normalize to 0-100 scale, accounting for minimum threshold
    const normalizedValue = ((value - min) / (max - min)) * 100
    // Clamp between 0 and 100
    return Math.min(Math.max(normalizedValue, 0), 100)
  }

  // Render metrics for the active model
  const renderModelMetrics = (model: ModelMetrics) => {
    // Evaluate metrics
    const maeQuality = isErrorMetricGood(model.mae, "mae")
    const mseQuality = isErrorMetricGood(model.mse, "mse")
    const directionAccuracyQuality = isAccuracyMetricGood(model.directionAccuracy, "directionAccuracy")

    return (
      <div className="space-y-4">
        {/* MAE - Mean Absolute Error */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm">MAE</span>
              <Popover>
                <PopoverTrigger asChild>
                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3 text-sm">
                  <p className="font-medium">Mean Absolute Error</p>
                  <p className="mt-1 text-muted-foreground">
                    The average absolute difference between predicted values and actual values. It represents the
                    average magnitude of errors without considering their direction.
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Interpretation:</span> Lower values are better. MAE is measured in the
                    same units as the target variable.
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-1">
              <span className={cn("font-medium", getMetricColor(maeQuality))}>{model.mae.toFixed(6)}</span>
              {getMetricIcon("error", maeQuality)}
            </div>
          </div>
          <Progress
            value={normalizeErrorMetric(model.mae, "mae")}
            className="h-1.5"
            indicatorClassName={getProgressColor(maeQuality)}
          />
          <p className="text-xs text-muted-foreground">{getErrorMetricInterpretation(model.mae, "mae", maeQuality)}</p>
        </div>

        {/* MSE - Mean Squared Error */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm">MSE</span>
              <Popover>
                <PopoverTrigger asChild>
                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3 text-sm">
                  <p className="font-medium">Mean Squared Error</p>
                  <p className="mt-1 text-muted-foreground">
                    The average of squared differences between predicted values and actual values. MSE heavily penalizes
                    larger errors due to the squaring operation.
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Interpretation:</span> Lower values are better. MSE is measured in
                    squared units of the target variable.
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-1">
              <span className={cn("font-medium", getMetricColor(mseQuality))}>{model.mse.toFixed(8)}</span>
              {getMetricIcon("error", mseQuality)}
            </div>
          </div>
          <Progress
            value={normalizeErrorMetric(model.mse, "mse")}
            className="h-1.5"
            indicatorClassName={getProgressColor(mseQuality)}
          />
          <p className="text-xs text-muted-foreground">{getErrorMetricInterpretation(model.mse, "mse", mseQuality)}</p>
        </div>

        {/* Direction Accuracy */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm">Direction Accuracy</span>
              <Popover>
                <PopoverTrigger asChild>
                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3 text-sm">
                  <p className="font-medium">Direction Accuracy</p>
                  <p className="mt-1 text-muted-foreground">
                    The percentage of times the model correctly predicts the direction of movement (up or down),
                    regardless of the magnitude. This is particularly important for trading strategies.
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Interpretation:</span> Higher values are better. A value of 50% is
                    equivalent to random guessing.
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-1">
              <span className={cn("font-medium", getMetricColor(directionAccuracyQuality))}>
                {(model.directionAccuracy * 100).toFixed(2)}%
              </span>
              {getMetricIcon("accuracy", directionAccuracyQuality)}
            </div>
          </div>
          <Progress
            value={normalizeAccuracyMetric(model.directionAccuracy, "directionAccuracy")}
            className="h-1.5"
            indicatorClassName={getProgressColor(directionAccuracyQuality)}
          />
          <p className="text-xs text-muted-foreground">
            {getAccuracyMetricInterpretation(model.directionAccuracy, "directionAccuracy", directionAccuracyQuality)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart2Icon className="h-5 w-5 text-primary" />
              Predictions Accuracy{" "}
              {currencyPair && <span className="text-sm text-muted-foreground">({currencyPair})</span>}
            </CardTitle>
            <CardDescription>Machine Learning and Sentiment Analysis predictions accuracy</CardDescription>
            {timeframe && <CardDescription className="text-xs mt-1">Timeframe: {timeframe}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={models[0].name} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value={models[0].name}>{models[0].name}</TabsTrigger>
            <TabsTrigger value={models[1].name}>{models[1].name}</TabsTrigger>
          </TabsList>

          <TabsContent value={models[0].name}>{renderModelMetrics(models[0])}</TabsContent>

          <TabsContent value={models[1].name}>{renderModelMetrics(models[1])}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

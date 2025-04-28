"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InfoIcon, TrendingDownIcon, TrendingUpIcon, BarChart2Icon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ModelStatsProps {
  modelName: string
  description?: string
  timeframe?: string
  currencyPair?: string
  averageValue?: number // Average value of the currency pair
  mse: number
  rmse: number
  mae: number
  mape?: number
  r2?: number
  directionAccuracy?: number
}

type TabOptions = "basic" | "advanced"

export function ModelStatsCard({
  modelName,
  description,
  timeframe,
  currencyPair,
  averageValue = 1.0, // Default to 1.0 (similar to EURUSD)
  mse,
  rmse,
  mae,
  mape,
  r2,
  directionAccuracy,
}: ModelStatsProps) {
  const [activeTab, setActiveTab] = useState<TabOptions>("basic")

  // Calculate scale factor based on the average value
  // Using 1.0 as the reference (similar to EURUSD)
  const scaleFactor = averageValue / 1.0

  // Base thresholds for a currency with average value of 1.0 (like EURUSD)
  const baseThresholds = {
    // Error metrics (lower is better)
    mse: { excellent: 0.000001, good: 0.00001, average: 0.0001, poor: 0.001 },
    rmse: { excellent: 0.001, good: 0.003, average: 0.005, poor: 0.01 },
    mae: { excellent: 0.0008, good: 0.002, average: 0.004, poor: 0.008 },
    mape: { excellent: 0.005, good: 0.01, average: 0.03, poor: 0.05 }, // MAPE is relative, so no scaling needed

    // Accuracy metrics (higher is better)
    r2: { excellent: 0.9, good: 0.8, average: 0.7, poor: 0.5 }, // R² is relative, so no scaling needed
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
    rmse: {
      excellent: baseThresholds.rmse.excellent * scaleFactor,
      good: baseThresholds.rmse.good * scaleFactor,
      average: baseThresholds.rmse.average * scaleFactor,
      poor: baseThresholds.rmse.poor * scaleFactor,
    },
    mae: {
      excellent: baseThresholds.mae.excellent * scaleFactor,
      good: baseThresholds.mae.good * scaleFactor,
      average: baseThresholds.mae.average * scaleFactor,
      poor: baseThresholds.mae.poor * scaleFactor,
    },
    // These metrics are relative, so they don't need scaling
    mape: baseThresholds.mape,
    r2: baseThresholds.r2,
    directionAccuracy: baseThresholds.directionAccuracy,
  }

  // Helper function to determine if error metrics are good (lower is better)
  const isErrorMetricGood = (value: number, metricName: "mse" | "rmse" | "mae" | "mape") => {
    const threshold = thresholds[metricName]
    if (value <= threshold.excellent) return "excellent"
    if (value <= threshold.good) return "good"
    if (value <= threshold.average) return "average"
    if (value <= threshold.poor) return "poor"
    return "very-poor"
  }

  // Helper function to determine if accuracy metrics are good (higher is better)
  const isAccuracyMetricGood = (value: number, metricName: "r2" | "directionAccuracy") => {
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
      rmse: "Root Mean Squared Error",
      mae: "Mean Absolute Error",
      mape: "Mean Absolute Percentage Error",
    }

    const fullName = metricFullNames[metricName] || metricName

    // For MAPE, display as percentage
    const formattedValue =
      metricName === "mape" ? `${(value * 100).toFixed(2)}%` : value.toFixed(metricName === "mse" ? 8 : 6)

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
      r2: "R-squared",
      directionAccuracy: "Direction Accuracy",
    }

    const fullName = metricFullNames[metricName] || metricName
    const formattedValue = metricName === "directionAccuracy" ? `${(value * 100).toFixed(2)}%` : value.toFixed(4)

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
  const normalizeErrorMetric = (value: number, metricName: "mse" | "rmse" | "mae" | "mape") => {
    let max

    switch (metricName) {
      case "mse":
        max = thresholds.mse.poor * 10
        break
      case "rmse":
        max = thresholds.rmse.poor * 10
        break
      case "mae":
        max = thresholds.mae.poor * 10
        break
      case "mape":
        max = thresholds.mape.poor * 10
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
  const normalizeAccuracyMetric = (value: number, metricName: "r2" | "directionAccuracy") => {
    let min, max

    switch (metricName) {
      case "r2":
        min = 0
        max = 1
        break
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

  // Evaluate metrics
  const maeQuality = isErrorMetricGood(mae, "mae")
  const rmseQuality = isErrorMetricGood(rmse, "rmse")
  const mseQuality = isErrorMetricGood(mse, "mse")
  const mapeQuality = mape !== undefined ? isErrorMetricGood(mape, "mape") : undefined
  const r2Quality = r2 !== undefined ? isAccuracyMetricGood(r2, "r2") : undefined
  const directionAccuracyQuality =
    directionAccuracy !== undefined ? isAccuracyMetricGood(directionAccuracy, "directionAccuracy") : undefined

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart2Icon className="h-5 w-5 text-primary" />
              {modelName} Accuracy{" "}
              {currencyPair && <span className="text-sm text-muted-foreground">({currencyPair})</span>}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
            {timeframe && <CardDescription className="text-xs mt-1">Timeframe: {timeframe}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" value={activeTab} onValueChange={(value) => setActiveTab(value as TabOptions)}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="basic">Basic Metrics</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
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
                        <span className="font-medium">Interpretation:</span> Lower values are better. MAE is measured in
                        the same units as the target variable.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn("font-medium", getMetricColor(maeQuality))}>{mae.toFixed(6)}</span>
                  {getMetricIcon("error", maeQuality)}
                </div>
              </div>
              <Progress
                value={normalizeErrorMetric(mae, "mae")}
                className="h-1.5"
                indicatorClassName={getProgressColor(maeQuality)}
              />
              <p className="text-xs text-muted-foreground">{getErrorMetricInterpretation(mae, "mae", maeQuality)}</p>
            </div>

            {/* RMSE - Root Mean Squared Error */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm">RMSE</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3 text-sm">
                      <p className="font-medium">Root Mean Squared Error</p>
                      <p className="mt-1 text-muted-foreground">
                        The square root of the average of squared differences between predicted values and actual
                        values. RMSE gives higher weight to larger errors, making it more sensitive to outliers.
                      </p>
                      <p className="mt-2">
                        <span className="font-medium">Interpretation:</span> Lower values are better. RMSE is measured
                        in the same units as the target variable and is always larger than or equal to MAE.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn("font-medium", getMetricColor(rmseQuality))}>{rmse.toFixed(6)}</span>
                  {getMetricIcon("error", rmseQuality)}
                </div>
              </div>
              <Progress
                value={normalizeErrorMetric(rmse, "rmse")}
                className="h-1.5"
                indicatorClassName={getProgressColor(rmseQuality)}
              />
              <p className="text-xs text-muted-foreground">{getErrorMetricInterpretation(rmse, "rmse", rmseQuality)}</p>
            </div>

            {/* Direction Accuracy */}
            {directionAccuracy !== undefined && (
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
                          <span className="font-medium">Interpretation:</span> Higher values are better. A value of 50%
                          is equivalent to random guessing.
                        </p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn("font-medium", getMetricColor(directionAccuracyQuality!))}>
                      {(directionAccuracy * 100).toFixed(2)}%
                    </span>
                    {getMetricIcon("accuracy", directionAccuracyQuality!)}
                  </div>
                </div>
                <Progress
                  value={normalizeAccuracyMetric(directionAccuracy, "directionAccuracy")}
                  className="h-1.5"
                  indicatorClassName={getProgressColor(directionAccuracyQuality!)}
                />
                <p className="text-xs text-muted-foreground">
                  {getAccuracyMetricInterpretation(directionAccuracy, "directionAccuracy", directionAccuracyQuality!)}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
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
                        The average of squared differences between predicted values and actual values. MSE heavily
                        penalizes larger errors due to the squaring operation.
                      </p>
                      <p className="mt-2">
                        <span className="font-medium">Interpretation:</span> Lower values are better. MSE is measured in
                        squared units of the target variable.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn("font-medium", getMetricColor(mseQuality))}>{mse.toFixed(8)}</span>
                  {getMetricIcon("error", mseQuality)}
                </div>
              </div>
              <Progress
                value={normalizeErrorMetric(mse, "mse")}
                className="h-1.5"
                indicatorClassName={getProgressColor(mseQuality)}
              />
              <p className="text-xs text-muted-foreground">{getErrorMetricInterpretation(mse, "mse", mseQuality)}</p>
            </div>

            {/* MAPE - Mean Absolute Percentage Error */}
            {mape !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-sm">MAPE</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-3 text-sm">
                        <p className="font-medium">Mean Absolute Percentage Error</p>
                        <p className="mt-1 text-muted-foreground">
                          The average of absolute percentage errors. MAPE expresses accuracy as a percentage of the
                          error, making it scale-independent and easy to interpret.
                        </p>
                        <p className="mt-2">
                          <span className="font-medium">Interpretation:</span> Lower values are better. A MAPE of 10%
                          means that, on average, the forecast is off by 10%.
                        </p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn("font-medium", getMetricColor(mapeQuality!))}>{(mape * 100).toFixed(2)}%</span>
                    {getMetricIcon("error", mapeQuality!)}
                  </div>
                </div>
                <Progress
                  value={normalizeErrorMetric(mape, "mape")}
                  className="h-1.5"
                  indicatorClassName={getProgressColor(mapeQuality!)}
                />
                <p className="text-xs text-muted-foreground">
                  {getErrorMetricInterpretation(mape, "mape", mapeQuality!)}
                </p>
              </div>
            )}

            {/* R² - Coefficient of Determination */}
            {r2 !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-sm">R²</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-3 text-sm">
                        <p className="font-medium">Coefficient of Determination (R²)</p>
                        <p className="mt-1 text-muted-foreground">
                          A statistical measure that represents the proportion of the variance in the dependent variable
                          that is predictable from the independent variables. It indicates how well the model fits the
                          data.
                        </p>
                        <p className="mt-2">
                          <span className="font-medium">Interpretation:</span> Values range from 0 to 1, with 1
                          indicating perfect prediction. A value of 0 means the model doesn&apos;t explain any of the
                          variance.
                        </p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn("font-medium", getMetricColor(r2Quality!))}>{r2.toFixed(4)}</span>
                    {getMetricIcon("accuracy", r2Quality!)}
                  </div>
                </div>
                <Progress
                  value={normalizeAccuracyMetric(r2, "r2")}
                  className="h-1.5"
                  indicatorClassName={getProgressColor(r2Quality!)}
                />
                <p className="text-xs text-muted-foreground">{getAccuracyMetricInterpretation(r2, "r2", r2Quality!)}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

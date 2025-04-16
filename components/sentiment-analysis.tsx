"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    ArrowUpIcon,
    ArrowDownIcon,
    MinusIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    TrendingUpIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TwoSidedProgressBar } from "./ui/two-sided-progressbar"

type SentimentLevel = "Very Bullish" | "Bullish" | "Somewhat Bullish" | "Neutral" | "Somewhat Bearish" | "Bearish"

const sentimentLevelByScore = (score: number): SentimentLevel => {
    if (score >= 0.5) return "Very Bullish"
    if (score >= 0.35) return "Bullish"
    if (score >= 0.15) return "Somewhat Bullish"
    if (score > -0.15) return "Neutral"
    if (score > -0.35) return "Somewhat Bearish"
    return "Bearish"
}

interface SentimentAnalysisProps {
    message: string
    score?: number // Optional sentiment score between -1 and 1
}

export function SentimentAnalysis({ message, score }: SentimentAnalysisProps) {
    const sentiment = sentimentLevelByScore(score || 0) // Default to Neutral if score is undefined

    const [expanded, setExpanded] = useState(false)

    // Get sentiment color and icon
    const getSentimentDetails = () => {
        switch (sentiment) {
            case "Very Bullish":
                return {
                    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                    icon: <TrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />,
                    label: "Very Bullish",
                }
            case "Bullish":
                return {
                    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                    icon: <ArrowUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />,
                    label: "Bullish",
                }
            case "Somewhat Bullish":
                return {
                    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
                    icon: <ArrowUpIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
                    label: "Somewhat Bullish",
                }
            case "Somewhat Bearish":
                return {
                    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
                    icon: <ArrowDownIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
                    label: "Somewhat Bearish",
                }
            case "Bearish":
                return {
                    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
                    icon: <ArrowDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />,
                    label: "Bearish",
                }
            default:
                return {
                    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
                    icon: <MinusIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
                    label: "Neutral",
                }
        }
    }

    const { color, icon, label } = getSentimentDetails()

    return (
        <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center gap-2">
                        {icon}
                        <span>Market Sentiment</span>
                    </CardTitle>
                    <Badge className={color}>{label}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                {/* Sentiment Score Visualization */}
                {score !== undefined && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                            <span>Bearish</span>
                            <span>Bullish</span>
                        </div>

                        <TwoSidedProgressBar value={score} className="h-2" showValue={false} />

                        <div className="flex justify-center mt-1">
                            <span className="text-xs text-muted-foreground">
                                Sentiment Score: {score > 0 ? "+" : ""}
                                {score.toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Sentiment Message */}
                <div className="text-sm leading-relaxed">
                    <p className={expanded ? "" : "line-clamp-3"}>{message}</p>
                    {message.length > 180 && (
                        <Button variant="ghost" size="sm" className="mt-2 h-8 text-xs" onClick={() => setExpanded(!expanded)}>
                            {expanded ? (
                                <>
                                    Show Less <ChevronUpIcon className="ml-1 h-3 w-3" />
                                </>
                            ) : (
                                <>
                                    Read More <ChevronDownIcon className="ml-1 h-3 w-3" />
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

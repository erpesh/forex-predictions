"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"
import { Clock, ExternalLink, Search, TrendingUp, TrendingDown, Minus } from "lucide-react"
import Image from "next/image"

interface TopicItem {
  topic: string
  relevance_score: string
}

interface News {
  title: string
  url: string
  time_published: string
  authors: string[]
  summary: string
  banner_image: string
  source: string
  category_within_source: string
  source_domain: string
  topics: TopicItem[]
  overall_sentiment_score: number
  overall_sentiment_label: string
  ticker_sentiment: {
    ticker: string
    relevance_score: number
    ticker_sentiment_score: number
    ticker_sentiment_label: string
  }[]
}

interface NewsData {
  [currency: string]: News[]
}

interface CurrencyNewsProps {
  newsData: NewsData
  symbol: string
}

const CurrencyNews = ({ newsData, symbol }: CurrencyNewsProps) => {
  // Extract currency pair from symbol
  const currencies = useMemo(() => {
    const cleanSymbol = symbol.replace("/", "")
    if (cleanSymbol.length === 6) {
      return [cleanSymbol.substring(0, 3), cleanSymbol.substring(3, 6)]
    }
    return ["EUR", "USD"] // Default fallback
  }, [symbol])

  const [activeTab, setActiveTab] = useState(currencies[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("latest")
  const [filterSentiment, setFilterSentiment] = useState("all")

  // Format date from YYYYMMDDTHHMM to readable format
  const formatDate = (dateString: string) => {
    if (!dateString || dateString.length < 12) return "Unknown date"

    try {
      const year = dateString.substring(0, 4)
      const month = dateString.substring(4, 6)
      const day = dateString.substring(6, 8)
      const hour = dateString.substring(9, 11)
      const minute = dateString.substring(11, 13)

      const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`)
      return date.toLocaleString()
    } catch (e) {
      return "Invalid date"
    }
  }

  // Get time ago from date string
  const getTimeAgo = (dateString: string) => {
    if (!dateString || dateString.length < 12) return "Unknown time"

    try {
      const year = dateString.substring(0, 4)
      const month = dateString.substring(4, 6)
      const day = dateString.substring(6, 8)
      const hour = dateString.substring(9, 11)
      const minute = dateString.substring(11, 13)

      const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()

      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 60) return `${diffMins} min ago`

      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours} hr ago`

      const diffDays = Math.floor(diffHours / 24)
      if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`

      const diffMonths = Math.floor(diffDays / 30)
      return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`
    } catch (e) {
      return "Unknown time"
    }
  }

  // Get sentiment icon and color
  const getSentimentInfo = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "bullish":
        return {
          icon: <TrendingUp className="h-4 w-4" />,
          color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        }
      case "bearish":
        return {
          icon: <TrendingDown className="h-4 w-4" />,
          color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        }
      default:
        return {
          icon: <Minus className="h-4 w-4" />,
          color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        }
    }
  }

  // Filter and sort news
  const filteredNews = useMemo(() => {
    if (!newsData || !newsData[activeTab]) return []

    let filtered = [...newsData[activeTab]]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (news) =>
          news.title.toLowerCase().includes(query) ||
          news.summary.toLowerCase().includes(query) ||
          news.source.toLowerCase().includes(query) ||
          news.topics.some((topicItem) => topicItem.topic.toLowerCase().includes(query)),
      )
    }

    // Apply sentiment filter
    if (filterSentiment !== "all") {
      filtered = filtered.filter((news) => news.overall_sentiment_label.toLowerCase() === filterSentiment.toLowerCase())
    }

    // Apply sorting
    switch (sortBy) {
      case "latest":
        return filtered.sort((a, b) => b.time_published.localeCompare(a.time_published))
      case "oldest":
        return filtered.sort((a, b) => a.time_published.localeCompare(b.time_published))
      case "bullish":
        return filtered.sort((a, b) => b.overall_sentiment_score - a.overall_sentiment_score)
      case "bearish":
        return filtered.sort((a, b) => a.overall_sentiment_score - b.overall_sentiment_score)
      default:
        return filtered
    }
  }, [newsData, activeTab, searchQuery, filterSentiment, sortBy])

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Currency News & Sentiment</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="bullish">Most Bullish</SelectItem>
                <SelectItem value="bearish">Most Bearish</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSentiment} onValueChange={setFilterSentiment}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiment</SelectItem>
                <SelectItem value="bullish">Bullish Only</SelectItem>
                <SelectItem value="neutral">Neutral Only</SelectItem>
                <SelectItem value="bearish">Bearish Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardDescription>Latest news and sentiment analysis for {symbol}</CardDescription>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search news..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={currencies[0]} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            {currencies.map((currency) => (
              <TabsTrigger key={currency} value={currency} className="flex-1">
                {currency} News
                {newsData[currency] && (
                  <Badge variant="outline" className="ml-2">
                    {newsData[currency].length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {currencies.map((currency) => (
            <TabsContent key={currency} value={currency} className="mt-0">
              {!newsData[currency] || newsData[currency].length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No news available for {currency}</p>
                </div>
              ) : filteredNews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No results match your search criteria</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {filteredNews.map((news, index) => {
                      const sentimentInfo = getSentimentInfo(news.overall_sentiment_label)

                      // Sort topics by relevance score (descending)
                      const sortedTopics = [...news.topics].sort(
                        (a, b) => Number.parseFloat(b.relevance_score) - Number.parseFloat(a.relevance_score),
                      )

                      return (
                        <div key={index}>
                          <Card>
                            <div className="flex flex-col md:flex-row">
                              {news.banner_image && (
                                <div className="md:w-1/4 h-48 md:h-auto relative">
                                  <div className="w-full h-full relative">
                                    <Image
                                      src={news.banner_image || "/placeholder.svg"}
                                      alt={news.title}
                                      fill
                                      className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                                      unoptimized
                                    />
                                  </div>
                                </div>
                              )}
                              <div className={`flex-1 ${news.banner_image ? "md:w-3/4" : "w-full"}`}>
                                <CardHeader className="pb-2">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <CardTitle className="text-lg line-clamp-2 hover:text-primary transition-colors">
                                        <a
                                          href={news.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1"
                                        >
                                          {news.title}
                                          <ExternalLink className="h-3 w-3 inline" />
                                        </a>
                                      </CardTitle>
                                      <CardDescription className="flex items-center gap-2 mt-1">
                                        <span className="font-medium">{news.source}</span>
                                        <span className="text-xs flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {getTimeAgo(news.time_published)}
                                        </span>
                                      </CardDescription>
                                    </div>
                                    <Badge className={sentimentInfo.color}>
                                      <span className="flex items-center gap-1">
                                        {sentimentInfo.icon}
                                        {news.overall_sentiment_label}
                                      </span>
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="pb-2">
                                  <p className="text-sm line-clamp-3">{news.summary}</p>
                                </CardContent>
                                <CardFooter className="pt-0 flex flex-wrap gap-2">
                                  {sortedTopics.slice(0, 3).map((topicItem, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className="text-xs flex items-center gap-1"
                                      title={`Relevance: ${Number.parseFloat(topicItem.relevance_score).toFixed(2)}`}
                                    >
                                      {topicItem.topic}
                                      <span className="opacity-60 text-[10px]">
                                        {Number.parseFloat(topicItem.relevance_score)}
                                      </span>
                                    </Badge>
                                  ))}
                                  {news.ticker_sentiment.some((t) => t.ticker.includes(currency)) && (
                                    <Badge variant="secondary" className="ml-auto">
                                      {currency} Relevance:{" "}
                                      {(
                                        news.ticker_sentiment.find((t) => t.ticker.includes(currency))
                                          ?.relevance_score || 0
                                      )}
                                    </Badge>
                                  )}
                                </CardFooter>
                              </div>
                            </div>
                          </Card>
                          {index < filteredNews.length - 1 && <Separator className="my-4" />}
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default CurrencyNews

import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-4">
      {/* Currency pair name - outside the card */}
      <div>
        <Skeleton className="h-8 w-32" /> {/* Currency pair name */}
      </div>

      {/* Chart Card */}
      <div className="rounded-lg border p-4 space-y-4">
        {/* Exchange rate and controls - inside the card */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-48" /> {/* Exchange rate value */}
          <div className="flex gap-2">
            {/* Chart control buttons */}
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-9 rounded-md" />
            ))}
          </div>
        </div>

        {/* Main chart area */}
        <Skeleton className="h-[370px] w-full" />

        {/* Chart legend */}
        <div className="flex justify-center gap-6 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>

        {/* Time period selector */}
        <div className="flex gap-2 pt-2">
          {["1D", "5D", "1M", "6M"].map((period) => (
            <Skeleton key={period} className="h-8 w-12 rounded-md" />
          ))}
        </div>
      </div>

      {/* Sentiment Analysis Card */}
      <div className="rounded-lg border p-4 space-y-4">
        {/* Sentiment header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" /> {/* Icon */}
            <Skeleton className="h-6 w-40" /> {/* Market Sentiment text */}
          </div>
          <Skeleton className="h-6 w-20" /> {/* Neutral indicator */}
        </div>

        {/* Sentiment meter */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Skeleton className="h-4 w-16" /> {/* Bearish */}
            <Skeleton className="h-4 w-16" /> {/* Bullish */}
          </div>
          <Skeleton className="h-6 w-full rounded-full" /> {/* Sentiment bar */}
          <div className="flex justify-center">
            <Skeleton className="h-4 w-32" /> {/* Sentiment score */}
          </div>
        </div>

        {/* Sentiment analysis text */}
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[95%]" />
        </div>

        {/* Read more button */}
        <div className="flex items-center justify-center pt-2">
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>
    </div>
  )
}

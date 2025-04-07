import { Skeleton } from "@/components/ui/skeleton"

export function ChartSkeleton() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      <div className="flex-1 relative">
        {/* Chart grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-b border-gray-100 w-full h-0" />
          ))}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-12 ml-2" />
          ))}
        </div>

        {/* X-axis labels */}
        <div className="absolute left-16 right-0 bottom-0 h-6 flex justify-between">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-12" />
          ))}
        </div>

        {/* Chart line */}
        <div className="absolute left-16 right-4 top-10 h-2/3">
          <Skeleton className="h-1 w-full rounded-full" />
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-12 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-10 w-48 rounded-md" />
      </div>
    </div>
  )
}


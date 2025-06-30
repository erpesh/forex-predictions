import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ModelStatsSkeleton() {
  // Function to render skeleton metrics
  const renderSkeletonMetrics = () => {
    return (
      <div className="space-y-4">
        {/* Repeat for each metric (MAE, MSE, Direction Accuracy) */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {/* Metric name - responsive width */}
                <Skeleton className="h-4 w-[20%] max-w-[80px] min-w-[40px]" />
                <Skeleton className="h-3.5 w-3.5 rounded-full flex-shrink-0" />
              </div>
              <div className="flex items-center gap-1">
                {/* Metric value - responsive width */}
                <Skeleton className="h-4 w-[15%] max-w-[70px] min-w-[30px]" />
                <Skeleton className="h-4 w-4 flex-shrink-0" />
              </div>
            </div>
            {/* Progress bar */}
            <Skeleton className="h-1.5 w-full mt-1" />
            {/* Interpretation text - two lines with different widths for natural look */}
            <div className="space-y-1 mt-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-[85%] md:w-[75%]" /> {/* Shorter on larger screens */}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full shadow-sm hover:shadow-md transition-shadow duration-200 border rounded-lg">
      {/* Header - replacing CardHeader */}
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex justify-between items-start w-full">
          <div className="w-full">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-5 w-5 flex-shrink-0" />
              {/* Title - responsive width */}
              <Skeleton className="h-6 w-[60%] max-w-[250px]" />
            </div>
            {/* Description - responsive width */}
            <Skeleton className="h-4 w-[80%] max-w-[350px] mt-1" />
            {/* Timeframe - responsive width */}
            <Skeleton className="h-3 w-[40%] max-w-[150px] mt-1" />
          </div>
        </div>
      </div>

      {/* Content - replacing CardContent */}
      <div className="p-6 pt-0">
        <Tabs defaultValue="model1">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            {/* TabsTriggers without skeleton overlays */}
            <TabsTrigger value="model1">
              <Skeleton className="h-4 w-24" />
            </TabsTrigger>
            <TabsTrigger value="model2">
              <Skeleton className="h-4 w-24" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="model1">{renderSkeletonMetrics()}</TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

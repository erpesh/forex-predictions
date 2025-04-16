import { cn } from "@/lib/utils"

interface TwoSidedProgressBarProps {
  value: number
  className?: string
  height?: number
  showValue?: boolean
}

export function TwoSidedProgressBar({ value, className, height = 20, showValue = true }: TwoSidedProgressBarProps) {
  // Clamp value between -1 and 1
  const clampedValue = Math.max(-1, Math.min(1, value))

  // Calculate width percentage (0-50%)
  const widthPercentage = Math.abs(clampedValue) * 50

  // Determine if value is negative
  const isNegative = clampedValue < 0

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <div className="w-full bg-gray-200 rounded-full relative overflow-hidden" style={{ height: `${height}px` }}>
        {/* Center line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gray-400 z-10" aria-hidden="true" />

        {/* Progress bar */}
        <div
          className={cn(
            "h-full absolute top-0 transition-all duration-300",
            isNegative ? "right-1/2 bg-red-500" : "left-1/2 bg-green-500",
          )}
          style={{ width: `${widthPercentage}%` }}
          role="progressbar"
          aria-valuemin={-1}
          aria-valuemax={1}
          aria-valuenow={clampedValue}
        />
      </div>

      {showValue && <div className="text-sm text-center">Value: {clampedValue.toFixed(2)}</div>}
    </div>
  )
}

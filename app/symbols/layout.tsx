import type React from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DollarSign, LineChart } from "lucide-react"

const popularSymbols = [
  { name: "EUR/USD", path: "EURUSD" },
  { name: "GBP/USD", path: "GBPUSD" },
  { name: "USD/JPY", path: "USDJPY" },
  { name: "USD/CHF", path: "USDCHF" },
  { name: "AUD/USD", path: "AUDUSD" },
]

export default function SymbolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Forex Predictions
          </h2>

          <nav className="space-y-1">
            <div className="mb-4">
              <h3 className="px-3 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Popular Pairs</h3>
              {popularSymbols.map((symbol) => (
                <Link key={symbol.path} href={`/symbols/${symbol.path}`}>
                  <Button variant="ghost" className="w-full justify-start">
                    <LineChart className="mr-2 h-4 w-4" />
                    {symbol.name}
                  </Button>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}


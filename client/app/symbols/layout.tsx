import type React from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DollarSign, FileBadge } from "lucide-react"
import PopularPairs from "@/components/popular-pairs"
import { SymbolSearch } from "@/components/symbol-search"

export interface Symbol {
  name: string,
  path: string,
  disabled: boolean,
}

const popularSymbols: Symbol[] = [
  { name: "EUR/USD", path: "EURUSD", disabled: false },
  { name: "AUD/USD", path: "AUDUSD", disabled: false },
  { name: "GBP/USD", path: "GBPUSD", disabled: false },
  { name: "USD/JPY", path: "USDJPY", disabled: false },
  { name: "USD/CHF", path: "USDCHF", disabled: false },
]

const getAvailableSymbols = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/symbols`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch symbols')
  }

  const data = await res.json()
  return data
}

export default async function SymbolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const symbols = await getAvailableSymbols();

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
              <SymbolSearch symbols={symbols} />
              <h3 className="px-3 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Popular Pairs</h3>
              <PopularPairs popularSymbols={popularSymbols}/>
              <h3 className="px-3 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Feedback Form</h3>
              <Link href="https://docs.google.com/forms/u/0/d/e/1FAIpQLSdQinQr9xc-FAHx9oyZ7UArgwp8GdQEHaRK17PZJpj7UuKLVw/formResponse" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" className="w-full justify-start cursor-pointer">
                  <FileBadge className="mr-2 h-4 w-4" />
                  Feedback Form
                </Button>
              </Link>
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


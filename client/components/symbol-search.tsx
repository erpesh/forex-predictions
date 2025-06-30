"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface SymbolSearchProps {
  symbols: string[]
}

export function SymbolSearch({ symbols }: SymbolSearchProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const params = useParams()
  const currentSymbol = params?.symbol as string
  const [value, setValue] = useState(currentSymbol || "")

  // Update value when params change
  useEffect(() => {
    if (currentSymbol) {
      setValue(currentSymbol)
    }
  }, [currentSymbol])

  const handleSelect = (currentValue: string) => {
    setValue(currentValue)
    setOpen(false)
    router.push(`/symbols/${currentValue}`)
  }

  // Format symbol for display (e.g., EURUSD -> EUR/USD)
  const formatSymbol = (symbol: string) => {
    if (symbol.length === 6) {
      return `${symbol.substring(0, 3)}/${symbol.substring(3, 6)}`
    }
    return symbol
  }

  return (
    <div className="w-full px-3 mb-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-background"
          >
            {value ? formatSymbol(value) : "Search currency pairs..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search currency pairs..." className="h-9" />
            <CommandList>
              <CommandEmpty>No currency pair found.</CommandEmpty>
              <CommandGroup heading="Currency Pairs">
                {symbols.map((symbol) => (
                  <CommandItem key={symbol} value={symbol} onSelect={handleSelect} className="cursor-pointer">
                    <Check className={cn("mr-2 h-4 w-4", value === symbol ? "opacity-100" : "opacity-0")} />
                    <span className="font-medium">{formatSymbol(symbol)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

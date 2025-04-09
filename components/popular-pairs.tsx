'use client'

import {Button} from '@/components/ui/button';
import Link from 'next/link';
import {LineChart} from 'lucide-react';
import { Symbol } from '@/app/symbols/layout';
import { useParams } from 'next/navigation';


export default function PopularPairs({ popularSymbols }: { popularSymbols: Symbol[] }) {
    const params = useParams()
    const currentSymbol = params.symbol as string

    return (
        <>
            {popularSymbols.map((symbol) => ( symbol.disabled ? (
                <Button key={symbol.path} variant="ghost" className="w-full justify-start" disabled>
                  <LineChart className="mr-2 h-4 w-4" />
                  {symbol.name}
                </Button>
              ): (
                <Link key={symbol.path} href={`/symbols/${symbol.path}`}>
                  <Button variant={symbol.path === currentSymbol ? 'secondary' : 'ghost'} className="w-full justify-start cursor-pointer">
                    <LineChart className="mr-2 h-4 w-4" />
                    {symbol.name}
                  </Button>
                </Link>
              )))}
        </>
    )
}
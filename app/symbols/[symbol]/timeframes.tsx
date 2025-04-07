'use client'

import { Button } from '@/components/ui/button';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const timeframes = [
    { label: "1D", value: "1d", disabled: true },
    { label: "5D", value: "5d", disabled: true },
    { label: "1M", value: "1m", disabled: false },
    { label: "6M", value: "6m", disabled: false },
]

export default function Timeframes({ selectedTimeframe }: { selectedTimeframe: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set(name, value);
            return params.toString();
        },
        [searchParams]
    );

    return (
        <div className="flex flex-wrap gap-2">
            {timeframes.map((timeframeOption) => (
                <Button
                    key={timeframeOption.value}
                    variant={selectedTimeframe === timeframeOption.value ? "default" : "outline"}
                    onClick={() => {
                        router.push(pathname + '?' + createQueryString('timeframe', timeframeOption.value));
                    }}
                    size="sm"
                    disabled={timeframeOption.disabled}
                    className='cursor-pointer'
                >
                    {timeframeOption.label}
                </Button>
            ))}
        </div>
    );
}

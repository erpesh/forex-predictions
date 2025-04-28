import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const splitSymbol = (symbol: string) => {
  const match = symbol.match(/([A-Z]{3})([A-Z]{3})/)
  if (match) {
    return { base: match[1], quote: match[2] }
  }
  return null
}

export const getCurrencyName = (code, locale = 'en') => {
  const displayNames = new Intl.DisplayNames([locale], { type: 'currency' });
  return displayNames.of(code);
};

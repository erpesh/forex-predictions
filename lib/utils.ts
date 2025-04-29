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

// Function that accepts two dates and returns the difference in days, weeks, or months based on the duration
export const dateDiff = (startDate: Date, endDate: Date) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.abs(end.getTime() - start.getTime());

  const days = diff / (1000 * 3600 * 24);
  if (days < 7) {
    return { value: Math.ceil(days), unit: 'days' };
  }

  const weeks = days / 7;
  if (weeks < 4) {
    return { value: Math.ceil(weeks), unit: 'weeks' };
  }

  const months = days / 30;
  return { value: Math.ceil(months), unit: 'months' };
};
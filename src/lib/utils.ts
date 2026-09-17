import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Разрешаем только относительные same-origin пути в ?next= (защита от open redirect).
export function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/"
}

// Символ вместо кода валюты: «12 400 ₽», а не «12 400 RUB» (design.md §1).
// Валюты без символа показываются кодом — лучше «USD», чем чужой знак.
const CURRENCY_SYMBOL: Record<string, string> = { RUB: "₽", KZT: "₸", BYN: "Br" }

// Деньги хранятся INTEGER в минорных единицах (SPEC: Глобальные правила).
export function formatMoneyMinor(minor: number, currency: string): string {
  // currency — char(3), из БД приходит с добивкой пробелами.
  const code = currency.trim().toUpperCase()
  const symbol = CURRENCY_SYMBOL[code] ?? code
  return `${(minor / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ${symbol}`
}

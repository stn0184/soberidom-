import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Разрешаем только относительные same-origin пути в ?next= (защита от open redirect).
export function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/"
}

// Деньги хранятся INTEGER в минорных единицах (SPEC: Глобальные правила).
export function formatMoneyMinor(minor: number, currency: string): string {
  return `${(minor / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ${currency}`
}

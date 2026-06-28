import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
export const fmtUSD = (n: number, compact = false) => {
  if (compact && Math.abs(n) >= 1000) return '$' + (n/1000).toFixed(1)+'K'
  return '$' + Math.round(n).toLocaleString('en-US')
}
export const fmtPct  = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(1) + '%'
export const fmtDate = (d: string) => {
  if (!d) return '—'
  try { return new Date(d+'T00:00:00').toLocaleDateString('es-DO',{day:'2-digit',month:'short',year:'numeric'}) }
  catch { return d }
}
export const fmtNum  = (n: number, dec = 2) => n?.toFixed(dec) ?? '—'
export const pnlColor = (n: number) => n > 0 ? '#10B981' : n < 0 ? '#EF4444' : 'rgba(255,255,255,0.5)'
export const pnlSign  = (n: number) => n > 0 ? '+' : ''

export const KIND_LABEL: Record<string, string> = {
  install: "O'rnatish",
  server: 'Server (yillik)',
  voice: 'Ovozli kiritish',
  sms: 'SMS',
  other: 'Boshqa',
}

export function money(amount: string, currency: string): string {
  const value = Number(amount)
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value)} ${currency}`
}

export function day(value: string | null): string {
  if (!value) return '-'
  const [year, month, date] = value.split('-')
  return `${date}.${month}.${year}`
}

export function addDays(base: Date, days: number): string {
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  return next.toISOString().slice(0, 10)
}

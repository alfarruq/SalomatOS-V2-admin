import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function Card({
  title,
  children,
  action,
  className = '',
}: {
  title?: string
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-lg border border-border bg-surface p-4 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Button({
  tone = 'default',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'default' | 'primary' | 'danger' }) {
  const tones = {
    default: 'border-border bg-surface text-text hover:bg-bg',
    primary: 'border-accent bg-accent text-white hover:opacity-90',
    danger: 'border-danger text-danger bg-surface hover:bg-bg',
  }
  return (
    <button
      type="button"
      {...props}
      className={`min-h-11 rounded-md border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 ${tones[tone]} ${className}`}
    />
  )
}

export function Field({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-text-secondary">{label}</span>
      <input {...props} className="min-h-11 rounded-md border border-border bg-surface px-3" />
      {error && <span className="text-danger">{error}</span>}
    </label>
  )
}

export function Badge({ tone, children }: { tone: 'ok' | 'warn' | 'danger' | 'muted'; children: ReactNode }) {
  const tones = {
    ok: 'text-ok border-ok',
    warn: 'text-warn border-warn',
    danger: 'text-danger border-danger',
    muted: 'text-text-secondary border-border',
  }
  return <span className={`whitespace-nowrap rounded border px-2 py-0.5 text-xs ${tones[tone]}`}>{children}</span>
}

export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(0,auto)_1fr] gap-x-6 gap-y-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-text-secondary">{label}</dt>
          <dd className="text-right sm:text-left">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Loading() {
  return <p className="p-4 text-sm text-text-secondary">Yuklanmoqda...</p>
}

export function Failed({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2 p-4 text-sm">
      <p className="text-danger">Yuklab bo'lmadi.</p>
      <Button onClick={onRetry}>Qayta urinish</Button>
    </div>
  )
}

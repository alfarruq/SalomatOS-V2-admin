import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function Card({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
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
    default: 'border-border bg-surface text-text',
    primary: 'border-accent bg-accent text-white',
    danger: 'border-danger text-danger bg-surface',
  }
  return (
    <button
      type="button"
      {...props}
      className={`min-h-11 rounded-md border px-3 text-sm disabled:opacity-50 ${tones[tone]} ${className}`}
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

export function Badge({ tone, children }: { tone: 'ok' | 'danger' | 'muted'; children: ReactNode }) {
  const tones = { ok: 'text-ok border-ok', danger: 'text-danger border-danger', muted: 'text-text-secondary border-border' }
  return <span className={`rounded border px-2 py-0.5 text-xs ${tones[tone]}`}>{children}</span>
}

export function Loading() {
  return <p className="p-4 text-sm text-text-secondary">Yuklanmoqda...</p>
}

export function Failed({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="p-4 text-sm">
      <p className="text-danger">Yuklab bo'lmadi.</p>
      <Button onClick={onRetry}>Qayta urinish</Button>
    </div>
  )
}

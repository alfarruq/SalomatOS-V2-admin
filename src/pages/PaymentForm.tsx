import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ApiError, api } from '../lib/api'
import { KIND_LABEL, addDays } from '../lib/format'
import type { Payment, PaymentKind } from '../lib/types'
import { Button, Field } from '../ui'

export function PaymentForm({ organizationId, onDone }: { organizationId: string; onDone: () => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const [kind, setKind] = useState<PaymentKind>('server')
  const [amount, setAmount] = useState('')
  const [paidOn, setPaidOn] = useState(today)
  const [until, setUntil] = useState(addDays(new Date(), 365))
  const [credits, setCredits] = useState('')
  const [method, setMethod] = useState('transfer')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()

  const save = useMutation({
    mutationFn: () =>
      api<Payment>('/payments/', {
        method: 'POST',
        body: {
          organization: organizationId,
          kind,
          amount,
          method,
          paid_on: paidOn,
          covers_until: kind === 'server' || kind === 'voice' ? until : null,
          sms_credits: kind === 'sms' ? Number(credits) : null,
          note,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries()
      onDone()
    },
    onError: (error) => setErrors(error instanceof ApiError ? error.fieldErrors : {}),
    retry: false,
  })

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate()
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-text-secondary">Turi</span>
        <select
          className="min-h-11 rounded-md border border-border bg-surface px-3"
          value={kind}
          onChange={(e) => {
            const next = e.target.value as PaymentKind
            setKind(next)
            setUntil(addDays(new Date(), next === 'voice' ? 30 : 365))
          }}
        >
          {Object.entries(KIND_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <Field label="Summa" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} />
      <Field label="To'langan sana" type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} error={errors.paid_on} />
      {(kind === 'server' || kind === 'voice') && (
        <Field label="Qachongacha to'langan" type="date" value={until} onChange={(e) => setUntil(e.target.value)} error={errors.covers_until} />
      )}
      {kind === 'sms' && (
        <Field label="SMS soni" inputMode="numeric" value={credits} onChange={(e) => setCredits(e.target.value)} error={errors.sms_credits} />
      )}
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-text-secondary">Usul</span>
        <select className="min-h-11 rounded-md border border-border bg-surface px-3" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="transfer">O'tkazma</option>
          <option value="cash">Naqd</option>
          <option value="card">Karta</option>
        </select>
      </label>
      <Field label="Izoh" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex items-end">
        <Button tone="primary" type="submit" disabled={save.isPending || !amount}>
          Saqlash
        </Button>
      </div>
    </form>
  )
}

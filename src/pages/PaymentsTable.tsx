import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { KIND_LABEL, day, money } from '../lib/format'
import type { Page, Payment } from '../lib/types'
import { Badge, Button, Failed, Loading } from '../ui'

export function PaymentsTable({ organizationId, names }: { organizationId?: string; names?: Map<string, string> }) {
  const queryClient = useQueryClient()
  const path = `/payments/?page_size=100${organizationId ? `&organization=${organizationId}` : ''}`
  const query = useQuery({ queryKey: ['payments', organizationId ?? 'all'], queryFn: () => api<Page<Payment>>(path) })
  const voidPayment = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api(`/payments/${id}/void/`, { method: 'POST', body: { reason } }),
    onSuccess: () => void queryClient.invalidateQueries(),
    retry: false,
  })

  if (query.isPending) return <Loading />
  if (query.isError) return <Failed onRetry={() => void query.refetch()} />
  if (query.data.results.length === 0) return <p className="text-sm text-text-secondary">To'lov yo'q.</p>
  return (
    <ul className="flex flex-col divide-y divide-border text-sm">
      {query.data.results.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
          <div className={p.voided_at ? 'line-through opacity-60' : ''}>
            <p>
              {KIND_LABEL[p.kind]} · {money(p.amount, p.currency)}
              {names && <span className="text-text-secondary"> · {names.get(p.organization) ?? ''}</span>}
            </p>
            <p className="text-xs text-text-secondary">
              {day(p.paid_on)}
              {p.covers_until && ` → ${day(p.covers_until)}`}
              {p.sms_credits ? ` · ${p.sms_credits} SMS` : ''}
              {p.note && ` · ${p.note}`}
            </p>
          </div>
          {p.voided_at ? (
            <Badge tone="muted">Bekor: {p.void_reason}</Badge>
          ) : (
            <Button
              tone="danger"
              onClick={() => {
                const reason = window.prompt("Bekor qilish sababi:")?.trim()
                if (reason) voidPayment.mutate({ id: p.id, reason })
              }}
            >
              Bekor qilish
            </Button>
          )}
        </li>
      ))}
    </ul>
  )
}

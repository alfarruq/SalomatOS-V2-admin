import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { ApiError, api } from '../lib/api'
import { day, money } from '../lib/format'
import type { Contract, Created, Organization, Usage } from '../lib/types'
import { Badge, Button, Card, Failed, Field, Loading } from '../ui'
import { PaymentForm } from './PaymentForm'
import { PaymentsTable } from './PaymentsTable'

function TemporaryPassword({ username, password }: { username: string; password: string }) {
  return (
    <Card title="Vaqtinchalik parol (faqat hozir ko'rinadi)">
      <p className="text-sm">
        Login: <b>{username}</b> · Parol: <b className="select-all">{password}</b>
      </p>
      <p className="text-xs text-text-secondary">Egasiga yetkazing. Birinchi kirgandan keyin u parolni almashtiradi.</p>
    </Card>
  )
}

function ContractCard({ org }: { org: Organization }) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<Contract>(org.contract)
  const save = useMutation({
    mutationFn: () => api<Organization>(`/organizations/${org.id}/`, { method: 'PATCH', body: { contract: draft } }),
    onSuccess: () => void queryClient.invalidateQueries(),
    retry: false,
  })
  const text = (key: 'install_fee' | 'server_fee_yearly' | 'voice_fee_monthly') => (
    <Field
      label={{ install_fee: "O'rnatish narxi", server_fee_yearly: 'Yillik server', voice_fee_monthly: 'Ovoz (oylik)' }[key]}
      inputMode="decimal"
      value={draft[key]}
      onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
    />
  )
  return (
    <Card title="Shartnoma">
      <div className="grid gap-3 sm:grid-cols-3">
        {text('install_fee')}
        {text('server_fee_yearly')}
        {text('voice_fee_monthly')}
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.voice_enabled}
            onChange={(e) => setDraft({ ...draft, voice_enabled: e.target.checked })}
          />
          Ovozli kiritish yoqilgan
        </label>
        <Field
          label="Ovoz oylik limiti (bo'sh = standart)"
          inputMode="numeric"
          value={draft.voice_monthly_limit ?? ''}
          onChange={(e) =>
            setDraft({ ...draft, voice_monthly_limit: e.target.value === '' ? null : Number(e.target.value) })
          }
        />
        <div className="flex items-end">
          <Button tone="primary" onClick={() => save.mutate()} disabled={save.isPending}>
            Saqlash
          </Button>
        </div>
      </div>
    </Card>
  )
}

function UsageCard({ id }: { id: string }) {
  const query = useQuery({ queryKey: ['usage', id], queryFn: () => api<Usage>(`/organizations/${id}/usage/`) })
  if (query.isPending) return <Loading />
  if (query.isError) return <Failed onRetry={() => void query.refetch()} />
  const u = query.data
  const rows: [string, string | number][] = [
    ['Filiallar (faol)', `${u.clinics} (${u.active_clinics})`],
    ['Xodimlar', u.staff],
    ['Bemorlar', u.patients],
    ['Shu oy qabullar', u.appointments_this_month],
    ['Shu oy muolajalar', u.procedures_this_month],
    ['Shu oy ovoz', `${u.voice_drafts_this_month} / ${u.voice_monthly_limit}`],
    ['Fayllar', `${u.attachments} (${(u.attachments_bytes / 1_048_576).toFixed(1)} MB)`],
    ['Oxirgi kirish', u.last_login_at ? new Date(u.last_login_at).toLocaleString('ru-RU') : '-'],
  ]
  return (
    <Card title="Foydalanish (faqat sonlar)">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-text-secondary">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

export function CustomerPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const queryClient = useQueryClient()
  const created = (location.state as { created?: Created } | null)?.created
  const [reset, setReset] = useState<{ username: string; password: string } | null>(null)
  const [paying, setPaying] = useState(false)
  const [branch, setBranch] = useState('')
  const [branchError, setBranchError] = useState<string>()

  const query = useQuery({ queryKey: ['organization', id], queryFn: () => api<Organization>(`/organizations/${id}/`) })
  const refresh = () => void queryClient.invalidateQueries()
  const toggle = useMutation({
    mutationFn: (path: string) => api(path, { method: 'POST' }),
    onSuccess: refresh,
    retry: false,
  })
  const addBranch = useMutation({
    mutationFn: () => api(`/organizations/${id}/clinics/`, { method: 'POST', body: { name: branch } }),
    onSuccess: () => {
      setBranch('')
      setBranchError(undefined)
      refresh()
    },
    onError: (error) => setBranchError(error instanceof ApiError ? Object.values(error.fieldErrors)[0] : undefined),
    retry: false,
  })
  const resetPassword = useMutation({
    mutationFn: (owner: string) =>
      api<{ username: string; temporary_password: string }>(`/organizations/${id}/reset-owner-password/`, {
        method: 'POST',
        body: { owner },
      }),
    onSuccess: (data) => setReset({ username: data.username, password: data.temporary_password }),
    retry: false,
  })

  if (query.isPending) return <Loading />
  if (query.isError) return <Failed onRetry={() => void query.refetch()} />
  const org = query.data
  const b = org.billing

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{org.name}</h1>
        {org.is_active ? (
          <Button
            tone="danger"
            onClick={() => {
              if (window.confirm("Mijozni to'xtatasizmi? Hamma filial va xodimlar kira olmaydi, ma'lumot saqlanadi."))
                toggle.mutate(`/organizations/${id}/suspend/`)
            }}
          >
            To'xtatish
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Badge tone="danger">To'xtatilgan</Badge>
            <Button tone="primary" onClick={() => toggle.mutate(`/organizations/${id}/reactivate/`)}>
              Qayta yoqish
            </Button>
          </div>
        )}
      </div>

      {created && <TemporaryPassword username={created.owner_username} password={created.owner_temporary_password} />}
      {reset && <TemporaryPassword username={reset.username} password={reset.password} />}

      <Card title="Hisob-kitob">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-text-secondary">O'rnatish</dt>
          <dd>
            {money(b.install_paid, b.currency)} / {money(b.install_fee, b.currency)}
            {Number(b.install_due) > 0 && <span className="text-danger"> (qarz {money(b.install_due, b.currency)})</span>}
          </dd>
          <dt className="text-text-secondary">Server to'langan</dt>
          <dd className={b.server_overdue ? 'text-danger' : ''}>{day(b.server_paid_until)}</dd>
          <dt className="text-text-secondary">Ovoz to'langan</dt>
          <dd>
            {day(b.voice_paid_until)} {b.voice_active ? <Badge tone="ok">faol</Badge> : <Badge tone="muted">o'chiq</Badge>}
          </dd>
          <dt className="text-text-secondary">SMS hisobi</dt>
          <dd>{b.sms_credits}</dd>
        </dl>
      </Card>

      <ContractCard key={JSON.stringify(org.contract)} org={org} />

      <Card
        title="To'lovlar"
        action={
          <Button tone="primary" onClick={() => setPaying(!paying)}>
            {paying ? 'Yopish' : "To'lov kiritish"}
          </Button>
        }
      >
        {paying && (
          <div className="mb-4">
            <PaymentForm organizationId={id} onDone={() => setPaying(false)} />
          </div>
        )}
        <PaymentsTable organizationId={id} />
      </Card>

      <UsageCard id={id} />

      <Card title="Filiallar">
        <ul className="mb-3 flex flex-col gap-2 text-sm">
          {org.clinics.map((clinic) => (
            <li key={clinic.id} className="flex items-center justify-between gap-2">
              <span>
                {clinic.name} {!clinic.is_active && <Badge tone="danger">To'xtatilgan</Badge>}
              </span>
              <Button
                onClick={() => toggle.mutate(`/clinics/${clinic.id}/${clinic.is_active ? 'suspend' : 'reactivate'}/`)}
              >
                {clinic.is_active ? "To'xtatish" : 'Yoqish'}
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Yangi filial" value={branch} onChange={(e) => setBranch(e.target.value)} error={branchError} />
          <Button onClick={() => addBranch.mutate()} disabled={!branch || addBranch.isPending}>
            Qo'shish
          </Button>
        </div>
      </Card>

      <Card title="Egalar">
        <ul className="flex flex-col gap-2 text-sm">
          {org.owners.map((owner) => (
            <li key={owner.id} className="flex items-center justify-between gap-2">
              <span>
                {owner.full_name} ({owner.username})
              </span>
              <Button
                onClick={() => {
                  if (window.confirm('Yangi vaqtinchalik parol beriladi, eski parol ishlamaydi. Davom etasizmi?'))
                    resetPassword.mutate(owner.id)
                }}
              >
                Parolni tiklash
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

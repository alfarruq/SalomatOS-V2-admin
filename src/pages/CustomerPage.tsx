import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError, api } from '../lib/api'
import { generatePassword } from '../lib/password'
import { day, money } from '../lib/format'
import type { Contract, Organization, Usage } from '../lib/types'
import { Login, Password } from '../credential'
import { Badge, Button, Card, Facts, Failed, Field, Loading } from '../ui'
import { PaymentForm } from './PaymentForm'
import { PaymentsTable } from './PaymentsTable'

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
        <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={draft.owner_can_change_password}
            onChange={(e) => setDraft({ ...draft, owner_can_change_password: e.target.checked })}
          />
          Egasi o'z parolini o'zgartira oladi (o'chiq bo'lsa faqat siz almashtirasiz)
        </label>
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
  const rows: [string, string][] = [
    ['Filiallar (faol)', `${u.clinics} (${u.active_clinics})`],
    ['Xodimlar', String(u.staff)],
    ['Bemorlar', String(u.patients)],
    ['Shu oy qabullar', String(u.appointments_this_month)],
    ['Shu oy muolajalar', String(u.procedures_this_month)],
    ['Shu oy ovoz', `${u.voice_drafts_this_month} / ${u.voice_monthly_limit}`],
    ['Fayllar', `${u.attachments} (${(u.attachments_bytes / 1_048_576).toFixed(1)} MB)`],
    ['Oxirgi kirish', u.last_login_at ? new Date(u.last_login_at).toLocaleString('ru-RU') : '-'],
  ]
  return (
    <Card title="Foydalanish (faqat sonlar)">
      <Facts rows={rows} />
    </Card>
  )
}

export function CustomerPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
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
    mutationFn: ({ owner, password }: { owner: string; password: string }) =>
      api(`/organizations/${id}/reset-owner-password/`, {
        method: 'POST',
        body: { owner, password },
      }),
    onError: (error) =>
      window.alert(error instanceof ApiError ? (error.fieldErrors.password ?? "Parol qabul qilinmadi.") : "Xatolik."),
    onSuccess: refresh,
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

      <Card title="Kirish ma'lumotlari" className="border-accent">
        <ul className="flex flex-col gap-3 text-sm">
          {org.owners.map((owner) => (
            <li key={owner.id} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
              <span className="text-text-secondary sm:min-w-40">{owner.full_name}</span>
              <Login value={owner.username} />
              <Password value={owner.password} />
              <Button
                className="sm:ml-auto"
                onClick={() => {
                  const password = window.prompt(
                    "Yangi parol (eskisi ishlamaydi). Bo'sh qoldirsangiz o'zi yaratiladi:",
                    generatePassword(),
                  )
                  if (password !== null) resetPassword.mutate({ owner: owner.id, password: password.trim() })
                }}
              >
                Parolni almashtirish
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Hisob-kitob">
          <Facts
            rows={[
              [
                "O'rnatish",
                <span key="i">
                  {money(b.install_paid, b.currency)} / {money(b.install_fee, b.currency)}
                  {Number(b.install_due) > 0 && <span className="text-warn"> (qarz {money(b.install_due, b.currency)})</span>}
                </span>,
              ],
              ["Server to'langan", <span key="s" className={b.server_overdue ? 'text-warn' : ''}>{day(b.server_paid_until)}</span>],
              [
                "Ovoz to'langan",
                <span key="v" className="flex items-center gap-2">
                  {day(b.voice_paid_until)}
                  {b.voice_active ? <Badge tone="ok">faol</Badge> : <Badge tone="muted">o'chiq</Badge>}
                </span>,
              ],
              ['SMS hisobi', String(b.sms_credits)],
            ]}
          />
        </Card>
        <UsageCard id={id} />
      </div>

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
    </div>
  )
}

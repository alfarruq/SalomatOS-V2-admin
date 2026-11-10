import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../lib/api'
import { generatePassword } from '../lib/password'
import { day, money } from '../lib/format'
import type { Created, OrganizationRow, Page } from '../lib/types'
import { Badge, Button, Card, Failed, Field, Loading } from '../ui'

function CreateForm({ onCreated }: { onCreated: (created: Created) => void }) {
  const [v, setV] = useState({
    name: '',
    branch: '',
    username: '',
    owner: '',
    currency: 'USD',
    install: '',
    server: '',
    password: generatePassword(),
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (key: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [key]: e.target.value })
  const create = useMutation({
    mutationFn: () =>
      api<Created>('/organizations/', {
        method: 'POST',
        body: {
          name: v.name,
          contract: { currency: v.currency, install_fee: v.install || '0', server_fee_yearly: v.server || '0' },
          clinic: { name: v.branch || v.name },
          owner: { username: v.username, full_name: v.owner, password: v.password },
        },
      }),
    onSuccess: onCreated,
    onError: (error) => setErrors(error instanceof ApiError ? error.fieldErrors : {}),
    retry: false,
  })
  const flat = (key: string) => errors[key] ?? errors[`owner.${key}`]
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        create.mutate()
      }}
    >
      <Field label="Biznes nomi" value={v.name} onChange={set('name')} error={errors.name} />
      <Field label="Birinchi filial nomi" value={v.branch} onChange={set('branch')} placeholder={v.name} />
      <Field label="Egasining logini" value={v.username} onChange={set('username')} error={flat('username')} />
      <Field label="Egasining ismi" value={v.owner} onChange={set('owner')} error={flat('full_name')} />
      <div className="flex items-end gap-2">
        <Field
          label="Egasining paroli"
          value={v.password}
          onChange={set('password')}
          error={errors.password}
          autoComplete="off"
          className="flex-1"
        />
        <Button onClick={() => setV({ ...v, password: generatePassword() })}>Yaratish</Button>
      </div>
      <Field label="O'rnatish narxi" inputMode="decimal" value={v.install} onChange={set('install')} />
      <Field label="Yillik server narxi" inputMode="decimal" value={v.server} onChange={set('server')} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-text-secondary">Valyuta</span>
        <select className="min-h-11 rounded-md border border-border bg-surface px-3" value={v.currency} onChange={set('currency')}>
          <option>USD</option>
          <option>UZS</option>
        </select>
      </label>
      <div className="flex items-end">
        <Button tone="primary" type="submit" disabled={create.isPending || !v.name || !v.username || !v.owner || !v.password}>
          Mijoz qo'shish
        </Button>
      </div>
    </form>
  )
}

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['organizations', search],
    queryFn: () => api<Page<OrganizationRow>>(`/organizations/?search=${encodeURIComponent(search)}&page_size=100`),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <Field label="Qidirish" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button tone="primary" onClick={() => setAdding(!adding)}>
          {adding ? 'Yopish' : 'Yangi mijoz'}
        </Button>
      </div>
      {adding && (
        <Card title="Yangi mijoz">
          <CreateForm
            onCreated={(created) => {
              void queryClient.invalidateQueries({ queryKey: ['organizations'] })
              void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
              navigate(`/customers/${created.organization.id}`)
            }}
          />
        </Card>
      )}
      {query.isPending && <Loading />}
      {query.isError && <Failed onRetry={() => void query.refetch()} />}
      {query.data && query.data.results.length === 0 && <p className="text-sm text-text-secondary">Mijoz yo'q.</p>}
      <ul className="flex flex-col gap-2">
        {query.data?.results.map((org) => (
          <li key={org.id}>
            <Link to={`/customers/${org.id}`} className="block rounded-lg border border-border bg-surface p-3 hover:bg-bg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{org.name}</span>
                <span className="flex flex-wrap gap-2">
                  {!org.is_active && <Badge tone="danger">To'xtatilgan</Badge>}
                  {org.billing.server_overdue && <Badge tone="warn">Server muddati o'tgan</Badge>}
                  {Number(org.billing.install_due) > 0 && (
                    <Badge tone="warn">Qarz {money(org.billing.install_due, org.billing.currency)}</Badge>
                  )}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                Login: <code className="text-text">{org.owner_usernames.join(', ') || '-'}</code>
              </p>
              <p className="text-xs text-text-secondary">
                {org.clinic_count} filial · server: {day(org.billing.server_paid_until)} · SMS: {org.billing.sms_credits}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

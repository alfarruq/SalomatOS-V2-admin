import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { KIND_LABEL, day, money } from '../lib/format'
import type { Dashboard } from '../lib/types'
import { Card, Failed, Loading } from '../ui'

function Totals({ rows }: { rows: Dashboard['collected_this_month'] }) {
  if (rows.length === 0) return <p className="text-sm text-text-secondary">To'lov yo'q.</p>
  return (
    <ul className="text-sm">
      {rows.map((row) => (
        <li key={`${row.currency}-${row.kind}`} className="flex justify-between py-1">
          <span>{KIND_LABEL[row.kind] ?? row.kind}</span>
          <span>{money(row.total, row.currency)}</span>
        </li>
      ))}
    </ul>
  )
}

export function DashboardPage() {
  const query = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/dashboard/') })
  if (query.isPending) return <Loading />
  if (query.isError) return <Failed onRetry={() => void query.refetch()} />
  const d = query.data
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Mijozlar">
        <p className="text-sm">
          {d.active_organizations} faol / {d.organizations} jami, {d.clinics} filial
        </p>
      </Card>
      <Card title="Shu oy tushum">
        <Totals rows={d.collected_this_month} />
      </Card>
      <Card title="Shu yil tushum">
        <Totals rows={d.collected_this_year} />
      </Card>
      <Card title="Server to'lovi muddati o'tgan">
        {d.server_overdue.length === 0 && <p className="text-sm text-text-secondary">Yo'q.</p>}
        <ul className="text-sm">
          {d.server_overdue.map((row) => (
            <li key={row.id} className="flex justify-between py-1">
              <Link to={`/customers/${row.id}`} className="text-accent">
                {row.name}
              </Link>
              <span>{day(row.server_paid_until)}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="30 kun ichida tugaydi">
        {d.server_expiring.length === 0 && <p className="text-sm text-text-secondary">Yo'q.</p>}
        <ul className="text-sm">
          {d.server_expiring.map((row) => (
            <li key={row.id} className="flex justify-between py-1">
              <Link to={`/customers/${row.id}`} className="text-accent">
                {row.name}
              </Link>
              <span>{day(row.server_paid_until)}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="O'rnatish qarzi">
        {d.install_due.length === 0 && <p className="text-sm text-text-secondary">Yo'q.</p>}
        <ul className="text-sm">
          {d.install_due.map((row) => (
            <li key={row.id} className="flex justify-between py-1">
              <Link to={`/customers/${row.id}`} className="text-accent">
                {row.name}
              </Link>
              <span>{money(row.due, row.currency)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Login, Password } from '../credential'
import { api } from '../lib/api'
import type { CredentialRow } from '../lib/types'
import { Badge, Card, Failed, Loading } from '../ui'

export function CredentialsPage() {
  const query = useQuery({
    queryKey: ['credentials'],
    queryFn: () => api<CredentialRow[]>('/credentials/'),
    // Never keep passwords in the query cache longer than this page is open.
    gcTime: 0,
  })
  if (query.isPending) return <Loading />
  if (query.isError) return <Failed onRetry={() => void query.refetch()} />
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-lg font-semibold">Login va parollar</h1>
        <p className="text-sm text-text-secondary">
          Mijozlarga berilgan vaqtinchalik parol egasi o'zinikini qo'yguncha ko'rinadi. Keyin faqat login qoladi; unutsa,
          mijoz sahifasidan yangi parol berasiz.
        </p>
      </div>
      {query.data.length === 0 && <p className="text-sm text-text-secondary">Mijoz yo'q.</p>}
      <ul className="flex flex-col gap-2">
        {query.data.map((row) => (
          <li key={row.owner + row.organization}>
            <Card>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <Link to={`/customers/${row.organization}`} className="font-medium text-accent">
                  {row.organization_name}
                </Link>
                {!row.is_active && <Badge tone="danger">To'xtatilgan</Badge>}
              </div>
              <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <span className="text-text-secondary">{row.full_name}</span>
                <Login value={row.username} />
                <Password value={row.temporary_password} />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { OrganizationRow, Page } from '../lib/types'
import { Card } from '../ui'
import { PaymentsTable } from './PaymentsTable'

export function PaymentsPage() {
  const orgs = useQuery({
    queryKey: ['organizations', ''],
    queryFn: () => api<Page<OrganizationRow>>('/organizations/?search=&page_size=100'),
  })
  const names = new Map(orgs.data?.results.map((o) => [o.id, o.name]))
  return (
    <Card title="Barcha to'lovlar">
      <PaymentsTable names={names} />
    </Card>
  )
}

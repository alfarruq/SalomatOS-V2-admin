import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { logout, restore } from './lib/api'
import { Button, Loading } from './ui'
import { CustomerPage } from './pages/CustomerPage'
import { CustomersPage } from './pages/CustomersPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { PaymentsPage } from './pages/PaymentsPage'

type State = 'loading' | 'in' | 'out'

export function App() {
  const [state, setState] = useState<State>('loading')
  const queryClient = useQueryClient()

  useEffect(() => {
    void restore().then((ok) => setState(ok ? 'in' : 'out'))
    const out = () => {
      queryClient.clear()
      setState('out')
    }
    window.addEventListener('platform:signed-out', out)
    return () => window.removeEventListener('platform:signed-out', out)
  }, [queryClient])

  if (state === 'loading') return <Loading />
  if (state === 'out') return <LoginPage onSignedIn={() => setState('in')} />

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-2 py-4">
        <nav className="flex gap-4 text-sm font-medium">
          <Link to="/">Bosh sahifa</Link>
          <Link to="/customers">Mijozlar</Link>
          <Link to="/payments">To'lovlar</Link>
        </nav>
        <Button
          onClick={() =>
            void logout().then(() => {
              queryClient.clear()
              setState('out')
            })
          }
        >
          Chiqish
        </Button>
      </header>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomerPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

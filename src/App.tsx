import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { logout, restore } from './lib/api'
import { Button, Loading } from './ui'
import { CustomerPage } from './pages/CustomerPage'
import { CustomersPage } from './pages/CustomersPage'
import { CredentialsPage } from './pages/CredentialsPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { PaymentsPage } from './pages/PaymentsPage'

const NAV: [string, string][] = [
  ['/', 'Bosh sahifa'],
  ['/customers', 'Mijozlar'],
  ['/credentials', 'Login va parollar'],
  ['/payments', "To'lovlar"],
]

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
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2">
          <div className="flex flex-wrap items-center gap-x-6">
            <span className="text-sm font-semibold">SalomatOS Platform</span>
            <nav className="flex flex-wrap gap-1 text-sm">
              {NAV.map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center border-b-2 px-3 ${isActive ? 'border-accent font-medium text-text' : 'border-transparent text-text-secondary'}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
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
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomerPage />} />
        <Route path="/credentials" element={<CredentialsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </main>
    </div>
  )
}

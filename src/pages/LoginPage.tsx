import { useState } from 'react'
import { login } from '../lib/api'
import { Button, Card, Field } from '../ui'

export function LoginPage({ onSignedIn }: { onSignedIn: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <Card title="SalomatOS Platform">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            setBusy(true)
            setError(false)
            login(username, password)
              .then(onSignedIn)
              .catch(() => setError(true))
              .finally(() => setBusy(false))
          }}
        >
          <Field label="Login" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          <Field
            label="Parol"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-danger">Login yoki parol noto'g'ri.</p>}
          <Button tone="primary" type="submit" disabled={busy || !username || !password}>
            Kirish
          </Button>
        </form>
      </Card>
    </div>
  )
}

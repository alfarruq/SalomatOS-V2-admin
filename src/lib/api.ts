import { session } from './session'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(`HTTP ${status}`)
  }
}

type Tokens = { result: { access_token: string; refresh_token: string } }

let refreshing: Promise<boolean> | null = null

// One refresh at a time: refresh tokens rotate, so parallel calls would burn each other's token.
function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    const refresh = session.refresh()
    if (!refresh) return false
    const response = await fetch('/api/platform/v1/auth/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    })
    if (!response.ok) {
      session.clear()
      return false
    }
    const body = (await response.json()) as Tokens
    session.save(body.result.access_token, body.result.refresh_token)
    return true
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

function fieldErrors(body: unknown): Record<string, string> {
  const source =
    typeof body === 'object' && body !== null && 'errors' in body ? (body as { errors: unknown }).errors : body
  if (typeof source !== 'object' || source === null) return {}
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(source)) {
    const first = Array.isArray(value) ? value[0] : value
    if (typeof first === 'string') result[key] = first
  }
  return result
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = session.access()
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`/api/platform/v1${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  if (response.status === 401 && retry && (await refreshSession())) return api<T>(path, init, false)
  if (response.status === 401) {
    session.clear()
    window.dispatchEvent(new Event('platform:signed-out'))
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    throw new ApiError(response.status, fieldErrors(body))
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

export async function login(username: string, password: string): Promise<void> {
  const response = await fetch('/api/platform/v1/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!response.ok) throw new ApiError(response.status)
  const body = (await response.json()) as Tokens
  session.save(body.result.access_token, body.result.refresh_token)
}

export async function restore(): Promise<boolean> {
  return session.refresh() ? refreshSession() : false
}

export async function logout(): Promise<void> {
  const refresh = session.refresh()
  try {
    if (refresh) await api('/auth/logout/', { method: 'POST', body: { refresh_token: refresh } }, false)
  } catch {
    // Signing out locally must work even when the server is unreachable.
  }
  session.clear()
}

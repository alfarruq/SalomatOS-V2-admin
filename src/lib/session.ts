// The access token lives in memory only. The refresh token is the one value kept in
// localStorage so a reload does not sign the vendor out; it is cleared on logout and on 401.
const KEY = 'salomat-platform:refresh_token'

let accessToken: string | null = null

export const session = {
  access: () => accessToken,
  refresh(): string | null {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  save(access: string, refresh: string): void {
    accessToken = access
    try {
      localStorage.setItem(KEY, refresh)
    } catch {
      // Storage may be blocked; the session then lasts until reload.
    }
  },
  clear(): void {
    accessToken = null
    try {
      localStorage.removeItem(KEY)
    } catch {
      // See save().
    }
  },
}

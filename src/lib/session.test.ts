import { session } from './session'

test('keeps the access token in memory and the refresh token in storage', () => {
  session.save('a', 'r')
  expect(session.access()).toBe('a')
  expect(session.refresh()).toBe('r')
  session.clear()
  expect(session.access()).toBeNull()
  expect(session.refresh()).toBeNull()
})

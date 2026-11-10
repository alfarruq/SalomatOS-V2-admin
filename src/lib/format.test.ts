import { addDays, day, money } from './format'

test('formats dates for display', () => {
  expect(day('2026-11-10')).toBe('10.11.2026')
  expect(day(null)).toBe('-')
})

test('formats money with the currency', () => {
  expect(money('1000.00', 'USD')).toMatch(/1\s?000 USD/)
})

test('adds days to a date', () => {
  expect(addDays(new Date('2026-11-10T00:00:00Z'), 30)).toBe('2026-12-10')
})

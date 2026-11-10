import { generatePassword } from './password'

test('generates a password of the asked length without look-alike characters', () => {
  const password = generatePassword(16)
  expect(password).toHaveLength(16)
  expect(password).not.toMatch(/[0OlI1]/)
})

test('generates a different password each time', () => {
  expect(generatePassword()).not.toBe(generatePassword())
})

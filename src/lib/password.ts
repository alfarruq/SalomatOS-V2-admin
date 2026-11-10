// No look-alike characters (0/O, 1/l/I): the vendor reads this password out over the phone.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generatePassword(length = 12): string {
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (n) => ALPHABET[n % ALPHABET.length]).join('')
}

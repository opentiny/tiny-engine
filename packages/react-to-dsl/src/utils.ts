// Local 8-char id generator: digits + lowercase letters only
const _ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'
function genId8(): string {
  let id = ''
  for (let i = 0; i < 8; i++) {
    // Use Math.random for simplicity; sufficient for schema ids
    const idx = Math.floor(Math.random() * _ID_ALPHABET.length)
    id += _ID_ALPHABET.charAt(idx)
  }
  return id
}

export { genId8 }

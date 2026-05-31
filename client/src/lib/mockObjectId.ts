/** Deterministic 24-char hex id for mock/seed data (not a real MongoDB ObjectId). */
export function mockObjectId(key: string): string {
  const bytes = new TextEncoder().encode(key)
  let hex = ''
  for (let i = 0; i < 12; i++) {
    hex += (bytes[i % bytes.length] ?? 0).toString(16).padStart(2, '0')
  }
  return hex.padEnd(24, '0').slice(0, 24)
}

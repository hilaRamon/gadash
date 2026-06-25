export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function assertEndAfterStart(startTime: string, endTime: string): string | null {
  const parse = (value: string) => {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})$/)
    if (!match) return null
    return Number(match[1]) * 60 + Number(match[2])
  }
  const start = parse(startTime)
  const end = parse(endTime)
  if (start == null || end == null) return null
  if (end <= start) return 'שעת סיום חייבת להיות אחרי שעת התחלה'
  return null
}

export function getApiErrorMessage(error: unknown, fallback = 'אירעה שגיאה. נסו שוב.'): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string; message?: string } } })
      .response
    const message = response?.data?.error ?? response?.data?.message
    if (typeof message === 'string' && message.trim()) return message
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

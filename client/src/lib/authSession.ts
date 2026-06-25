let onUnauthorized: (() => void) | null = null

export function registerUnauthorizedHandler(handler: () => void): () => void {
  onUnauthorized = handler
  return () => {
    if (onUnauthorized === handler) {
      onUnauthorized = null
    }
  }
}

export function notifyUnauthorized(): void {
  onUnauthorized?.()
}

/** Marks mock/dev rows so they cannot be mistaken for production. */
export const DEV_NAME_PREFIX = 'דמו '

const KEEP_ORIGINAL_NAMES = new Set([
  'אבי סיטון',
  'זריעה',
  'זריעה+אי פליחה',
])

export function toDevName(name: string): string {
  if (!name || KEEP_ORIGINAL_NAMES.has(name) || name.startsWith(DEV_NAME_PREFIX)) {
    return name
  }
  return `${DEV_NAME_PREFIX}${name}`
}

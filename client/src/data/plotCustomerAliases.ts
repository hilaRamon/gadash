import { toDevName } from './devSeedName'

/** Maps plot spreadsheet customer names to names stored in the customers collection. */
const plotCustomerNameAliasesRaw: Record<string, string> = {
  'מקנה הרים': 'מקנה הרים- חננאל',
  'חוות גבעות עולם': 'חוות גבעום עולם',
  'חוות מגדי (יוסף חיים מגדי)': 'חוות מגנזי (יוסף חיים מגנזי)',
  'חוות מגזדי (יוסף חיים מגזדי)': 'חוות מגנזי (יוסף חיים מגנזי)',
  'אריאל גרילניק': 'אריאל גיליניק',
  'לירון שמשוביץ חמרה': 'לירן שמשוביץ חמרה',
  'עינות קדם בע"מ - בתנאי שהם נותנים צ': 'עינות קדם בע"מ - בתנאי שהם נותנים צ\'קים מראש.',
}

export const plotCustomerNameAliases: Record<string, string> = Object.fromEntries(
  Object.entries(plotCustomerNameAliasesRaw).map(([from, to]) => [
    toDevName(from),
    toDevName(to),
  ]),
)

export function resolvePlotCustomerName(name: string): string {
  return plotCustomerNameAliases[name] ?? name
}

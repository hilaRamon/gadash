/** Maps plot spreadsheet customer names to names stored in the customers collection. */
export const plotCustomerNameAliases: Record<string, string> = {
  'מקנה הרים': 'מקנה הרים- חננאל',
  'חוות גבעות עולם': 'חוות גבעום עולם',
  'חוות מגדי (יוסף חיים מגדי)': 'חוות מגנזי (יוסף חיים מגנזי)',
  'חוות מגזדי (יוסף חיים מגזדי)': 'חוות מגנזי (יוסף חיים מגנזי)',
  'אריאל גרילניק': 'אריאל גיליניק',
  'לירון שמשוביץ חמרה': 'לירן שמשוביץ חמרה',
  'עינות קדם בע"מ - בתנאי שהם נותנים צ': 'עינות קדם בע"מ - בתנאי שהם נותנים צ\'קים מראש.',
}

export function resolvePlotCustomerName(name: string): string {
  return plotCustomerNameAliases[name] ?? name
}

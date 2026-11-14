const CIVIL_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Format ISO civil dates without shifting them through the browser timezone. */
export function formatDate(value: string | Date): string {
  const isCivilDate = typeof value === 'string' && CIVIL_DATE.test(value);
  const date = value instanceof Date
    ? value
    : new Date(isCivilDate ? `${value}T00:00:00.000Z` : value);
  return new Intl.DateTimeFormat('pt-BR', isCivilDate ? { timeZone: 'UTC' } : undefined).format(date);
}

export function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${pluralLabel(count, singular, plural)}`;
}

export function pluralLabel(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

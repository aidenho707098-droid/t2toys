/** Must match the CHECK on public.profiles.username. */
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export type UsernameProblem = 'too_short' | 'too_long' | 'invalid_chars' | null;

export function validateUsername(value: string): UsernameProblem {
  if (value.length < 3) return 'too_short';
  if (value.length > 20) return 'too_long';
  if (!USERNAME_PATTERN.test(value)) return 'invalid_chars';
  return null;
}

/** Suggests a starting username from a display name or email, e.g. "Ian Ho" → "ian_ho". */
export function suggestUsername(source: string | null | undefined): string {
  const base = (source ?? '')
    .split('@')[0]
    .normalize('NFKD')
    .replace(/[^\w\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase()
    .slice(0, 20);
  return base.length >= 3 ? base : '';
}

import type { TFunction } from 'i18next';

/**
 * Formats an integer HKD price. `null` means negotiable (議價).
 * Never shows decimals — the old app's "HKD 1500.0" is exactly what we're fixing.
 */
export function formatPrice(priceHkd: number | null | undefined, t: TFunction): string {
  if (priceHkd === null || priceHkd === undefined) return t('price.negotiable');
  if (!Number.isFinite(priceHkd) || priceHkd < 0) return t('price.negotiable');
  const whole = Math.round(priceHkd);
  return `HK$${whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/** "剛剛", "5 分鐘前", "3 日前", or a date for anything older than 30 days. */
export function formatRelativeTime(iso: string, t: TFunction, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffSec = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 1000));
  if (diffSec < 60) return t('time.justNow');
  const min = Math.floor(diffSec / 60);
  if (min < 60) return t('time.minutesAgo', { count: min });
  const hr = Math.floor(min / 60);
  if (hr < 24) return t('time.hoursAgo', { count: hr });
  const day = Math.floor(hr / 24);
  if (day <= 30) return t('time.daysAgo', { count: day });
  const y = then.getFullYear();
  const m = String(then.getMonth() + 1).padStart(2, '0');
  const d = String(then.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Usernames are always shown with @, never as internal ids like "kuen#66764". */
export function formatUsername(username: string | null | undefined, t: TFunction): string {
  return username ? `@${username}` : t('user.unnamed');
}

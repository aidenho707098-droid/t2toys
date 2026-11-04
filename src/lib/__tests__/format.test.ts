import i18n from '@/lib/i18n';
import { formatPrice, formatRelativeTime, formatUsername } from '@/lib/format';

const now = new Date('2026-11-05T12:00:00Z');
const minus = (ms: number) => new Date(now.getTime() - ms).toISOString();

describe('formatPrice', () => {
  beforeAll(() => i18n.changeLanguage('zh-HK'));

  it('formats whole HKD with thousands separators and no decimals', () => {
    expect(formatPrice(1500, i18n.t)).toBe('HK$1,500');
    expect(formatPrice(1234567, i18n.t)).toBe('HK$1,234,567');
    expect(formatPrice(0, i18n.t)).toBe('HK$0');
  });

  it('rounds stray decimals instead of showing them', () => {
    expect(formatPrice(1500.0, i18n.t)).toBe('HK$1,500');
    expect(formatPrice(99.6, i18n.t)).toBe('HK$100');
  });

  it('shows negotiable for null, undefined and invalid prices', () => {
    expect(formatPrice(null, i18n.t)).toBe('議價');
    expect(formatPrice(undefined, i18n.t)).toBe('議價');
    expect(formatPrice(-5, i18n.t)).toBe('議價');
  });

  it('uses English copy in English', async () => {
    await i18n.changeLanguage('en');
    expect(formatPrice(null, i18n.t)).toBe('Negotiable');
    await i18n.changeLanguage('zh-HK');
  });
});

describe('formatRelativeTime', () => {
  it('handles zh-HK units', async () => {
    await i18n.changeLanguage('zh-HK');
    expect(formatRelativeTime(minus(10_000), i18n.t, now)).toBe('剛剛');
    expect(formatRelativeTime(minus(5 * 60_000), i18n.t, now)).toBe('5 分鐘前');
    expect(formatRelativeTime(minus(3 * 3_600_000), i18n.t, now)).toBe('3 小時前');
    expect(formatRelativeTime(minus(2 * 86_400_000), i18n.t, now)).toBe('2 日前');
  });

  it('pluralises English', async () => {
    await i18n.changeLanguage('en');
    expect(formatRelativeTime(minus(60_000), i18n.t, now)).toBe('1 min ago');
    expect(formatRelativeTime(minus(2 * 86_400_000), i18n.t, now)).toBe('2 days ago');
    await i18n.changeLanguage('zh-HK');
  });

  it('falls back to a date after 30 days and never goes negative', () => {
    expect(formatRelativeTime('2026-09-01T12:00:00Z', i18n.t, now)).toBe('2026-09-01');
    expect(formatRelativeTime(new Date(now.getTime() + 60_000).toISOString(), i18n.t, now)).toBe('剛剛');
  });
});

describe('formatUsername', () => {
  it('prefixes @ and never exposes ids', () => {
    expect(formatUsername('kuen', i18n.t)).toBe('@kuen');
    expect(formatUsername(null, i18n.t)).toBe('未命名用戶');
  });
});

import { toE164 } from '@/features/auth/phone';
import { suggestUsername, validateUsername } from '@/features/auth/username';

describe('toE164', () => {
  it('accepts HK mobiles in common formats', () => {
    expect(toE164('HK', '9123 4567')).toBe('+85291234567');
    expect(toE164('HK', '+852 6123-4567')).toBe('+85261234567');
    expect(toE164('HK', '51234567')).toBe('+85251234567');
  });

  it('rejects HK landlines and wrong lengths', () => {
    expect(toE164('HK', '21234567')).toBeNull(); // landline prefix 2
    expect(toE164('HK', '9123456')).toBeNull();
    expect(toE164('HK', '912345678')).toBeNull();
  });

  it('handles TW with or without the trunk 0', () => {
    expect(toE164('TW', '0912 345 678')).toBe('+886912345678');
    expect(toE164('TW', '912345678')).toBe('+886912345678');
    expect(toE164('TW', '0212345678')).toBeNull();
  });

  it('handles US numbers', () => {
    expect(toE164('US', '(415) 555-2671')).toBe('+14155552671');
    expect(toE164('US', '1 415 555 2671')).toBe('+14155552671');
    expect(toE164('US', '015 555 2671')).toBeNull();
  });

  it('requires a full international number for OTHER', () => {
    expect(toE164('OTHER', '+65 9123 4567')).toBe('+6591234567');
    expect(toE164('OTHER', '6591234567')).toBe('+6591234567');
    expect(toE164('OTHER', '123')).toBeNull();
  });
});

describe('validateUsername', () => {
  it('matches the database rule', () => {
    expect(validateUsername('kuen')).toBeNull();
    expect(validateUsername('dusty_pk88')).toBeNull();
    expect(validateUsername('ab')).toBe('too_short');
    expect(validateUsername('a'.repeat(21))).toBe('too_long');
    expect(validateUsername('有中文')).toBe('invalid_chars');
    expect(validateUsername('has space')).toBe('invalid_chars');
  });
});

describe('suggestUsername', () => {
  it('derives a valid suggestion or nothing', () => {
    expect(suggestUsername('Ian Ho')).toBe('ian_ho');
    expect(suggestUsername('ian.hcy2030@gmail.com')).toBe('ianhcy2030');
    expect(suggestUsername('陳')).toBe('');
    expect(suggestUsername(null)).toBe('');
  });
});

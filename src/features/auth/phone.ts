export type PhoneRegion = 'HK' | 'TW' | 'US' | 'OTHER';

export const PHONE_REGIONS: { region: PhoneRegion; dialCode: string | null }[] = [
  { region: 'HK', dialCode: '852' },
  { region: 'TW', dialCode: '886' },
  { region: 'US', dialCode: '1' },
  { region: 'OTHER', dialCode: null },
];

/**
 * Turns what the user typed into E.164 (+85291234567), or null if it isn't a plausible mobile number.
 * Accepts spaces, dashes and brackets. For OTHER the user types the full number with country code.
 */
export function toE164(region: PhoneRegion, input: string): string | null {
  const digits = input.replace(/[^\d+]/g, '');
  switch (region) {
    case 'HK': {
      const local = digits.replace(/^\+?852/, '');
      // HK mobiles: 8 digits starting 4–9.
      return /^[4-9]\d{7}$/.test(local) ? `+852${local}` : null;
    }
    case 'TW': {
      // Accept 0912345678 or 912345678.
      const local = digits.replace(/^\+?886/, '').replace(/^0/, '');
      return /^9\d{8}$/.test(local) ? `+886${local}` : null;
    }
    case 'US': {
      const local = digits.replace(/^\+?1(?=\d{10}$)/, '');
      return /^[2-9]\d{2}[2-9]\d{6}$/.test(local) ? `+1${local}` : null;
    }
    case 'OTHER': {
      const e164 = digits.startsWith('+') ? digits : `+${digits}`;
      return /^\+[1-9]\d{7,14}$/.test(e164) ? e164 : null;
    }
  }
}

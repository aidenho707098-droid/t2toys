import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/i18n/en.json';
import zhHK from '@/i18n/zh-HK.json';

export const SUPPORTED_LOCALES = ['zh-HK', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

/** zh-HK is the default; any English device locale gets English. */
export function detectLocale(): AppLocale {
  const tag = getLocales()[0]?.languageCode ?? 'zh';
  return tag === 'en' ? 'en' : 'zh-HK';
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: { 'zh-HK': { translation: zhHK }, en: { translation: en } },
    lng: detectLocale(),
    fallbackLng: 'zh-HK',
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export default i18n;

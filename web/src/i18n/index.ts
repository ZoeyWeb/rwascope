import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { mapBrowserLang } from './detectLocale';

import enNav from '../locales/en/nav.json';
import enFooter from '../locales/en/footer.json';
import enHome from '../locales/en/home.json';
import zhHansNav from '../locales/zh-Hans/nav.json';
import zhHansFooter from '../locales/zh-Hans/footer.json';
import zhHansHome from '../locales/zh-Hans/home.json';
import zhHantNav from '../locales/zh-Hant/nav.json';
import zhHantFooter from '../locales/zh-Hant/footer.json';
import zhHantHome from '../locales/zh-Hant/home.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en:        { nav: enNav,      footer: enFooter,      home: enHome },
      'zh-Hans': { nav: zhHansNav,  footer: zhHansFooter,  home: zhHansHome },
      'zh-Hant': { nav: zhHantNav,  footer: zhHantFooter,  home: zhHantHome },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh-Hans', 'zh-Hant'],
    defaultNS: 'nav',
    ns: ['nav', 'footer', 'home'],
    detection: {
      order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['cookie', 'localStorage'],
      lookupCookie: 'rwa_locale',
      cookieMinutes: 525600,
      cookieOptions: { path: '/', sameSite: 'lax' as const },
      convertDetectedLanguage: mapBrowserLang,
    },
    interpolation: { escapeValue: false },
  });

document.documentElement.lang = i18n.language;
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { mapBrowserLang } from './detectLocale';

import enNav from '../locales/en/nav.json';
import enFooter from '../locales/en/footer.json';
import enHome from '../locales/en/home.json';
import enHkObservation from '../locales/en/hkObservation.json';
import enIntelligence from '../locales/en/intelligence.json';
import enAbout from '../locales/en/about.json';
import enRarm from '../locales/en/rarm.json';
import enMethodology from '../locales/en/methodology.json';
import enAssetsMethodology from '../locales/en/assetsMethodology.json';
import zhHansNav from '../locales/zh-Hans/nav.json';
import zhHansFooter from '../locales/zh-Hans/footer.json';
import zhHansHome from '../locales/zh-Hans/home.json';
import zhHansHkObservation from '../locales/zh-Hans/hkObservation.json';
import zhHansIntelligence from '../locales/zh-Hans/intelligence.json';
import zhHansAbout from '../locales/zh-Hans/about.json';
import zhHansRarm from '../locales/zh-Hans/rarm.json';
import zhHansMethodology from '../locales/zh-Hans/methodology.json';
import zhHansAssetsMethodology from '../locales/zh-Hans/assetsMethodology.json';
import zhHantNav from '../locales/zh-Hant/nav.json';
import zhHantFooter from '../locales/zh-Hant/footer.json';
import zhHantHome from '../locales/zh-Hant/home.json';
import zhHantHkObservation from '../locales/zh-Hant/hkObservation.json';
import zhHantIntelligence from '../locales/zh-Hant/intelligence.json';
import zhHantAbout from '../locales/zh-Hant/about.json';
import zhHantRarm from '../locales/zh-Hant/rarm.json';
import zhHantMethodology from '../locales/zh-Hant/methodology.json';
import zhHantAssetsMethodology from '../locales/zh-Hant/assetsMethodology.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en:        { nav: enNav,      footer: enFooter,      home: enHome,      hkObservation: enHkObservation,      intelligence: enIntelligence,      about: enAbout,      rarm: enRarm,      methodology: enMethodology,      assetsMethodology: enAssetsMethodology },
      'zh-Hans': { nav: zhHansNav,  footer: zhHansFooter,  home: zhHansHome,  hkObservation: zhHansHkObservation,  intelligence: zhHansIntelligence,  about: zhHansAbout,  rarm: zhHansRarm,  methodology: zhHansMethodology,  assetsMethodology: zhHansAssetsMethodology },
      'zh-Hant': { nav: zhHantNav,  footer: zhHantFooter,  home: zhHantHome,  hkObservation: zhHantHkObservation,  intelligence: zhHantIntelligence,  about: zhHantAbout,  rarm: zhHantRarm,  methodology: zhHantMethodology,  assetsMethodology: zhHantAssetsMethodology },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh-Hans', 'zh-Hant'],
    defaultNS: 'nav',
    ns: ['nav', 'footer', 'home', 'hkObservation', 'intelligence', 'about', 'rarm', 'methodology', 'assetsMethodology'],
    detection: {
      order: ['cookie', 'localStorage'],
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

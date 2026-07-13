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
import enSarm from '../locales/en/sarm.json';
import enLicensesMethodology from '../locales/en/licensesMethodology.json';
import enCompliance from '../locales/en/compliance.json';
import enComplianceMap from '../locales/en/complianceMap.json';
import enLicensesMap from '../locales/en/licensesMap.json';
import enAssetsMap from '../locales/en/assetsMap.json';
import enIncidentsMap from '../locales/en/incidentsMap.json';
import enEnforcementMap from '../locales/en/enforcementMap.json';
import enDisclosuresMap from '../locales/en/disclosuresMap.json';
import enEcosystemMap from '../locales/en/ecosystemMap.json';
import enProjectsMap from '../locales/en/projectsMap.json';
import enComplianceMethodology from '../locales/en/complianceMethodology.json';
import enIncidentsMethodology from '../locales/en/incidentsMethodology.json';
import enEnsembleMethodology from '../locales/en/ensembleMethodology.json';
import enReportsMethodology from '../locales/en/reportsMethodology.json';
import zhHansNav from '../locales/zh-Hans/nav.json';
import zhHansFooter from '../locales/zh-Hans/footer.json';
import zhHansHome from '../locales/zh-Hans/home.json';
import zhHansHkObservation from '../locales/zh-Hans/hkObservation.json';
import zhHansIntelligence from '../locales/zh-Hans/intelligence.json';
import zhHansAbout from '../locales/zh-Hans/about.json';
import zhHansRarm from '../locales/zh-Hans/rarm.json';
import zhHansMethodology from '../locales/zh-Hans/methodology.json';
import zhHansAssetsMethodology from '../locales/zh-Hans/assetsMethodology.json';
import zhHansSarm from '../locales/zh-Hans/sarm.json';
import zhHansLicensesMethodology from '../locales/zh-Hans/licensesMethodology.json';
import zhHansCompliance from '../locales/zh-Hans/compliance.json';
import zhHansComplianceMap from '../locales/zh-Hans/complianceMap.json';
import zhHansLicensesMap from '../locales/zh-Hans/licensesMap.json';
import zhHansAssetsMap from '../locales/zh-Hans/assetsMap.json';
import zhHansIncidentsMap from '../locales/zh-Hans/incidentsMap.json';
import zhHansEnforcementMap from '../locales/zh-Hans/enforcementMap.json';
import zhHansDisclosuresMap from '../locales/zh-Hans/disclosuresMap.json';
import zhHansEcosystemMap from '../locales/zh-Hans/ecosystemMap.json';
import zhHansProjectsMap from '../locales/zh-Hans/projectsMap.json';
import zhHansComplianceMethodology from '../locales/zh-Hans/complianceMethodology.json';
import zhHansIncidentsMethodology from '../locales/zh-Hans/incidentsMethodology.json';
import zhHansEnsembleMethodology from '../locales/zh-Hans/ensembleMethodology.json';
import zhHansReportsMethodology from '../locales/zh-Hans/reportsMethodology.json';
import zhHantNav from '../locales/zh-Hant/nav.json';
import zhHantFooter from '../locales/zh-Hant/footer.json';
import zhHantHome from '../locales/zh-Hant/home.json';
import zhHantHkObservation from '../locales/zh-Hant/hkObservation.json';
import zhHantIntelligence from '../locales/zh-Hant/intelligence.json';
import zhHantAbout from '../locales/zh-Hant/about.json';
import zhHantRarm from '../locales/zh-Hant/rarm.json';
import zhHantMethodology from '../locales/zh-Hant/methodology.json';
import zhHantAssetsMethodology from '../locales/zh-Hant/assetsMethodology.json';
import zhHantSarm from '../locales/zh-Hant/sarm.json';
import zhHantLicensesMethodology from '../locales/zh-Hant/licensesMethodology.json';
import zhHantCompliance from '../locales/zh-Hant/compliance.json';
import zhHantComplianceMap from '../locales/zh-Hant/complianceMap.json';
import zhHantLicensesMap from '../locales/zh-Hant/licensesMap.json';
import zhHantAssetsMap from '../locales/zh-Hant/assetsMap.json';
import zhHantIncidentsMap from '../locales/zh-Hant/incidentsMap.json';
import zhHantEnforcementMap from '../locales/zh-Hant/enforcementMap.json';
import zhHantDisclosuresMap from '../locales/zh-Hant/disclosuresMap.json';
import zhHantEcosystemMap from '../locales/zh-Hant/ecosystemMap.json';
import zhHantProjectsMap from '../locales/zh-Hant/projectsMap.json';
import zhHantComplianceMethodology from '../locales/zh-Hant/complianceMethodology.json';
import zhHantIncidentsMethodology from '../locales/zh-Hant/incidentsMethodology.json';
import zhHantEnsembleMethodology from '../locales/zh-Hant/ensembleMethodology.json';
import zhHantReportsMethodology from '../locales/zh-Hant/reportsMethodology.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en:        { nav: enNav,      footer: enFooter,      home: enHome,      hkObservation: enHkObservation,      intelligence: enIntelligence,      about: enAbout,      rarm: enRarm,      methodology: enMethodology,      assetsMethodology: enAssetsMethodology,      sarm: enSarm,      licensesMethodology: enLicensesMethodology,      compliance: enCompliance,      complianceMap: enComplianceMap,      complianceMethodology: enComplianceMethodology,      licensesMap: enLicensesMap,      assetsMap: enAssetsMap,      incidentsMap: enIncidentsMap,      incidentsMethodology: enIncidentsMethodology,      enforcementMap: enEnforcementMap,      disclosuresMap: enDisclosuresMap,      ecosystemMap: enEcosystemMap,      projectsMap: enProjectsMap,      ensembleMethodology: enEnsembleMethodology,      reportsMethodology: enReportsMethodology },
      'zh-Hans': { nav: zhHansNav,  footer: zhHansFooter,  home: zhHansHome,  hkObservation: zhHansHkObservation,  intelligence: zhHansIntelligence,  about: zhHansAbout,  rarm: zhHansRarm,  methodology: zhHansMethodology,  assetsMethodology: zhHansAssetsMethodology,  sarm: zhHansSarm,  licensesMethodology: zhHansLicensesMethodology,  compliance: zhHansCompliance,  complianceMap: zhHansComplianceMap,  complianceMethodology: zhHansComplianceMethodology,  licensesMap: zhHansLicensesMap,  assetsMap: zhHansAssetsMap,  incidentsMap: zhHansIncidentsMap,  incidentsMethodology: zhHansIncidentsMethodology,  enforcementMap: zhHansEnforcementMap,  disclosuresMap: zhHansDisclosuresMap,  ecosystemMap: zhHansEcosystemMap,  projectsMap: zhHansProjectsMap,  ensembleMethodology: zhHansEnsembleMethodology,  reportsMethodology: zhHansReportsMethodology },
      'zh-Hant': { nav: zhHantNav,  footer: zhHantFooter,  home: zhHantHome,  hkObservation: zhHantHkObservation,  intelligence: zhHantIntelligence,  about: zhHantAbout,  rarm: zhHantRarm,  methodology: zhHantMethodology,  assetsMethodology: zhHantAssetsMethodology,  sarm: zhHantSarm,  licensesMethodology: zhHantLicensesMethodology,  compliance: zhHantCompliance,  complianceMap: zhHantComplianceMap,  complianceMethodology: zhHantComplianceMethodology,  licensesMap: zhHantLicensesMap,  assetsMap: zhHantAssetsMap,  incidentsMap: zhHantIncidentsMap,  incidentsMethodology: zhHantIncidentsMethodology,  enforcementMap: zhHantEnforcementMap,  disclosuresMap: zhHantDisclosuresMap,  ecosystemMap: zhHantEcosystemMap,  projectsMap: zhHantProjectsMap,  ensembleMethodology: zhHantEnsembleMethodology,  reportsMethodology: zhHantReportsMethodology },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh-Hans', 'zh-Hant'],
    defaultNS: 'nav',
    ns: ['nav', 'footer', 'home', 'hkObservation', 'intelligence', 'about', 'rarm', 'methodology', 'assetsMethodology', 'sarm', 'licensesMethodology', 'compliance', 'complianceMap', 'complianceMethodology', 'licensesMap', 'assetsMap', 'incidentsMap', 'incidentsMethodology', 'enforcementMap', 'disclosuresMap', 'ecosystemMap', 'projectsMap', 'ensembleMethodology', 'reportsMethodology'],
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

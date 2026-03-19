// =============================================================================
// PawLand - i18n Configuration
// Internationalization setup using i18next and react-i18next
// =============================================================================

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import trCommon from "../locales/tr/common.json";
import trAuth from "../locales/tr/auth.json";
import trSettings from "../locales/tr/settings.json";
import trErrors from "../locales/tr/errors.json";

import enCommon from "../locales/en/common.json";
import enAuth from "../locales/en/auth.json";
import enSettings from "../locales/en/settings.json";
import enErrors from "../locales/en/errors.json";

import esCommon from "../locales/es/common.json";
import esAuth from "../locales/es/auth.json";
import esSettings from "../locales/es/settings.json";
import esErrors from "../locales/es/errors.json";

import deCommon from "../locales/de/common.json";
import deAuth from "../locales/de/auth.json";
import deSettings from "../locales/de/settings.json";
import deErrors from "../locales/de/errors.json";

import frCommon from "../locales/fr/common.json";
import frAuth from "../locales/fr/auth.json";
import frSettings from "../locales/fr/settings.json";
import frErrors from "../locales/fr/errors.json";

import ptCommon from "../locales/pt/common.json";
import ptAuth from "../locales/pt/auth.json";
import ptSettings from "../locales/pt/settings.json";
import ptErrors from "../locales/pt/errors.json";

import arCommon from "../locales/ar/common.json";
import arAuth from "../locales/ar/auth.json";
import arSettings from "../locales/ar/settings.json";
import arErrors from "../locales/ar/errors.json";

// Translation resources
const resources = {
  tr: {
    common: trCommon,
    auth: trAuth,
    settings: trSettings,
    errors: trErrors,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    settings: enSettings,
    errors: enErrors,
  },
  es: {
    common: esCommon,
    auth: esAuth,
    settings: esSettings,
    errors: esErrors,
  },
  de: {
    common: deCommon,
    auth: deAuth,
    settings: deSettings,
    errors: deErrors,
  },
  fr: {
    common: frCommon,
    auth: frAuth,
    settings: frSettings,
    errors: frErrors,
  },
  pt: {
    common: ptCommon,
    auth: ptAuth,
    settings: ptSettings,
    errors: ptErrors,
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    settings: arSettings,
    errors: arErrors,
  },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: "tr", // Fallback to Turkish if translation missing
    defaultNS: "common", // Default namespace
    ns: ["common", "auth", "settings", "errors"], // Available namespaces

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      // Detection order
      order: ["localStorage", "navigator"],
      // Cache user language preference
      caches: ["localStorage"],
      lookupLocalStorage: "pawland_language",
    },

    react: {
      useSuspense: false, // Disable suspense for now (can enable later)
    },
  });

export default i18n;

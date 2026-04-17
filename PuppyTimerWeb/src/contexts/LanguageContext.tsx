// =============================================================================
// PawLand - Language Context
// Manages language state and syncs with i18next, localStorage, and Firestore
// =============================================================================

import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { kaydetDil, getDil } from "../services/languageService";

// Supported languages
export type Language = "tr" | "en" | "es" | "de" | "fr" | "pt" | "ar";

// Locale mapping for date formatting
export const LOCALE_MAP: Record<Language, string> = {
  tr: "tr-TR",
  en: "en-US",
  es: "es-ES",
  de: "de-DE",
  fr: "fr-FR",
  pt: "pt-PT",
  ar: "ar-SA",
};

// Language names (native)
export const LANGUAGE_NAMES: Record<Language, string> = {
  tr: "Türkçe",
  en: "English",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
  pt: "Português",
  ar: "العربية",
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  getLocale: () => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>(() => {
    // Initialize from localStorage or default to Turkish
    const saved = getDil();
    return saved || "tr";
  });

  // Check if current language is RTL (Right-to-Left)
  const isRTL = language === "ar";

  // Get locale string for current language
  const getLocale = () => LOCALE_MAP[language];

  // Set language and sync to i18next, localStorage, and Firestore
  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await i18n.changeLanguage(lang);
    kaydetDil(lang);
  };

  // Initialize i18next language on mount
  useEffect(() => {
    i18n.changeLanguage(language);
  }, []);

  // Update HTML dir attribute for RTL support
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [isRTL, language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    isRTL,
    getLocale,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// Custom hook to use language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

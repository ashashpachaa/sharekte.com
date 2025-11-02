import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./locales/en.json";
import arTranslations from "./locales/ar.json";

const resources = {
  en: {
    translation: enTranslations,
  },
  ar: {
    translation: arTranslations,
  },
};

// Initialize i18n
i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("language") || "en",
  fallbackLng: "en",
  ns: ["translation"],
  defaultNS: "translation",
  interpolation: {
    escapeValue: false,
  },
  returnNull: true,
  returnEmptyString: true,
});

// Handle language change - update HTML attributes for RTL
i18n.on("languageChanged", (lng) => {
  localStorage.setItem("language", lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
  document.documentElement.className = lng === "ar" ? "rtl" : "ltr";
});

// Set initial direction on load
const initialLang = i18n.language;
document.documentElement.lang = initialLang;
document.documentElement.dir = initialLang === "ar" ? "rtl" : "ltr";
document.documentElement.className = initialLang === "ar" ? "rtl" : "ltr";

export default i18n;

import React, { createContext, useContext, useState } from "react";

export type SupportedLanguage = "en" | "es" | "hi" | "fr" | "de" | "zh";

interface Translations {
  healthScore: string;
  confidence: string;
  disease: string;
  nutrition: string;
  recommendations: string;
  treatment: string;
  prevention: string;
}

const TRANSLATIONS: Record<SupportedLanguage, Translations> = {
  en: {
    healthScore: "Plant Health Score",
    confidence: "Confidence",
    disease: "Primary Diagnosis",
    nutrition: "Nutritional Assessment",
    recommendations: "Care & Treatment Plan",
    treatment: "Recommended Treatment",
    prevention: "Long-Term Prevention",
  },
  es: {
    healthScore: "Puntuación de Salud",
    confidence: "Confianza",
    disease: "Diagnóstico Principal",
    nutrition: "Evaluación Nutricional",
    recommendations: "Plan de Cuidado y Tratamiento",
    treatment: "Tratamiento Recomendado",
    prevention: "Prevención a Largo Plazo",
  },
  hi: {
    healthScore: "पौधे का स्वास्थ्य स्कोर",
    confidence: "विश्वास स्तर",
    disease: "मुख्य निदान",
    nutrition: "पोषण मूल्यांकन",
    recommendations: "देखभाल और उपचार योजना",
    treatment: "अनुशंसित उपचार",
    prevention: "दीर्घकालिक रोकथाम",
  },
  fr: {
    healthScore: "Score de Santé",
    confidence: "Confiance",
    disease: "Diagnostic Principal",
    nutrition: "Évaluation Nutritionnelle",
    recommendations: "Plan de Soins et Traitement",
    treatment: "Traitement Recommandé",
    prevention: "Prévention à Long Terme",
  },
  de: {
    healthScore: "Pflanzengesundheit",
    confidence: "Konfidenz",
    disease: "Hauptdiagnose",
    nutrition: "Nährstoffbewertung",
    recommendations: "Pflege- & Behandlungsplan",
    treatment: "Empfohlene Behandlung",
    prevention: "Langzeitprävention",
  },
  zh: {
    healthScore: "植物健康评分",
    confidence: "置信度",
    disease: "主要诊断",
    nutrition: "营养评估",
    recommendations: "护理与治疗方案",
    treatment: "建议治疗措施",
    prevention: "长期预防措施",
  },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("plantcare_lang") as SupportedLanguage | null;
      if (saved && TRANSLATIONS[saved]) return saved;
    }
    return "en";
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem("plantcare_lang", lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: TRANSLATIONS[language] || TRANSLATIONS.en,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

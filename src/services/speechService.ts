export interface SpeechSettings {
  voiceInputEnabled: boolean;
  audioOutputEnabled: boolean;
  speechRate: number;
  preferredVoiceURI: string;
}

const SPEECH_SETTINGS_KEY = "plantcare_speech_settings";
const LANGUAGE_STORAGE_KEY = "plantcare_lang";

export const LANGUAGE_TO_BCP47: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  hi: "hi-IN",
  fr: "fr-FR",
  de: "de-DE",
  zh: "zh-CN",
  ta: "ta-IN",
};

export const SAMPLE_VOICE_TEXT: Record<string, string> = {
  en: "Hello! This is a PlantCare AI voice test.",
  es: "¡Hola! Esta es una prueba de voz de PlantCare AI.",
  hi: "नमस्ते! यह PlantCare AI ध्वनि परीक्षण है।",
  fr: "Bonjour ! Ceci est un test vocal de PlantCare AI.",
  de: "Hallo! Dies ist ein Sprachtest von PlantCare AI.",
  zh: "您好！这是 PlantCare AI 语音测试。",
  ta: "வணக்கம்! இது PlantCare AI குரல் சோதனை.",
};

export const getSpeechLocale = (langCode?: string): string => {
  const code =
    langCode ||
    (typeof window !== "undefined" ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : null) ||
    "en";
  if (code.includes("-")) return code;
  return LANGUAGE_TO_BCP47[code] || "en-US";
};

export const getStoredSpeechSettings = (): SpeechSettings => {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(SPEECH_SETTINGS_KEY);
      if (raw) {
        return {
          voiceInputEnabled: true,
          audioOutputEnabled: true,
          speechRate: 1.0,
          preferredVoiceURI: "",
          ...JSON.parse(raw),
        };
      }
    } catch {
      // ignore
    }
  }
  return {
    voiceInputEnabled: true,
    audioOutputEnabled: true,
    speechRate: 1.0,
    preferredVoiceURI: "",
  };
};

export const saveStoredSpeechSettings = (settings: SpeechSettings) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(SPEECH_SETTINGS_KEY, JSON.stringify(settings));
  }
};

export const isSpeechSynthesisSupported = (): boolean => {
  return typeof window !== "undefined" && "speechSynthesis" in window;
};

export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  const win = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
};

export interface SpeakOptions {
  lang?: string;
  rate?: number;
  onEnd?: () => void;
  onError?: (err?: string) => void;
  onVoiceFallbackWarning?: (msg: string) => void;
}

export interface VoiceMatchResult {
  voice: SpeechSynthesisVoice | null;
  isExactMatch: boolean;
  isFallback: boolean;
  voicesLoaded: boolean;
}

class TextToSpeechManager {
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;
  private voiceListeners: Set<(voices: SpeechSynthesisVoice[]) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const handleVoicesChanged = () => {
        try {
          const list = window.speechSynthesis.getVoices();
          if (list && list.length > 0) {
            this.cachedVoices = list;
            this.voicesLoaded = true;
            this.voiceListeners.forEach((listener) => listener(list));
          }
        } catch {
          // ignore
        }
      };

      // Initial synchronous attempt
      handleVoicesChanged();

      // Listen for asynchronous voice list population
      if (typeof window.speechSynthesis.addEventListener === "function") {
        window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
      } else if ("onvoiceschanged" in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
      }
    }
  }

  onVoicesChanged(listener: (voices: SpeechSynthesisVoice[]) => void): () => void {
    this.voiceListeners.add(listener);
    const current = this.getVoices();
    if (current.length > 0) {
      listener(current);
    }
    return () => {
      this.voiceListeners.delete(listener);
    };
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!isSpeechSynthesisSupported()) return [];
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        this.cachedVoices = voices;
        this.voicesLoaded = true;
        return voices;
      }
      return this.cachedVoices;
    } catch {
      return this.cachedVoices;
    }
  }

  ensureVoicesLoaded(timeoutMs = 300): Promise<SpeechSynthesisVoice[]> {
    if (!isSpeechSynthesisSupported()) return Promise.resolve([]);
    const existing = this.getVoices();
    if (existing.length > 0) {
      return Promise.resolve(existing);
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = (voices: SpeechSynthesisVoice[]) => {
        if (settled) return;
        settled = true;
        unsubscribe();
        clearTimeout(timer);
        resolve(voices);
      };

      const unsubscribe = this.onVoicesChanged((voices) => {
        if (voices.length > 0) {
          finish(voices);
        }
      });

      const timer = setTimeout(() => {
        finish(this.getVoices());
      }, timeoutMs);
    });
  }

  /**
   * Searches available browser voices for a Tamil voice using:
   * 1. "ta-IN" (exact locale match)
   * 2. "ta" (language code / prefix match, e.g. ta, ta-LK, ta-SG, ta-MY)
   * 3. "Tamil" (voice name or voiceURI match, case-insensitive, or "தமிழ்")
   */
  findTamilVoice(voicesList?: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const voices = voicesList ?? this.getVoices();
    if (!voices.length) return null;

    // 1. Exact "ta-IN" match
    const exactTaIn = voices.find(
      (v) => v.lang.replace("_", "-").toLowerCase() === "ta-in"
    );
    if (exactTaIn) return exactTaIn;

    // 2. Language code "ta" or prefix "ta-"
    const langTa = voices.find((v) => {
      const norm = v.lang.replace("_", "-").toLowerCase();
      return norm === "ta" || norm.startsWith("ta-");
    });
    if (langTa) return langTa;

    // 3. Name or URI containing "Tamil" or "தமிழ்"
    const nameTamil = voices.find(
      (v) =>
        v.name.toLowerCase().includes("tamil") ||
        v.voiceURI.toLowerCase().includes("tamil") ||
        v.name.includes("தமிழ்")
    );
    if (nameTamil) return nameTamil;

    return null;
  }

  /**
   * Selects a graceful fallback voice when the requested language voice is unavailable.
   */
  findFallbackVoice(voicesList?: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const voices = voicesList ?? this.getVoices();
    if (!voices.length) return null;

    // Prefer Indian English / Hindi voices first for closest regional phonetics, then default/English
    const indianVoice = voices.find((v) => {
      const norm = v.lang.replace("_", "-").toLowerCase();
      return norm === "en-in" || norm === "hi-in" || norm.endsWith("-in");
    });
    if (indianVoice) return indianVoice;

    const defaultVoice = voices.find((v) => v.default);
    if (defaultVoice) return defaultVoice;

    const englishVoice = voices.find((v) =>
      v.lang.replace("_", "-").toLowerCase().startsWith("en")
    );
    if (englishVoice) return englishVoice;

    return voices[0] || null;
  }

  findBestVoice(langCodeOrLocale?: string): VoiceMatchResult {
    const voices = this.getVoices();
    if (!voices.length) {
      return {
        voice: null,
        isExactMatch: false,
        isFallback: false,
        voicesLoaded: this.voicesLoaded,
      };
    }

    const targetBcp47 = getSpeechLocale(langCodeOrLocale).toLowerCase(); // e.g., "ta-in"
    const baseLang = targetBcp47.split("-")[0]; // e.g., "ta"
    const settings = getStoredSpeechSettings();

    // 1. User's preferred voice if it matches the active language
    if (settings.preferredVoiceURI) {
      const preferred = voices.find((v) => v.voiceURI === settings.preferredVoiceURI);
      if (preferred && preferred.lang.replace("_", "-").toLowerCase().startsWith(baseLang)) {
        return {
          voice: preferred,
          isExactMatch: true,
          isFallback: false,
          voicesLoaded: true,
        };
      }
    }

    // 2. Dedicated Tamil voice search ("ta-IN", "ta", "Tamil")
    if (baseLang === "ta") {
      const tamilVoice = this.findTamilVoice(voices);
      if (tamilVoice) {
        return {
          voice: tamilVoice,
          isExactMatch: true,
          isFallback: false,
          voicesLoaded: true,
        };
      }

      const fallback = this.findFallbackVoice(voices);
      return {
        voice: fallback,
        isExactMatch: false,
        isFallback: true,
        voicesLoaded: true,
      };
    }

    // 3. Exact BCP-47 match for other languages (en-US, es-ES, hi-IN, fr-FR, de-DE, zh-CN)
    const exactVoice = voices.find(
      (v) => v.lang.replace("_", "-").toLowerCase() === targetBcp47
    );
    if (exactVoice) {
      return {
        voice: exactVoice,
        isExactMatch: true,
        isFallback: false,
        voicesLoaded: true,
      };
    }

    // 4. Base language prefix match
    const prefixVoice = voices.find((v) => {
      const norm = v.lang.replace("_", "-").toLowerCase();
      return norm === baseLang || norm.startsWith(`${baseLang}-`);
    });
    if (prefixVoice) {
      return {
        voice: prefixVoice,
        isExactMatch: true,
        isFallback: false,
        voicesLoaded: true,
      };
    }

    // 5. Graceful fallback to available voice
    const fallback = this.findFallbackVoice(voices);
    return {
      voice: fallback,
      isExactMatch: false,
      isFallback: true,
      voicesLoaded: true,
    };
  }

  hasLanguageVoice(langCodeOrLocale?: string): boolean {
    const { isExactMatch, voice } = this.findBestVoice(langCodeOrLocale);
    return Boolean(voice && isExactMatch);
  }

  speak(
    text: string,
    optionsOrOnEnd?: SpeakOptions | (() => void),
    onErrorCallback?: () => void,
    explicitLang?: string
  ) {
    let opts: SpeakOptions = {};
    if (typeof optionsOrOnEnd === "function") {
      opts = {
        onEnd: optionsOrOnEnd,
        onError: onErrorCallback ? () => onErrorCallback() : undefined,
        lang: explicitLang,
      };
    } else if (optionsOrOnEnd) {
      opts = optionsOrOnEnd;
    }

    if (!isSpeechSynthesisSupported() || !text) {
      opts.onEnd?.();
      return;
    }

    const settings = getStoredSpeechSettings();
    if (!settings.audioOutputEnabled) {
      opts.onEnd?.();
      return;
    }

    const executeSpeak = (voices: SpeechSynthesisVoice[]) => {
      try {
        window.speechSynthesis.cancel();

        const targetLocale = getSpeechLocale(opts.lang);
        const isTamil = targetLocale.toLowerCase().startsWith("ta");
        const rate = opts.rate ?? settings.speechRate ?? 1.0;

        const match = this.findBestVoice(targetLocale);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;

        if (match.voice && match.isExactMatch) {
          // Native matching voice found (e.g. ta-IN / ta / Tamil)
          utterance.voice = match.voice;
          utterance.lang = match.voice.lang || targetLocale;
        } else if (isTamil) {
          // No dedicated Tamil voice found in getVoices()
          if (voices.length > 0) {
            opts.onVoiceFallbackWarning?.(
              "No dedicated Tamil (ta-IN) voice was found on this device. Using an available fallback voice."
            );
          }
          // Keep lang="ta-IN" if no voice object is forced, or use the available fallback voice
          if (match.voice) {
            utterance.voice = match.voice;
            utterance.lang = targetLocale;
          } else {
            utterance.lang = targetLocale;
          }
        } else if (match.voice) {
          utterance.voice = match.voice;
          utterance.lang = match.voice.lang || targetLocale;
        } else {
          utterance.lang = targetLocale;
        }

        let retriedWithFallback = false;

        utterance.onend = () => {
          opts.onEnd?.();
        };

        utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
          // Ignore normal cancellation or interruption events caused by speechSynthesis.cancel()
          if (event.error === "canceled" || event.error === "interrupted") {
            return;
          }

          // If the browser rejected the utterance (e.g., language-unavailable for ta-IN on a non-Tamil OS),
          // gracefully retry once with the default available voice and its native locale so audio never breaks.
          if (!retriedWithFallback) {
            retriedWithFallback = true;
            const fallbackVoice = this.findFallbackVoice(voices);
            if (fallbackVoice) {
              try {
                const fallbackUtterance = new SpeechSynthesisUtterance(text);
                fallbackUtterance.voice = fallbackVoice;
                fallbackUtterance.lang = fallbackVoice.lang || "en-US";
                fallbackUtterance.rate = rate;
                fallbackUtterance.onend = () => opts.onEnd?.();
                fallbackUtterance.onerror = () => opts.onEnd?.();
                window.speechSynthesis.speak(fallbackUtterance);
                return;
              } catch {
                // ignore and finish cleanly
              }
            }
          }

          // Finish cleanly without crashing or showing a misleading application error
          opts.onEnd?.();
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        opts.onEnd?.();
      }
    };

    const currentVoices = this.getVoices();
    if (currentVoices.length > 0) {
      executeSpeak(currentVoices);
    } else {
      this.ensureVoicesLoaded(300).then((loadedVoices) => {
        executeSpeak(loadedVoices);
      });
    }
  }

  pause() {
    if (!isSpeechSynthesisSupported()) return;
    try {
      window.speechSynthesis.pause();
    } catch {
      // ignore
    }
  }

  resume() {
    if (!isSpeechSynthesisSupported()) return;
    try {
      window.speechSynthesis.resume();
    } catch {
      // ignore
    }
  }

  stop() {
    if (!isSpeechSynthesisSupported()) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  getSampleText(langCode?: string): string {
    const activeCode =
      langCode ||
      (typeof window !== "undefined" ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : null) ||
      "en";
    const baseCode = activeCode.split("-")[0].toLowerCase();
    return SAMPLE_VOICE_TEXT[baseCode] || SAMPLE_VOICE_TEXT.en;
  }

  testVoice(
    langCode?: string,
    onEnd?: () => void,
    onWarning?: (msg: string) => void
  ) {
    const sampleText = this.getSampleText(langCode);
    const activeCode =
      langCode ||
      (typeof window !== "undefined" ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : null) ||
      "en";
    const baseCode = activeCode.split("-")[0].toLowerCase();

    this.speak(sampleText, {
      lang: getSpeechLocale(baseCode),
      onEnd,
      onError: () => onEnd?.(),
      onVoiceFallbackWarning: onWarning,
    });
  }
}

export const tts = new TextToSpeechManager();

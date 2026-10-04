export interface SpeechSettings {
  voiceInputEnabled: boolean;
  audioOutputEnabled: boolean;
  speechRate: number;
  preferredVoiceURI: string;
}

const SPEECH_SETTINGS_KEY = "plantcare_speech_settings";

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

export const tts = {
  getVoices(): SpeechSynthesisVoice[] {
    if (!isSpeechSynthesisSupported()) return [];
    return window.speechSynthesis.getVoices();
  },

  speak(
    text: string,
    options?: {
      rate?: number;
      voiceURI?: string;
      onEnd?: () => void;
      onError?: () => void;
    }
  ) {
    if (!isSpeechSynthesisSupported()) {
      options?.onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const stored = getStoredSpeechSettings();
    utterance.rate = options?.rate ?? stored.speechRate ?? 1.0;

    const targetURI = options?.voiceURI ?? stored.preferredVoiceURI;
    if (targetURI) {
      const voices = window.speechSynthesis.getVoices();
      const matched = voices.find((v) => v.voiceURI === targetURI);
      if (matched) utterance.voice = matched;
    }

    utterance.onend = () => options?.onEnd?.();
    utterance.onerror = () => options?.onError?.();
    window.speechSynthesis.speak(utterance);
  },

  stop() {
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  },
};

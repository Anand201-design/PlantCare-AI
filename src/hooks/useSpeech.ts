import { useState, useEffect, useCallback, useRef } from "react";
import {
  isSpeechSynthesisSupported,
  isSpeechRecognitionSupported,
  getSpeechLocale,
  tts,
} from "../services/speechService";
import { useLanguage } from "../context/LanguageContext";

export const useTextToSpeech = () => {
  const { language } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceWarning, setVoiceWarning] = useState<string | null>(null);
  const isSupported = isSpeechSynthesisSupported();

  useEffect(() => {
    return () => {
      if (isSupported) {
        tts.stop();
      }
    };
  }, [isSupported]);

  // Stop ongoing speech and clear warning when language changes
  useEffect(() => {
    setVoiceWarning(null);
    if (isSupported) {
      tts.stop();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [language, isSupported]);

  const speak = useCallback(
    (text: string, customLang?: string) => {
      if (!isSupported || !text) return;
      setVoiceWarning(null);
      setIsSpeaking(true);
      setIsPaused(false);
      const targetLocale = getSpeechLocale(customLang || language);

      tts.speak(text, {
        lang: targetLocale,
        onEnd: () => {
          setIsSpeaking(false);
          setIsPaused(false);
        },
        onError: () => {
          setIsSpeaking(false);
          setIsPaused(false);
        },
        onVoiceFallbackWarning: (msg) => {
          setVoiceWarning(msg);
        },
      });
    },
    [isSupported, language]
  );

  const pause = useCallback(() => {
    if (!isSupported) return;
    tts.pause();
    setIsPaused(true);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    tts.resume();
    setIsPaused(false);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    tts.stop();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isSupported]);

  const testVoice = useCallback(
    (customLang?: string) => {
      if (!isSupported) return;
      setVoiceWarning(null);
      setIsSpeaking(true);
      setIsPaused(false);
      tts.testVoice(
        customLang || language,
        () => {
          setIsSpeaking(false);
          setIsPaused(false);
        },
        (msg) => {
          setVoiceWarning(msg);
        }
      );
    },
    [isSupported, language]
  );

  return {
    isSupported,
    isSpeaking,
    isPaused,
    voiceWarning,
    speak,
    pause,
    resume,
    stop,
    testVoice,
  };
};

export type SpeechRecognitionErrorCode =
  | "unsupported"
  | "permission-denied"
  | "no-speech"
  | "audio-capture"
  | "network"
  | "unknown";

export type MicPermissionState = "prompt" | "granted" | "denied" | "unknown";

export const useSpeechRecognition = (
  onResult: (transcript: string, isFinal?: boolean) => void,
  initialLanguage?: string
) => {
  const { language: defaultAppLang } = useLanguage();
  const [activeLang, setActiveLang] = useState<string>(() => initialLanguage || defaultAppLang);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<SpeechRecognitionErrorCode | null>(null);
  const [micPermissionState, setMicPermissionState] = useState<MicPermissionState>("unknown");
  const isSupported = isSpeechRecognitionSupported();

  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const gotResultRef = useRef(false);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (initialLanguage) {
      setActiveLang(initialLanguage);
    }
  }, [initialLanguage]);

  // Query microphone permission state if browser supports it
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((status) => {
          setMicPermissionState(status.state as MicPermissionState);
          status.onchange = () => {
            setMicPermissionState(status.state as MicPermissionState);
          };
        })
        .catch(() => {
          // Some browsers restrict querying microphone permission
        });
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setIsProcessing(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  const startListening = useCallback(
    (customLang?: string) => {
      setError(null);
      setErrorCode(null);

      if (!isSupported) {
        setErrorCode("unsupported");
        setError(
          "Voice input is not supported in this browser. Please type your question."
        );
        return;
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }

      const langToUse = customLang || activeLang || defaultAppLang;
      if (customLang) {
        setActiveLang(customLang);
      }

      try {
        const win = window as unknown as {
          SpeechRecognition?: new () => any;
          webkitSpeechRecognition?: new () => any;
        };
        const SpeechRecognition =
          win.SpeechRecognition || win.webkitSpeechRecognition;

        if (!SpeechRecognition) {
          setErrorCode("unsupported");
          setError(
            "Voice input is not supported in this browser. Please type your question."
          );
          return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        gotResultRef.current = false;

        recognition.lang = getSpeechLocale(langToUse);
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setIsProcessing(false);
          setError(null);
          setErrorCode(null);
          setMicPermissionState("granted");
        };

        recognition.onaudioend = () => {
          setIsProcessing(true);
        };

        recognition.onresult = (event: any) => {
          let interim = "";
          let final = "";

          for (let i = event.resultIndex || 0; i < event.results.length; i++) {
            const res = event.results[i];
            const text = res?.[0]?.transcript || "";
            if (res.isFinal) {
              final += text;
            } else {
              interim += text;
            }
          }

          setInterimTranscript(interim);
          const combined = (final || interim).trim();
          if (combined) {
            setTranscript(combined);
            gotResultRef.current = true;
            onResultRef.current(combined, Boolean(final));
          }
        };

        recognition.onerror = (event: any) => {
          setIsListening(false);
          setIsProcessing(false);
          const rawErr = String(event?.error || "").toLowerCase();

          if (rawErr === "aborted") {
            return;
          }
          if (rawErr === "not-allowed" || rawErr === "service-not-allowed") {
            setMicPermissionState("denied");
            setErrorCode("permission-denied");
            setError(
              "Microphone permission denied. Please allow microphone access in your browser settings to speak."
            );
            return;
          }
          if (rawErr === "no-speech") {
            setErrorCode("no-speech");
            setError("No speech was detected. Please tap the microphone and speak again.");
            return;
          }
          if (rawErr === "audio-capture") {
            setErrorCode("audio-capture");
            setError("No microphone was detected on this device. Please check your audio input.");
            return;
          }
          if (rawErr === "network") {
            setErrorCode("network");
            setError("Voice recognition encountered a network issue. Please check your connection or type.");
            return;
          }

          setErrorCode("unknown");
          setError("Could not understand speech. Please speak clearly and try again.");
        };

        recognition.onend = () => {
          setIsListening(false);
          setIsProcessing(false);
          recognitionRef.current = null;
        };

        recognition.start();
      } catch {
        setIsListening(false);
        setIsProcessing(false);
        setErrorCode("unknown");
        setError("Voice input is not supported in this browser. Please type your question.");
      }
    },
    [isSupported, activeLang, defaultAppLang]
  );

  const toggleListening = useCallback(
    (customLang?: string) => {
      if (isListening) {
        stopListening();
      } else {
        startListening(customLang);
      }
    },
    [isListening, startListening, stopListening]
  );

  return {
    isSupported,
    isListening,
    isProcessing,
    transcript,
    interimTranscript,
    error,
    errorCode,
    micPermissionState,
    activeLang,
    setActiveLang,
    clearError,
    clearTranscript,
    startListening,
    stopListening,
    toggleListening,
    locale: getSpeechLocale(activeLang),
  };
};

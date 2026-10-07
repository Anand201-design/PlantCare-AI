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

export const useSpeechRecognition = (
  onResult: (transcript: string, isFinal?: boolean) => void
) => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<SpeechRecognitionErrorCode | null>(null);
  const isSupported = isSpeechRecognitionSupported();

  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const gotResultRef = useRef(false);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

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

  // Stop active recognition if user switches app language or unmounts page
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
  }, [language]);

  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  const startListening = useCallback(() => {
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

      recognition.lang = getSpeechLocale(language);
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setIsProcessing(false);
        setError(null);
        setErrorCode(null);
      };

      recognition.onaudioend = () => {
        setIsProcessing(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex || 0; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res?.[0]?.transcript || "";
          if (res.isFinal) {
            finalTranscript += text;
          } else {
            interimTranscript += text;
          }
        }

        const combined = (finalTranscript || interimTranscript).trim();
        if (combined) {
          gotResultRef.current = true;
          onResultRef.current(combined, Boolean(finalTranscript));
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
          setErrorCode("permission-denied");
          setError(
            "Microphone permission denied. Please allow microphone access or type your question."
          );
          return;
        }
        if (rawErr === "no-speech") {
          setErrorCode("no-speech");
          setError("Could not understand speech. Please speak clearly and try again.");
          return;
        }
        if (rawErr === "audio-capture") {
          setErrorCode("audio-capture");
          setError("No microphone was detected. Please check your device or type your question.");
          return;
        }
        if (rawErr === "network") {
          setErrorCode("network");
          setError("Voice recognition encountered a network issue. Please try again or type your question.");
          return;
        }

        setErrorCode("unknown");
        setError("Could not understand speech. Please try again or type your question.");
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
  }, [isSupported, language]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isSupported,
    isListening,
    isProcessing,
    error,
    errorCode,
    clearError,
    startListening,
    stopListening,
    toggleListening,
    locale: getSpeechLocale(language),
  };
};

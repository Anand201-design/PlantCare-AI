import React from "react";
import { Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "../hooks/useSpeech";
import { useLanguage } from "../context/LanguageContext";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  className = "",
}) => {
  const { isSupported, isListening, toggleListening } =
    useSpeechRecognition(onTranscript);
  const { language } = useLanguage();

  if (!isSupported) return null;

  const titleText =
    language === "ta"
      ? isListening
        ? "குரல் உள்ளீட்டை நிறுத்து"
        : "பேசவும்"
      : isListening
        ? "Stop voice input"
        : "Speak to enter text";

  return (
    <button
      type="button"
      onClick={() => toggleListening()}
      title={titleText}
      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
        isListening
          ? "bg-[#176B4D] text-white animate-pulse"
          : "text-[#668074] dark:text-[#B0C9BA] hover:text-[#176B4D] hover:bg-[#E4F0E7] dark:hover:bg-[#1D3B2D]"
      } ${className}`}
    >
      {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
    </button>
  );
};

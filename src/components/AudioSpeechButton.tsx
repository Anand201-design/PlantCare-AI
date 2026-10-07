import React from "react";
import { Volume2, Pause, Play, Square } from "lucide-react";
import { useTextToSpeech } from "../hooks/useSpeech";
import { useLanguage } from "../context/LanguageContext";

interface AudioSpeechButtonProps {
  text: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export const AudioSpeechButton: React.FC<AudioSpeechButtonProps> = ({
  text,
  label = "Listen",
  size = "sm",
  className = "",
}) => {
  const { isSupported, isSpeaking, isPaused, speak, pause, resume, stop } =
    useTextToSpeech();
  const { t, tr } = useLanguage();

  if (!isSupported || !text) return null;

  const paddingClass = size === "md" ? "px-3.5 py-2 text-xs" : "px-3 py-1.5 text-xs";
  const displayLabel = label === "Listen" ? t.listen : tr(label);

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {!isSpeaking ? (
        <button
          type="button"
          onClick={() => speak(text)}
          className={`inline-flex items-center gap-1.5 ${paddingClass} font-semibold rounded-xl bg-white dark:bg-[#173126] text-[#163A2D] dark:text-[#F1F7F3] border border-[#DCE7DF] dark:border-[#244737] hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D] transition-all cursor-pointer shadow-2xs whitespace-nowrap`}
          title={t.listen}
        >
          <Volume2 className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B] shrink-0" />
          <span>{displayLabel}</span>
        </button>
      ) : (
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737]">
          <button
            type="button"
            onClick={isPaused ? resume : pause}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#176B4D] text-white cursor-pointer whitespace-nowrap"
          >
            {isPaused ? (
              <>
                <Play className="w-3 h-3 shrink-0" />
                <span>{t.resume}</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 shrink-0" />
                <span>{t.pause}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg text-[#163A2D] dark:text-[#F1F7F3] hover:bg-white/60 cursor-pointer"
            title={t.stop}
          >
            <Square className="w-3 h-3 shrink-0" />
          </button>
        </div>
      )}
    </div>
  );
};

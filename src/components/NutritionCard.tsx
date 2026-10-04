import React from "react";
import { useLanguage } from "../context/LanguageContext";

interface NutritionCardProps {
  possibleDeficiency: string;
  details?: string;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({
  possibleDeficiency,
  details,
}) => {
  const { t } = useLanguage();
  const hasDeficiency =
    possibleDeficiency &&
    possibleDeficiency.toLowerCase() !== "none" &&
    possibleDeficiency.toLowerCase() !== "none detected";

  return (
    <section className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-6 space-y-4 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
      <div className="flex items-baseline justify-between gap-4 pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
        <div>
          <p className="text-xs text-[#668074] dark:text-[#B0C9BA] font-medium">{t.nutrition}</p>
          <h3 className="font-display text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3] mt-1">
            {possibleDeficiency || "Balanced Nutrition"}
          </h3>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            hasDeficiency
              ? "bg-[#FDF5EB] text-[#C98A4A] border-[#C98A4A]/30"
              : "bg-[#E8F5EE] text-[#2D8A62] border-[#DCE7DF]"
          }`}
        >
          {hasDeficiency ? "Needs Attention" : "Optimal"}
        </span>
      </div>

      {details && (
        <p className="text-xs text-[#668074] dark:text-[#B0C9BA] leading-relaxed">{details}</p>
      )}
    </section>
  );
};

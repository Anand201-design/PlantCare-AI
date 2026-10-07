import React from "react";
import { useLanguage } from "../context/LanguageContext";

interface RecommendationCardProps {
  treatmentRecs: string[];
  preventionRecs: string[];
  disclaimer?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  treatmentRecs,
  preventionRecs,
  disclaimer,
}) => {
  const { t, tr } = useLanguage();

  return (
    <section className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-6 space-y-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
      <div className="pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
        <h3 className="font-display text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3]">
          {t.recommendations}
        </h3>
        <p className="text-xs text-[#668074] dark:text-[#B0C9BA] mt-0.5">
          {tr("Actionable care steps and preventive botanical practices")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#176B4D] dark:text-[#8EAD9B]">
            {t.treatment}
          </h4>
          <ul className="space-y-2.5 text-xs text-[#163A2D] dark:text-[#F1F7F3]">
            {treatmentRecs && treatmentRecs.length > 0 ? (
              treatmentRecs.map((rec, i) => (
                <li
                  key={i}
                  className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-[#176B4D] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{tr(rec)}</span>
                </li>
              ))
            ) : (
              <li className="text-[#668074]">
                {tr("Continue standard watering and light care.")}
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#176B4D] dark:text-[#8EAD9B]">
            {t.prevention}
          </h4>
          <ul className="space-y-2.5 text-xs text-[#163A2D] dark:text-[#F1F7F3]">
            {preventionRecs && preventionRecs.length > 0 ? (
              preventionRecs.map((rec, i) => (
                <li
                  key={i}
                  className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{tr(rec)}</span>
                </li>
              ))
            ) : (
              <li className="text-[#668074]">
                {tr("Maintain good air circulation around foliage.")}
              </li>
            )}
          </ul>
        </div>
      </div>

      {disclaimer && (
        <div className="pt-3 border-t border-[#DCE7DF] dark:border-[#244737] text-[11px] text-[#668074] dark:text-[#B0C9BA]">
          {tr(disclaimer)}
        </div>
      )}
    </section>
  );
};

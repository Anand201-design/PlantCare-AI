import React from "react";
import { useLanguage } from "../context/LanguageContext";

interface DiseaseCardProps {
  diseaseName: string;
  scientificName?: string;
  confidenceScore: number;
  severity: string;
  symptoms: string[];
}

export const DiseaseCard: React.FC<DiseaseCardProps> = ({
  diseaseName,
  scientificName,
  confidenceScore,
  severity,
  symptoms,
}) => {
  const { t } = useLanguage();
  const isHealthy = diseaseName.toLowerCase() === "healthy";
  const pct = Math.round(confidenceScore * 100);

  const severityColor = isHealthy
    ? "text-[#2D8A62] bg-[#E8F5EE] border-[#DCE7DF]"
    : severity === "severe"
      ? "text-[#C96F62] bg-[#FBECE9] border-[#C96F62]/30"
      : "text-[#C98A4A] bg-[#FDF5EB] border-[#C98A4A]/30";

  return (
    <section className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-6 space-y-5 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
      <div className="flex items-baseline justify-between gap-4 pb-4 border-b border-[#DCE7DF] dark:border-[#244737]">
        <div>
          <p className="text-xs text-[#668074] dark:text-[#B0C9BA] font-medium">{t.disease}</p>
          <h3 className="font-display text-xl font-bold text-[#163A2D] dark:text-[#F1F7F3] mt-1">
            {diseaseName}
          </h3>
          {scientificName && (
            <p className="text-xs italic text-[#668074] dark:text-[#B0C9BA] mt-0.5">
              {scientificName}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs text-[#668074] dark:text-[#B0C9BA] block font-medium">
            {t.confidence}
          </span>
          <span className="tabular-nums text-xl font-bold text-[#163A2D] dark:text-[#F1F7F3]">
            {pct}%
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#668074] dark:text-[#B0C9BA] font-medium">Severity:</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${severityColor}`}
          >
            {severity}
          </span>
        </div>
      </div>

      {diseaseName === "Uncertain" && (
        <div className="p-3.5 rounded-2xl bg-[#FDF5EB] border border-[#C98A4A]/30 text-xs text-[#C98A4A]">
          Confidence was below threshold. Marked as Uncertain to prevent inaccurate diagnosis.
        </div>
      )}

      {symptoms && symptoms.length > 0 && (
        <div className="pt-3 border-t border-[#DCE7DF] dark:border-[#244737] space-y-2">
          <h4 className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3]">
            Observed Symptoms
          </h4>
          <ul className="space-y-1.5 text-xs text-[#668074] dark:text-[#B0C9BA]">
            {symptoms.map((s, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#176B4D]" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

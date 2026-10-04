import React from "react";
import { useLanguage } from "../context/LanguageContext";

interface HealthScoreProps {
  overallStatus: string;
  healthScore: number;
  confidenceScore: number;
  symptoms: string[];
}

export const HealthScore: React.FC<HealthScoreProps> = ({
  overallStatus,
  healthScore,
  confidenceScore,
  symptoms,
}) => {
  const { t } = useLanguage();

  const statusColor =
    healthScore >= 85
      ? "text-[#2D8A62]"
      : healthScore >= 70
        ? "text-[#C98A4A]"
        : "text-[#C96F62]";

  const barColor =
    healthScore >= 85
      ? "bg-[#2D8A62]"
      : healthScore >= 70
        ? "bg-[#C98A4A]"
        : "bg-[#C96F62]";

  return (
    <section className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-6 space-y-5 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#DCE7DF] dark:border-[#244737]">
        <div>
          <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
            {t.healthScore} · {t.confidence}{" "}
            <span className="font-semibold text-[#163A2D] dark:text-[#F1F7F3] tabular-nums">
              {Math.round(confidenceScore * 100)}%
            </span>
          </p>
          <h3 className="font-display text-xl font-bold text-[#163A2D] dark:text-[#F1F7F3] mt-1">
            Estimated Plant Health:{" "}
            <span className="tabular-nums text-[#176B4D] dark:text-[#8EAD9B]">{healthScore}%</span>
          </h3>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-[#668074] dark:text-[#B0C9BA] block">Overall Status</span>
          <span className={`text-base font-bold ${statusColor}`}>{overallStatus}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="w-full h-2.5 bg-[#E4F0E7] dark:bg-[#1D3B2D] rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(100, Math.max(5, healthScore))}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[#668074] dark:text-[#B0C9BA]">
          <span>0% (Needs Care)</span>
          <span>50% (Moderate)</span>
          <span>100% (Healthy)</span>
        </div>
      </div>

      {symptoms && symptoms.length > 0 && (
        <div className="pt-4 border-t border-[#DCE7DF] dark:border-[#244737] space-y-2">
          <h4 className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3]">
            Observed Health Indicators
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

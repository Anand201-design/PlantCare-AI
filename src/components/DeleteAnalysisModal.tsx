import React from "react";
import { Trash2, X, Loader2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { DiagnosticResult } from "../services/plantService";
import {
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";

interface DeleteAnalysisModalProps {
  analysis: DiagnosticResult | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteAnalysisModal: React.FC<DeleteAnalysisModalProps> = ({
  analysis,
  isDeleting,
  onCancel,
  onConfirm,
}) => {
  const { tr, localizePlantName, localizeDiseaseName } = useLanguage();

  if (!analysis) return null;

  const localizedPlant = localizePlantName(analysis.plant_name);
  const localizedDisease = localizeDiseaseName(analysis.disease_name);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#163A2D]/55 dark:bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={() => {
        if (!isDeleting) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-analysis-modal-title"
    >
      <div
        className="bg-white dark:bg-[#173126] rounded-[24px] max-w-md w-full p-6 space-y-5 shadow-xl border border-[#DCE7DF] dark:border-[#244737]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F8E9E5] dark:bg-[#2A1612] border border-[#C96F62]/30 text-[#C96F62] flex items-center justify-center shrink-0">
              <Trash2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3
                id="delete-analysis-modal-title"
                className="font-display text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3]"
              >
                {tr("Delete Analysis?")}
              </h3>
            </div>
          </div>

          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="p-1.5 rounded-lg text-[#668074] dark:text-[#B0C9BA] hover:text-[#163A2D] dark:hover:text-[#F1F7F3] hover:bg-[#F6F9F5] dark:hover:bg-[#12281E] transition-colors cursor-pointer disabled:opacity-50"
            aria-label={tr("Cancel")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#668074] dark:text-[#B0C9BA] leading-relaxed">
          {tr(
            "This analysis will be removed from your analysis history. This action cannot be undone."
          )}
        </p>

        {/* Compact preview of the selected analysis */}
        <div className="p-3 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center gap-3">
          <img
            src={resolveRealisticPlantImage(
              analysis.image_path,
              analysis.plant_name,
              analysis.scientific_name,
              analysis.disease_name
            )}
            alt={analysis.plant_name}
            referrerPolicy="no-referrer"
            onError={(e) =>
              handlePlantImageError(e, analysis.plant_name, analysis.scientific_name)
            }
            className="w-11 h-11 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3] truncate">
              {localizedPlant}
            </p>
            <p className="text-[11px] text-[#668074] dark:text-[#B0C9BA] truncate">
              {localizedDisease} · {analysis.health_score}%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] bg-[#F6F9F5] dark:bg-[#12281E] hover:bg-[#E4F0E7] dark:hover:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] transition-colors cursor-pointer disabled:opacity-50"
          >
            {tr("Cancel")}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#C96F62] hover:bg-[#B55B4E] transition-colors cursor-pointer disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{tr("Deleting...")}</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{tr("Delete")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

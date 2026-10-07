import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Calendar,
  ArrowRight,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Sprout,
  Stethoscope,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { plantService, DiagnosticResult } from "../services/plantService";
import {
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";
import { useLanguage } from "../context/LanguageContext";
import { DeleteAnalysisModal } from "../components/DeleteAnalysisModal";

type TypeFilter = "all" | "healthy" | "disease";

export const History: React.FC = () => {
  const navigate = useNavigate();
  const { language, tr, localizeDiagnosticResult } = useLanguage();
  const [records, setRecords] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const [analysisToDelete, setAnalysisToDelete] = useState<DiagnosticResult | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    plantService
      .getAnalysisHistory()
      .then((data) => setRecords(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  const handleConfirmDelete = async () => {
    if (!analysisToDelete) return;
    setIsDeleting(true);
    try {
      await plantService.deleteAnalysis(analysisToDelete.id);
      setRecords((prev) => prev.filter((item) => item.id !== analysisToDelete.id));
      setAnalysisToDelete(null);
      showFeedback("success", tr("Analysis deleted successfully."));
    } catch {
      setAnalysisToDelete(null);
      showFeedback(
        "error",
        tr("Unable to delete this analysis. Please try again.")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const locRec = localizeDiagnosticResult(rec);
      const matchesSearch =
        !searchQuery.trim() ||
        rec.plant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        locRec.plant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.scientific_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.disease_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        locRec.disease_name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      const isHealthy =
        rec.disease_name === "Healthy" || rec.overall_status === "Healthy";
      if (typeFilter === "healthy") return isHealthy;
      if (typeFilter === "disease") return !isHealthy;
      return true;
    });
  }, [records, searchQuery, typeFilter, localizeDiagnosticResult]);

  const dateLocale =
    language === "ta"
      ? "ta-IN"
      : language === "hi"
        ? "hi-IN"
        : language === "es"
          ? "es-ES"
          : language === "fr"
            ? "fr-FR"
            : language === "de"
              ? "de-DE"
              : language === "zh"
                ? "zh-CN"
                : "en-US";

  return (
    <div className="space-y-8 pb-16 font-sans max-w-[1320px] mx-auto">
      {/* Toast Feedback */}
      {feedback && (
        <div
          role="status"
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 border ${
            feedback.type === "success"
              ? "bg-[#176B4D] text-white border-[#12563D]"
              : "bg-white dark:bg-[#173126] text-[#C96F62] border-[#C96F62]/40"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE7DF] dark:border-[#244737] pb-6">
        <div>
          <nav className="flex items-center gap-2 text-xs text-[#668074] dark:text-[#B0C9BA] mb-2">
            <Link to="/dashboard" className="hover:text-[#176B4D] transition-colors">
              {tr("Dashboard")}
            </Link>
            <span>/</span>
            <span className="text-[#163A2D] dark:text-[#F1F7F3] font-semibold">
              {tr("Analysis History")}
            </span>
          </nav>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#163A2D] dark:text-[#F1F7F3] tracking-tight">
            {tr("Analysis History")}
          </h1>
          <p className="text-sm text-[#668074] dark:text-[#B0C9BA] mt-1">
            {tr(
              "Complete archive of plant identifications, leaf disease diagnoses, and health reports."
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate("/analyze?mode=identify")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer"
          >
            <Sprout className="w-4 h-4" />
            <span>{tr("Identify Plant")}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/analyze?mode=disease")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#12563D] cursor-pointer"
          >
            <Stethoscope className="w-4 h-4" />
            <span>{tr("Detect Disease")}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#668074] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr("Search history by plant or condition...")}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3] placeholder:text-[#668074]/70 focus:outline-none focus:border-[#176B4D]"
          />
        </div>

        <div className="inline-flex flex-wrap items-center p-1 rounded-xl bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] gap-1 self-start">
          {(
            [
              { id: "all", label: `${tr("All Scans")} (${records.length})` },
              { id: "healthy", label: tr("Healthy Specimens") },
              { id: "disease", label: tr("Disease / Stress Detected") },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === tab.id
                  ? "bg-[#176B4D] text-white"
                  : "text-[#668074] dark:text-[#B0C9BA] hover:text-[#163A2D] dark:hover:text-[#F1F7F3]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-24 rounded-2xl bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] animate-pulse"
            />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-[24px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center mx-auto">
            <ScanLine className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3]">
              {tr("No analysis history yet")}
            </h3>
            <p className="text-xs sm:text-sm text-[#668074] dark:text-[#B0C9BA]">
              {tr("Upload a plant image to start your first analysis.")}
            </p>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => navigate("/analyze?mode=identify")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#12563D] transition-colors cursor-pointer"
            >
              <Sprout className="w-4 h-4" />
              <span>{tr("Identify Plant")}</span>
            </button>
          </div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-[24px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-12 text-center space-y-3">
          <ScanLine className="w-10 h-10 text-[#176B4D] mx-auto" />
          <h3 className="font-display text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3]">
            {tr("No analysis records found")}
          </h3>
          <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
            {tr("Upload a plant photo to generate your first diagnostic report.")}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredRecords.map((rawRec) => {
            const rec = localizeDiagnosticResult(rawRec);
            const isHealthy =
              rawRec.disease_name === "Healthy" || rawRec.overall_status === "Healthy";
            const analysisTypeLabel = isHealthy
              ? tr("Plant Identification")
              : tr("Disease Detection");
            const formattedDateTime = rawRec.created_at
              ? new Date(rawRec.created_at).toLocaleString(dateLocale, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : tr("Recent scan");

            return (
              <div
                key={rec.id}
                onClick={() =>
                  navigate(`/results/${rec.id}`, { state: { result: rawRec } })
                }
                className="p-4 sm:p-5 rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] hover:border-[#8EAD9B] flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer transition-all shadow-[0_2px_8px_rgba(22,58,45,0.03)]"
              >
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <img
                    src={resolveRealisticPlantImage(
                      rawRec.image_path,
                      rawRec.plant_name,
                      rawRec.scientific_name,
                      rawRec.disease_name
                    )}
                    alt={`${rawRec.plant_name} — ${rawRec.disease_name}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) =>
                      handlePlantImageError(
                        e,
                        rawRec.plant_name,
                        rawRec.scientific_name
                      )
                    }
                    className="w-16 h-16 rounded-2xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0"
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3] truncate">
                        {rec.plant_name}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F6F9F5] dark:bg-[#12281E] text-[#176B4D] dark:text-[#8EAD9B] border border-[#DCE7DF] dark:border-[#244737]">
                        {isHealthy ? (
                          <Sprout className="w-3 h-3" />
                        ) : (
                          <Stethoscope className="w-3 h-3" />
                        )}
                        <span>{analysisTypeLabel}</span>
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isHealthy
                            ? "bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B]"
                            : "bg-[#F8E9E5] dark:bg-[#2A1612] text-[#C96F62]"
                        }`}
                      >
                        {isHealthy ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        <span>{rec.disease_name}</span>
                      </span>
                    </div>
                    <p className="text-xs italic text-[#668074] dark:text-[#B0C9BA] truncate">
                      {rawRec.scientific_name || "Botanical specimen"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-[#668074] dark:text-[#B0C9BA]">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formattedDateTime}
                      </span>
                      <span>·</span>
                      <span>
                        {tr("Confidence")}:{" "}
                        {Math.round((rawRec.confidence_score || 0.95) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#DCE7DF] dark:border-[#244737] shrink-0">
                  <div className="text-left lg:text-right mr-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#668074] dark:text-[#B0C9BA] block">
                      {tr("Health Score")}
                    </span>
                    <span
                      className={`font-display text-lg font-extrabold ${
                        rec.health_score >= 85
                          ? "text-[#176B4D] dark:text-[#8EAD9B]"
                          : "text-[#C96F62]"
                      }`}
                    >
                      {rec.health_score}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/results/${rec.id}`, {
                          state: { result: rawRec },
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] bg-[#F6F9F5] dark:bg-[#12281E] hover:bg-[#E4F0E7] dark:hover:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] transition-colors cursor-pointer"
                    >
                      <span>{tr("View Details")}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="h-5 w-px bg-[#DCE7DF] dark:bg-[#244737]" />

                    <button
                      type="button"
                      title={tr("Delete analysis")}
                      aria-label={tr("Delete analysis")}
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnalysisToDelete(rawRec);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-[#668074] dark:text-[#B0C9BA] hover:text-[#C96F62] dark:hover:text-[#E08A7E] bg-transparent hover:bg-[#F8E9E5]/60 dark:hover:bg-[#2A1612]/60 border border-transparent hover:border-[#C96F62]/25 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tr("Delete")}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <DeleteAnalysisModal
        analysis={analysisToDelete}
        isDeleting={isDeleting}
        onCancel={() => setAnalysisToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

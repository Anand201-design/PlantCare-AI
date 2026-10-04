import React, { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Search, ArrowUpRight, ScanLine, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { plantService, DiagnosticResult } from "../services/plantService";
import { VoiceInputButton } from "../components/VoiceInputButton";
import { AudioSpeechButton } from "../components/AudioSpeechButton";
import {
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";

export const History: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPlantFilter = searchParams.get("plant") || "";

  const [history, setHistory] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initialPlantFilter);
  const [filter, setFilter] = useState<"all" | "healthy" | "stressed">("all");

  useEffect(() => {
    setLoading(true);
    plantService
      .getAnalysisHistory()
      .then((res) => setHistory(res))
      .finally(() => setLoading(false));
  }, []);

  const filtered = history.filter((item) => {
    const matchesSearch =
      !query.trim() ||
      item.plant_name.toLowerCase().includes(query.toLowerCase()) ||
      item.disease_name.toLowerCase().includes(query.toLowerCase()) ||
      (item.possible_nutrient_deficiency || "").toLowerCase().includes(query.toLowerCase());

    const isHealthy = item.overall_status?.toLowerCase() === "healthy";
    const matchesFilter =
      filter === "all" ||
      (filter === "healthy" && isHealthy) ||
      (filter === "stressed" && !isHealthy);

    return matchesSearch && matchesFilter;
  });

  const historyNarration = `Analysis History: ${history.length} saved plant reports. Filter reports by healthy or attention needed, or search by plant name.`;

  return (
    <div className="space-y-7 pb-16 max-w-[1240px] mx-auto font-sans antialiased text-[#163A2D] dark:text-[#F1F7F3]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-[#668074] dark:text-[#B0C9BA]"
          >
            <Link
              to="/dashboard"
              className="hover:text-[#176B4D] dark:hover:text-[#8EAD9B] transition-colors"
            >
              PlantCare AI
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
              Analysis History
            </span>
          </nav>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#163A2D] dark:text-[#F1F7F3] tracking-tight">
              Analysis History
            </h1>
            <p className="text-sm text-[#668074] dark:text-[#B0C9BA] mt-1">
              Review your past plant identifications, disease checks, and care recommendations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <AudioSpeechButton text={historyNarration} label="Listen" size="sm" />
          <Link
            to="/analyze?mode=disease"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#12563D] rounded-xl transition-all shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>New Analysis</span>
          </Link>
        </div>
      </div>

      {/* Search and Segmented Filter Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#668074] dark:text-[#B0C9BA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search plant name, condition, or symptom..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2 text-xs bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl text-[#163A2D] dark:text-[#F1F7F3] focus:outline-none focus:border-[#176B4D]"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <VoiceInputButton onTranscript={(spoken) => setQuery(spoken)} />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-1 text-[#668074] hover:text-[#163A2D] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#F0F6F1] dark:bg-[#12281E] rounded-xl self-start sm:self-auto border border-[#DCE7DF] dark:border-[#244737]">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === "all"
                ? "bg-white dark:bg-[#173126] text-[#163A2D] dark:text-[#F1F7F3] shadow-2xs"
                : "text-[#668074] dark:text-[#B0C9BA] hover:text-[#163A2D]"
            }`}
          >
            All ({history.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("healthy")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === "healthy"
                ? "bg-white dark:bg-[#173126] text-[#163A2D] dark:text-[#F1F7F3] shadow-2xs"
                : "text-[#668074] dark:text-[#B0C9BA] hover:text-[#163A2D]"
            }`}
          >
            Healthy
          </button>
          <button
            type="button"
            onClick={() => setFilter("stressed")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === "stressed"
                ? "bg-white dark:bg-[#173126] text-[#163A2D] dark:text-[#F1F7F3] shadow-2xs"
                : "text-[#668074] dark:text-[#B0C9BA] hover:text-[#163A2D]"
            }`}
          >
            Needs Care
          </button>
        </div>
      </div>

      {/* History Clean White Table Card */}
      <section className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] overflow-hidden shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 bg-[#F6F9F5] dark:bg-[#12281E] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
              No analysis records found
            </p>
            <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
              Upload a plant photo to generate your first identification or health report.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-[#668074] dark:text-[#B0C9BA] font-semibold">
                  <th className="py-3.5 px-6">Plant</th>
                  <th className="py-3.5 px-4">Condition / Diagnosis</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Health Score</th>
                  <th className="py-3.5 px-4 text-right">Confidence</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-6 text-right">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE7DF] dark:divide-[#244737]">
                {filtered.map((item) => {
                  const isHealthy = item.overall_status?.toLowerCase() === "healthy";
                  return (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/results/${item.id}`)}
                      className="hover:bg-[#F6F9F5] dark:hover:bg-[#1D3B2D]/40 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={resolveRealisticPlantImage(
                              item.image_path,
                              item.plant_name,
                              item.scientific_name,
                              item.disease_name
                            )}
                            alt={`${item.plant_name} (${item.scientific_name || "specimen"}) — ${item.disease_name}`}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            onError={(e) =>
                              handlePlantImageError(e, item.plant_name, item.scientific_name)
                            }
                            className="w-11 h-11 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0"
                          />
                          <div>
                            <span className="font-bold text-[#163A2D] dark:text-[#F1F7F3] block">
                              {item.plant_name}
                            </span>
                            {item.scientific_name && (
                              <span className="italic block text-[11px] text-[#668074] dark:text-[#B0C9BA]">
                                {item.scientific_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
                        {item.disease_name}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isHealthy
                              ? "bg-[#E8F5EE] dark:bg-[#1D3B2D] text-[#2D8A62] dark:text-[#8EAD9B] border-[#DCE7DF] dark:border-[#244737]"
                              : "bg-[#FBECE9] dark:bg-[#2A1612] text-[#C96F62] border-[#C96F62]/30"
                          }`}
                        >
                          {isHealthy ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          <span>{item.overall_status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-[#176B4D] dark:text-[#8EAD9B] tabular-nums">
                        {item.health_score}%
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-[#668074] dark:text-[#B0C9BA] tabular-nums">
                        {Math.round(item.confidence_score * 100)}%
                      </td>
                      <td className="py-4 px-4 text-[#668074] dark:text-[#B0C9BA]">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString()
                          : "Recent"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="inline-flex items-center gap-1 font-semibold text-[#176B4D] dark:text-[#8EAD9B] hover:underline">
                          View <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

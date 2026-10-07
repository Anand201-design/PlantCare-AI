import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Droplets,
  Sun,
  Thermometer,
  Wind,
  MapPin,
  Stethoscope,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import {
  plantService,
  PlantProfileItem,
  DiagnosticResult,
} from "../services/plantService";
import {
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";
import { useLanguage } from "../context/LanguageContext";
import { AudioSpeechButton } from "../components/AudioSpeechButton";

export const PlantProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, tr, localizePlantName, localizeDiseaseName, localizeDiagnosticResult } =
    useLanguage();
  const [plant, setPlant] = useState<PlantProfileItem | null>(null);
  const [history, setHistory] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([plantService.getPlantById(id), plantService.getAnalysisHistory()])
      .then(([foundPlant, allHistory]) => {
        setPlant(foundPlant);
        if (foundPlant) {
          const matching = allHistory.filter(
            (h) =>
              h.plant_name.toLowerCase().includes(foundPlant.plantName.toLowerCase()) ||
              foundPlant.plantName.toLowerCase().includes(h.plant_name.toLowerCase())
          );
          setHistory(matching);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    navigate("/plants");
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto py-12 space-y-6">
        <div className="h-80 rounded-[24px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] animate-pulse" />
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-[24px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] text-center space-y-4">
        <h2 className="font-display text-xl font-bold text-[#163A2D] dark:text-[#F1F7F3]">
          {tr("Plant not found")}
        </h2>
        <button
          type="button"
          onClick={() => navigate("/plants")}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#176B4D] cursor-pointer"
        >
          {tr("Back to My Plants")}
        </button>
      </div>
    );
  }

  const isHealthy =
    plant.latestStatus === "Healthy" || (plant.latestHealthScore || 90) >= 85;
  const localizedName = localizePlantName(plant.plantName);
  const localizedCondition = localizeDiseaseName(plant.latestDisease || "Healthy");
  const careNotesText = tr(
    plant.notes ||
      "Monitor leaf margins and new growth weekly. Water when the top 3–5 cm of soil feels dry to the touch. Keep away from cold drafts and sudden temperature swings."
  );

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
    <div className="space-y-7 pb-16 font-sans max-w-[1280px] mx-auto">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/plants")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{tr("My Plants")}</span>
          </button>
          <div className="text-xs text-[#668074] dark:text-[#B0C9BA]">
            <Link to="/dashboard" className="hover:text-[#176B4D]">
              {tr("Dashboard")}
            </Link>{" "}
            /{" "}
            <Link to="/plants" className="hover:text-[#176B4D]">
              {tr("My Plants")}
            </Link>{" "}
            /{" "}
            <span className="text-[#163A2D] dark:text-[#F1F7F3] font-semibold">
              {localizedName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <AudioSpeechButton
            text={`${localizedName} (${plant.scientificName || ""}). ${tr("Health Score")}: ${plant.latestHealthScore || 92}%. ${tr("Condition")}: ${localizedCondition}. ${careNotesText}`}
          />
          <button
            type="button"
            onClick={() => navigate(`/analyze?mode=disease&plantId=${plant.id}`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#12563D] cursor-pointer"
          >
            <Stethoscope className="w-4 h-4" />
            <span>{tr("Run Health Scan")}</span>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#C96F62] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] hover:border-[#C96F62] cursor-pointer"
            title={tr("Delete Plant")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 rounded-[24px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-5 shadow-[0_2px_10px_rgba(22,58,45,0.04)] flex flex-col justify-between space-y-4">
          <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737]">
            <img
              src={resolveRealisticPlantImage(
                plant.imageUrl,
                plant.plantName,
                plant.scientificName,
                plant.latestDisease
              )}
              alt={`${plant.plantName} (${plant.scientificName || "Botanical specimen"})`}
              referrerPolicy="no-referrer"
              onError={(e) =>
                handlePlantImageError(e, plant.plantName, plant.scientificName)
              }
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs border ${
                  isHealthy
                    ? "bg-white/95 dark:bg-[#173126]/95 text-[#176B4D] dark:text-[#8EAD9B] border-[#DCE7DF]"
                    : "bg-[#F8E9E5]/95 text-[#C96F62] border-[#C96F62]/30"
                }`}
              >
                {isHealthy ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2D8A62]" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-[#C96F62]" />
                )}
                <span>{localizedCondition}</span>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl font-extrabold text-[#163A2D] dark:text-[#F1F7F3]">
                  {localizedName}
                </h1>
                <p className="text-sm italic text-[#668074] dark:text-[#B0C9BA]">
                  {plant.scientificName}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#668074] dark:text-[#B0C9BA] block">
                  {tr("Health Score")}
                </span>
                <span className="font-display text-2xl font-extrabold text-[#176B4D] dark:text-[#8EAD9B]">
                  {plant.latestHealthScore || 92}%
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[#668074] dark:text-[#B0C9BA]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
                <MapPin className="w-3.5 h-3.5 text-[#176B4D]" />
                {tr(plant.location || "Home Garden")}
              </span>
              {plant.category && (
                <span className="px-3 py-1 rounded-lg bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
                  {tr(plant.category)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Care Requirements & Notes */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-6">
          <div className="rounded-[24px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-[0_2px_10px_rgba(22,58,45,0.04)] space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                {tr("Ideal Care Conditions")}
              </h2>
              <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                {tr("Recommended environment & maintenance")} ({plant.scientificName})
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] space-y-1.5">
                <Sun className="w-4 h-4 text-[#C98A4A]" />
                <p className="text-[11px] font-semibold text-[#668074] dark:text-[#B0C9BA]">
                  {tr("Sunlight")}
                </p>
                <p className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                  {tr("Bright Indirect / Morning Sun")}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] space-y-1.5">
                <Droplets className="w-4 h-4 text-[#176B4D]" />
                <p className="text-[11px] font-semibold text-[#668074] dark:text-[#B0C9BA]">
                  {tr("Watering")}
                </p>
                <p className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                  {tr("Every 5–7 Days")}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] space-y-1.5">
                <Thermometer className="w-4 h-4 text-[#176B4D]" />
                <p className="text-[11px] font-semibold text-[#668074] dark:text-[#B0C9BA]">
                  {tr("Temperature")}
                </p>
                <p className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                  20°C – 28°C
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] space-y-1.5">
                <Wind className="w-4 h-4 text-[#176B4D]" />
                <p className="text-[11px] font-semibold text-[#668074] dark:text-[#B0C9BA]">
                  {tr("Humidity")}
                </p>
                <p className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                  55% – 70%
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F0F6F1] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
              <h3 className="text-xs font-bold text-[#176B4D] dark:text-[#8EAD9B] uppercase tracking-wider mb-1">
                {tr("Care Notes & Observations")}
              </h3>
              <p className="text-xs sm:text-sm text-[#163A2D] dark:text-[#F1F7F3] leading-relaxed">
                {careNotesText}
              </p>
            </div>
          </div>

          {/* Diagnostic History for this Plant */}
          <div className="rounded-[24px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-[0_2px_10px_rgba(22,58,45,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                {tr("Diagnostic History")}
              </h2>
              <button
                type="button"
                onClick={() => navigate(`/analyze?mode=disease&plantId=${plant.id}`)}
                className="text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] hover:underline cursor-pointer"
              >
                + {tr("New Scan for This Plant")}
              </button>
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-[#668074] dark:text-[#B0C9BA] py-4">
                {tr("No diagnostic scans recorded for this plant yet.")}
              </p>
            ) : (
              <div className="space-y-2.5">
                {history.map((rawScan) => {
                  const scan = localizeDiagnosticResult(rawScan);
                  return (
                    <div
                      key={scan.id}
                      onClick={() =>
                        navigate(`/results/${scan.id}`, { state: { result: rawScan } })
                      }
                      className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] hover:border-[#8EAD9B] flex items-center justify-between gap-3 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={resolveRealisticPlantImage(
                            rawScan.image_path,
                            rawScan.plant_name,
                            rawScan.scientific_name,
                            rawScan.disease_name
                          )}
                          alt={rawScan.plant_name}
                          referrerPolicy="no-referrer"
                          onError={(e) =>
                            handlePlantImageError(
                              e,
                              rawScan.plant_name,
                              rawScan.scientific_name
                            )
                          }
                          className="w-12 h-12 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3] truncate">
                            {scan.disease_name}
                          </p>
                          <p className="text-[11px] text-[#668074] dark:text-[#B0C9BA] flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {rawScan.created_at
                                ? new Date(rawScan.created_at).toLocaleDateString(dateLocale)
                                : tr("Recent scan")}
                            </span>
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] text-xs font-bold shrink-0">
                        {scan.health_score}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  ScanLine,
  Sprout,
  Sun,
  Droplets,
  Thermometer,
  Layers,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { plantService, DiagnosticResult } from "../services/plantService";
import { HealthScore } from "../components/HealthScore";
import { DiseaseCard } from "../components/DiseaseCard";
import { NutritionCard } from "../components/NutritionCard";
import { RecommendationCard } from "../components/RecommendationCard";
import { AudioSpeechButton } from "../components/AudioSpeechButton";
import {
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";

export const PlantResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const queryMode = searchParams.get("mode");
  const stateResult =
    (location.state as { result?: DiagnosticResult; mode?: string })?.result || null;
  const stateMode = (location.state as { result?: DiagnosticResult; mode?: string })?.mode;

  const [report, setReport] = useState<DiagnosticResult | null>(stateResult);
  const [loading, setLoading] = useState<boolean>(!stateResult);
  const [error, setError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const isIdentifyMode = queryMode === "identify" || stateMode === "identify";

  useEffect(() => {
    if (!id) return;
    if (!stateResult) setLoading(true);
    plantService
      .getAnalysisById(id)
      .then((data) => {
        setReport(data);
        setError(null);
      })
      .catch((err) => {
        if (!stateResult) setError(err.message || "Failed to load report");
      })
      .finally(() => setLoading(false));
  }, [id, stateResult]);

  const handleExportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plantcare_${report.plant_name.toLowerCase().replace(/\s+/g, "_")}_${report.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="py-12 space-y-6 max-w-5xl mx-auto">
        <div className="h-10 w-48 bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-xl animate-pulse" />
        <div className="h-72 bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] animate-pulse" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-8 text-center space-y-4 max-w-xl mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-[#C96F62] mx-auto" />
        <p className="text-sm font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
          {error || "Plant report not found."}
        </p>
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#176B4D] rounded-xl"
        >
          <ScanLine className="w-4 h-4" />
          Analyze a Plant
        </Link>
      </div>
    );
  }

  const plantName = report.plant_name || "Botanical Specimen";
  const scientificName = report.scientific_name || "Botanical cultivar";
  const family = report.family || "Angiosperms";
  const narration = `Plant health report for ${plantName}. Overall status: ${report.overall_status}. Health score: ${report.health_score} percent. Diagnosis: ${report.disease_name}.`;

  return (
    <div className="space-y-7 pb-16 max-w-5xl mx-auto font-sans antialiased text-[#163A2D] dark:text-[#F1F7F3]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#668074] dark:text-[#B0C9BA]">
            <Link
              to={isIdentifyMode ? "/analyze?mode=identify" : "/analyze?mode=disease"}
              className="inline-flex items-center gap-1 hover:text-[#176B4D] dark:hover:text-[#8EAD9B]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Analysis
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
              {isIdentifyMode ? "Species Profile" : "Diagnostic Report"}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#163A2D] dark:text-[#F1F7F3] tracking-tight">
            {isIdentifyMode ? "Botanical Species Identification" : "Plant Health & Disease Report"}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <AudioSpeechButton text={narration} label="Listen" size="md" />
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-xl cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            type="button"
            onClick={() => navigate("/analyze")}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#176B4D] rounded-xl cursor-pointer"
          >
            <ScanLine className="w-3.5 h-3.5" /> New Analysis
          </button>
        </div>
      </div>

      {/* Overview Card */}
      <section className="relative overflow-hidden bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-6 sm:p-7 shadow-[0_2px_8px_rgba(22,58,45,0.03)] space-y-6">
        <svg
          viewBox="0 0 600 360"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="pointer-events-none select-none absolute inset-0 w-full h-full opacity-85 dark:opacity-50 z-0"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="resPlantGradTop" x1="605" y1="-10" x2="455" y2="155" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#176B4D" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#2D8A62" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#176B4D" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="resPlantGradBottom" x1="-10" y1="365" x2="140" y2="250" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#176B4D" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#2D8A62" stopOpacity="0.12" />
            </linearGradient>
          </defs>
          <path
            d="M605 -10 C525 12, 465 65, 490 155 C545 130, 585 68, 605 -10 Z"
            fill="url(#resPlantGradTop)"
          />
          <path
            d="M595 -5 C545 42, 518 92, 490 155"
            stroke="#176B4D"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeOpacity="0.5"
          />
          <path
            d="M542 50 L572 42 M522 82 L558 72 M506 112 L536 105 M542 50 L526 26"
            stroke="#176B4D"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeOpacity="0.4"
          />
          <path
            d="M-10 365 C35 285, 98 255, 140 305 C85 340, 35 358, -10 365 Z"
            fill="url(#resPlantGradBottom)"
          />
        </svg>

        <div className="relative z-10 flex items-center justify-between pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
          <h2 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
            {plantName} Overview
          </h2>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F5EE] dark:bg-[#1D3B2D] text-[#2D8A62] dark:text-[#8EAD9B] border border-[#DCE7DF] dark:border-[#244737]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {Math.round(report.confidence_score * 100)}% Confidence
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-7 items-start">
          <div className="md:col-span-5">
            <div className="aspect-4/3 rounded-2xl overflow-hidden bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
              <img
                src={
                  imgFailed
                    ? resolveRealisticPlantImage(null, plantName, scientificName, report.disease_name)
                    : resolveRealisticPlantImage(
                        report.image_path,
                        plantName,
                        scientificName,
                        report.disease_name
                      )
                }
                alt={`${plantName} (${scientificName}) — ${report.disease_name}`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  setImgFailed(true);
                  handlePlantImageError(e, plantName, scientificName);
                }}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="md:col-span-7 space-y-4">
            <div className="pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
              <span className="text-xs text-[#176B4D] dark:text-[#8EAD9B] font-semibold block">
                Botanical Specimen
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#163A2D] dark:text-[#F1F7F3] mt-0.5">
                {plantName}
              </h3>
              <p className="text-sm italic text-[#668074] dark:text-[#B0C9BA] mt-0.5">
                {scientificName}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
                <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA] block">
                  Family
                </span>
                <span className="font-semibold text-sm text-[#163A2D] dark:text-[#F1F7F3] mt-0.5 block">
                  {family}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
                <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA] block">
                  Health Score
                </span>
                <span className="font-semibold text-sm text-[#2D8A62] mt-0.5 block">
                  {report.health_score}%
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
                <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA] block">
                  Condition
                </span>
                <span className="font-semibold text-sm text-[#163A2D] dark:text-[#F1F7F3] mt-0.5 block">
                  {report.disease_name}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center gap-2.5">
                <Sun className="w-4 h-4 text-[#C98A4A]" />
                <span>Bright indirect light</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center gap-2.5">
                <Droplets className="w-4 h-4 text-[#176B4D] dark:text-[#8EAD9B]" />
                <span>Moderate soil moisture</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#2D8A62]" />
                <span>Well-draining mix</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center gap-2.5">
                <Thermometer className="w-4 h-4 text-[#C96F62]" />
                <span>18°C – 27°C optimal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HealthScore
          overallStatus={report.overall_status}
          healthScore={report.health_score}
          confidenceScore={report.confidence_score}
          symptoms={report.symptoms || []}
        />
        <DiseaseCard
          diseaseName={report.disease_name}
          scientificName={report.scientific_name}
          confidenceScore={report.confidence_score}
          severity={report.severity}
          symptoms={report.symptoms || []}
        />
      </div>

      <NutritionCard
        possibleDeficiency={report.possible_nutrient_deficiency || "None detected"}
        details={report.nutrient_deficiency_details}
      />

      <RecommendationCard
        treatmentRecs={report.treatment_recommendations || []}
        preventionRecs={report.prevention_recommendations || []}
      />
    </div>
  );
};

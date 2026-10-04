import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Droplets,
  Sun,
  Sprout,
  Thermometer,
  Wind,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  RefreshCw,
  Search,
  Check,
  RotateCcw,
} from "lucide-react";
import { AudioSpeechButton } from "../components/AudioSpeechButton";
import { VoiceInputButton } from "../components/VoiceInputButton";
import {
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";

export type CareCategory =
  | "Watering"
  | "Lighting"
  | "Nutrition"
  | "Soil"
  | "Temperature"
  | "Humidity"
  | "Disease prevention"
  | "Maintenance";

export interface CareRecommendationItem {
  id: string;
  _id?: string;
  plantId: string;
  plantName: string;
  plantImage?: string;
  recommendation: string;
  category: CareCategory | string;
  priority: "high" | "medium" | "low" | string;
  explanation: string;
  recommendedAction: string;
  date: string;
  status: "active" | "completed" | "dismissed" | string;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Watering: Droplets,
  Lighting: Sun,
  Nutrition: Sprout,
  Soil: Sprout,
  Temperature: Thermometer,
  Humidity: Wind,
  "Disease prevention": ShieldAlert,
  Maintenance: Wrench,
};

const ALL_CATEGORIES: CareCategory[] = [
  "Watering",
  "Lighting",
  "Nutrition",
  "Soil",
  "Temperature",
  "Humidity",
  "Disease prevention",
  "Maintenance",
];

export const CareRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<CareRecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [selectedStatusTab, setSelectedStatusTab] = useState<
    "active" | "completed" | "dismissed" | "all"
  >("active");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/recommendations");
      if (res.ok) {
        const data = await res.json();
        setRecommendations(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleUpdateStatus = async (
    id: string,
    newStatus: "active" | "completed" | "dismissed"
  ) => {
    try {
      const res = await fetch(`/api/recommendations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setRecommendations((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        setSuccessToast(
          newStatus === "completed"
            ? "Marked as completed"
            : newStatus === "dismissed"
              ? "Recommendation dismissed"
              : "Re-activated recommendation"
        );
        setTimeout(() => setSuccessToast(null), 3000);
      }
    } catch {
      // ignore
    }
  };

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((rec) => {
      const matchesStatus =
        selectedStatusTab === "all" || rec.status?.toLowerCase() === selectedStatusTab;
      const matchesCategory =
        selectedCategory === "all" ||
        rec.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        rec.recommendation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.plantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.explanation.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [recommendations, selectedStatusTab, selectedCategory, searchQuery]);

  const activeCount = recommendations.filter((r) => r.status === "active").length;
  const completedCount = recommendations.filter((r) => r.status === "completed").length;
  const dismissedCount = recommendations.filter((r) => r.status === "dismissed").length;

  return (
    <div className="space-y-7 pb-16 max-w-[1240px] mx-auto font-sans antialiased text-[#163A2D] dark:text-[#F1F7F3]">
      {successToast && (
        <div className="fixed top-5 right-5 z-50 p-3.5 rounded-xl bg-[#176B4D] text-white text-xs font-semibold shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <nav className="flex items-center gap-1.5 text-xs text-[#668074] dark:text-[#B0C9BA]">
            <Link to="/dashboard" className="hover:text-[#176B4D] dark:hover:text-[#8EAD9B]">
              PlantCare AI
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
              Care Recommendations
            </span>
          </nav>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#163A2D] dark:text-[#F1F7F3] tracking-tight">
              Care Recommendations
            </h1>
            <p className="text-sm text-[#668074] dark:text-[#B0C9BA] mt-1">
              Personalized watering, sunlight, soil, and seasonal care plans for your plants.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <AudioSpeechButton
            text={`Care Recommendations: You have ${activeCount} active plant care tasks.`}
            label="Listen"
            size="md"
          />
          <button
            type="button"
            onClick={fetchRecommendations}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-xl cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737]">
          <div className="text-xs font-semibold text-[#668074] dark:text-[#B0C9BA]">
            Active Tasks
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-display text-[#163A2D] dark:text-[#F1F7F3] mt-1">
            {activeCount}
          </div>
        </div>

        <div className="p-5 rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737]">
          <div className="text-xs font-semibold text-[#668074] dark:text-[#B0C9BA]">
            Completed
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-display text-[#2D8A62] mt-1">
            {completedCount}
          </div>
        </div>

        <div className="p-5 rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737]">
          <div className="text-xs font-semibold text-[#668074] dark:text-[#B0C9BA]">
            Dismissed
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-display text-[#668074] dark:text-[#B0C9BA] mt-1">
            {dismissedCount}
          </div>
        </div>

        <div className="p-5 rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737]">
          <div className="text-xs font-semibold text-[#668074] dark:text-[#B0C9BA]">
            Total Care Items
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-display text-[#176B4D] dark:text-[#8EAD9B] mt-1">
            {recommendations.length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[20px] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#668074] dark:text-[#B0C9BA] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search recommendations or plant name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2 text-xs bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl text-[#163A2D] dark:text-[#F1F7F3] focus:outline-none"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <VoiceInputButton onTranscript={(spoken) => setSearchQuery(spoken)} />
            </div>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F0F6F1] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
            {(["active", "completed", "dismissed", "all"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedStatusTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  selectedStatusTab === tab
                    ? "bg-white dark:bg-[#173126] text-[#163A2D] dark:text-[#F1F7F3] shadow-2xs"
                    : "text-[#668074] dark:text-[#B0C9BA]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#DCE7DF] dark:border-[#244737]">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
              selectedCategory === "all"
                ? "bg-[#176B4D] text-white"
                : "bg-[#F6F9F5] dark:bg-[#12281E] text-[#668074] dark:text-[#B0C9BA]"
            }`}
          >
            All Categories
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#176B4D] text-white"
                  : "bg-[#F6F9F5] dark:bg-[#12281E] text-[#668074] dark:text-[#B0C9BA]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 rounded-[22px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.map((rec) => {
            const IconComp = CATEGORY_ICONS[rec.category] || Sprout;
            return (
              <div
                key={rec.id}
                className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)] space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={resolveRealisticPlantImage(rec.plantImage, rec.plantName)}
                        alt={`${rec.plantName} — ${rec.category} care`}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => handlePlantImageError(e, rec.plantName)}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-[#DCE7DF] dark:border-[#244737] shadow-2xs"
                      />
                      <div className="w-6 h-6 rounded-lg bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center absolute -bottom-1.5 -right-1.5 shadow-2xs">
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#176B4D] dark:text-[#8EAD9B]">
                          {rec.plantName}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0F6F1] dark:bg-[#1D3B2D] text-[#163A2D] dark:text-[#F1F7F3] border border-[#DCE7DF] dark:border-[#244737]">
                          {rec.category}
                        </span>
                      </div>
                      <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3] mt-1">
                        {rec.recommendation}
                      </h3>
                      <p className="text-xs text-[#668074] dark:text-[#B0C9BA] mt-1 leading-relaxed">
                        {rec.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {rec.status !== "completed" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(rec.id, "completed")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#12563D] cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Completed</span>
                      </button>
                    )}
                    {rec.status === "active" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(rec.id, "dismissed")}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-[#668074] dark:text-[#B0C9BA] bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer"
                      >
                        Dismiss
                      </button>
                    )}
                    {rec.status !== "active" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(rec.id, "active")}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] bg-[#E4F0E7] dark:bg-[#1D3B2D] cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F0F6F1] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-xs text-[#163A2D] dark:text-[#F1F7F3]">
                  <strong className="font-bold text-[#176B4D] dark:text-[#8EAD9B]">
                    Recommended Action:{" "}
                  </strong>
                  <span>{rec.recommendedAction}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

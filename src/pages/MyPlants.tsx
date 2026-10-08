import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Sprout,
  Search,
  Plus,
  ScanLine,
  MapPin,
  Droplets,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  Stethoscope,
  MessageCircle,
} from "lucide-react";
import { plantService, PlantProfileItem } from "../services/plantService";
import {
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";
import { useLanguage } from "../context/LanguageContext";

type StatusFilter = "all" | "healthy" | "attention";

export const MyPlants: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tr, localizePlantName, localizeDiseaseName } = useLanguage();
  const [plants, setPlants] = useState<PlantProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => {
    const param = searchParams.get("filter");
    return param === "attention" || param === "healthy" ? param : "all";
  });
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const param = searchParams.get("filter");
    if (param === "attention" || param === "healthy" || param === "all") {
      setStatusFilter(param);
    }
  }, [searchParams]);

  const [newPlantName, setNewPlantName] = useState("");
  const [newScientificName, setNewScientificName] = useState("");
  const [newLocation, setNewLocation] = useState("Living Room Window");
  const [newCategory, setNewCategory] = useState("Indoor Tropical");

  useEffect(() => {
    plantService
      .getPlants()
      .then((list) => setPlants(list))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredPlants = useMemo(() => {
    return plants.filter((p) => {
      const localizedName = localizePlantName(p.plantName);
      const localizedCondition = localizeDiseaseName(p.latestDisease);
      const matchesSearch =
        !searchQuery.trim() ||
        p.plantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        localizedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.scientificName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        localizedCondition.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter === "healthy") {
        return p.latestStatus === "Healthy" || (p.latestHealthScore || 90) >= 85;
      }
      if (statusFilter === "attention") {
        return (
          (p.latestStatus && p.latestStatus !== "Healthy") ||
          (p.latestHealthScore && p.latestHealthScore < 85)
        );
      }
      return true;
    });
  }, [plants, searchQuery, statusFilter, localizePlantName, localizeDiseaseName]);

  const handleAddPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlantName.trim()) return;
    try {
      const created = await plantService.createPlant({
        plantName: newPlantName.trim(),
        scientificName: newScientificName.trim() || "Botanical Specimen",
        location: newLocation.trim(),
        category: newCategory,
        latestHealthScore: 95,
        latestStatus: "Healthy",
        latestDisease: "Healthy",
      });
      setPlants((prev) => [created, ...prev]);
      setNewPlantName("");
      setNewScientificName("");
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans max-w-[1320px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE7DF] dark:border-[#244737] pb-6">
        <div>
          <nav className="flex items-center gap-2 text-xs text-[#668074] dark:text-[#B0C9BA] mb-2">
            <Link to="/dashboard" className="hover:text-[#176B4D] transition-colors">
              {tr("Dashboard")}
            </Link>
            <span>/</span>
            <span className="text-[#163A2D] dark:text-[#F1F7F3] font-semibold">
              {tr("My Plants")}
            </span>
          </nav>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#163A2D] dark:text-[#F1F7F3] tracking-tight">
            {tr("My Plant Collection")}
          </h1>
          <p className="text-sm text-[#668074] dark:text-[#B0C9BA] mt-1">
            {tr("Track vitality, watering schedules, and historical diagnostics for every plant you grow.")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/analyze?mode=identify")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] bg-[#E4F0E7] dark:bg-[#1D3B2D] hover:bg-[#DCE7DF] border border-[#DCE7DF] dark:border-[#244737] transition-all cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>{tr("Scan New Plant")}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#12563D] transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>{tr("Add Plant")}</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#668074] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr("Search by plant name, species, or location...")}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3] placeholder:text-[#668074]/70 focus:outline-none focus:border-[#176B4D]"
          />
        </div>

        <div className="inline-flex items-center p-1 rounded-xl bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] gap-1 self-start">
          {(
            [
              { id: "all", label: `${tr("All Plants")} (${plants.length})` },
              {
                id: "healthy",
                label: tr("Healthy"),
              },
              {
                id: "attention",
                label: tr("Needs Care"),
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-[#176B4D] text-white"
                  : "text-[#668074] dark:text-[#B0C9BA] hover:text-[#163A2D] dark:hover:text-[#F1F7F3]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-72 rounded-[22px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] animate-pulse p-5"
            />
          ))}
        </div>
      ) : filteredPlants.length === 0 ? (
        <div className="rounded-[24px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center mx-auto">
            <Sprout className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3]">
              {tr("No matching plants found")}
            </h3>
            <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
              {tr("Try clearing your search filter or add a new plant to your collection.")}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlants.map((plant) => {
            const isHealthy =
              plant.latestStatus === "Healthy" || (plant.latestHealthScore || 90) >= 85;
            const score = plant.latestHealthScore || 92;

            return (
              <div
                key={plant.id}
                className="group rounded-[22px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] hover:border-[#8EAD9B] overflow-hidden shadow-[0_2px_10px_rgba(22,58,45,0.04)] flex flex-col justify-between transition-all"
              >
                <div>
                  <div
                    onClick={() => navigate(`/plants/${plant.id}`)}
                    className="relative h-48 bg-[#E4F0E7] dark:bg-[#1D3B2D] overflow-hidden cursor-pointer"
                  >
                    <img
                      src={resolveRealisticPlantImage(
                        plant.imageUrl,
                        plant.plantName,
                        plant.scientificName,
                        plant.latestDisease
                      )}
                      alt={`${plant.plantName} (${plant.scientificName || "Botanical specimen"})`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) =>
                        handlePlantImageError(e, plant.plantName, plant.scientificName)
                      }
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-xs border ${
                          isHealthy
                            ? "bg-white/95 dark:bg-[#173126]/95 text-[#176B4D] dark:text-[#8EAD9B] border-[#DCE7DF] dark:border-[#244737]"
                            : "bg-[#F8E9E5]/95 dark:bg-[#2A1612]/95 text-[#C96F62] border-[#C96F62]/30"
                        }`}
                      >
                        {isHealthy ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2D8A62]" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-[#C96F62]" />
                        )}
                        <span>{localizeDiseaseName(plant.latestDisease || "Healthy")}</span>
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-[#163A2D]/85 text-white text-xs font-bold">
                      {score}%
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3
                        onClick={() => navigate(`/plants/${plant.id}`)}
                        className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3] hover:text-[#176B4D] cursor-pointer"
                      >
                        {plant.nickname
                          ? `${plant.nickname} (${localizePlantName(plant.plantName)})`
                          : localizePlantName(plant.plantName)}
                      </h3>
                      <p className="text-xs italic text-[#668074] dark:text-[#B0C9BA]">
                        {plant.scientificName || "Botanical specimen"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-[#668074] dark:text-[#B0C9BA]">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B] shrink-0" />
                        <span className="truncate">{tr(plant.location || "Home Garden")}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Droplets className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B] shrink-0" />
                        <span className="truncate">{tr("Moist soil")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-[#F6F9F5] dark:bg-[#12281E] border-t border-[#DCE7DF] dark:border-[#244737] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/plant-talk?plantId=${plant.id}`)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#E4F0E7] dark:bg-[#1D3B2D] hover:bg-[#DCE7DF] text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] border border-[#DCE7DF] dark:border-[#244737] transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>🌿 {tr("Talk to Plant")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/analyze?mode=disease&plantId=${plant.id}`)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#668074] dark:text-[#B0C9BA] hover:text-[#176B4D] dark:hover:text-[#8EAD9B] cursor-pointer"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>{tr("Diagnose")}</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/plants/${plant.id}`)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] hover:text-[#176B4D] cursor-pointer"
                  >
                    <span>{tr("Plant Profile")}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Plant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#163A2D]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#173126] rounded-[24px] max-w-md w-full p-6 space-y-5 shadow-xl border border-[#DCE7DF] dark:border-[#244737]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE7DF] dark:border-[#244737]">
              <h3 className="font-display text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                {tr("Add Plant to Collection")}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#668074] hover:text-[#163A2D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPlant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] mb-1.5">
                  {tr("Plant Common Name")} *
                </label>
                <input
                  type="text"
                  required
                  value={newPlantName}
                  onChange={(e) => setNewPlantName(e.target.value)}
                  placeholder="e.g., Monstera Deliciosa"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] mb-1.5">
                  {tr("Scientific Name")}
                </label>
                <input
                  type="text"
                  value={newScientificName}
                  onChange={(e) => setNewScientificName(e.target.value)}
                  placeholder="e.g., Monstera deliciosa"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] mb-1.5">
                    {tr("Location")}
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] mb-1.5">
                    {tr("Category")}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3]"
                  >
                    <option value="Indoor Tropical">{tr("Indoor Tropical")}</option>
                    <option value="Vegetable">{tr("Vegetable")}</option>
                    <option value="Flowering">{tr("Flowering")}</option>
                    <option value="Succulent">{tr("Succulent")}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#668074]"
                >
                  {tr("Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#12563D] cursor-pointer"
                >
                  {tr("Save Plant")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

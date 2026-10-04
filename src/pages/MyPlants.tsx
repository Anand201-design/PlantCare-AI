import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  X,
  ScanLine,
} from "lucide-react";
import { VoiceInputButton } from "../components/VoiceInputButton";
import { AudioSpeechButton } from "../components/AudioSpeechButton";
import {
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";

interface PlantItem {
  id: string;
  _id?: string;
  plantName: string;
  scientificName: string;
  category?: string;
  location?: string;
  imageUrl?: string;
  latestHealthScore?: number;
  latestStatus?: string;
  latestDisease?: string;
  notes?: string;
}

export const MyPlants: React.FC = () => {
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<PlantItem | null>(null);

  const [formName, setFormName] = useState("");
  const [formScientific, setFormScientific] = useState("");
  const [formCategory, setFormCategory] = useState("Indoor Tropical");
  const [formLocation, setFormLocation] = useState("Living Room");
  const [formNotes, setFormNotes] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchPlants = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/plants");
      if (res.ok) {
        const data = await res.json();
        setPlants(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    plants.forEach((p) => {
      if (p.category) set.add(p.category.split("·")[0].trim());
    });
    return ["all", ...Array.from(set)];
  }, [plants]);

  const filteredPlants = useMemo(() => {
    return plants.filter((p) => {
      const matchesSearch =
        p.plantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.location && p.location.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat =
        selectedCategory === "all" ||
        (p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase()));
      return matchesSearch && matchesCat;
    });
  }, [plants, searchQuery, selectedCategory]);

  const handleOpenAddModal = () => {
    setFormName("");
    setFormScientific("");
    setFormCategory("Indoor Tropical");
    setFormLocation("Living Room");
    setFormNotes("");
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (p: PlantItem) => {
    setEditingPlant(p);
    setFormName(p.plantName);
    setFormScientific(p.scientificName);
    setFormCategory(p.category || "Indoor Tropical");
    setFormLocation(p.location || "Living Room");
    setFormNotes(p.notes || "");
  };

  const handleSavePlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setFormSubmitting(true);
    try {
      if (editingPlant) {
        const res = await fetch(`/api/plants/${editingPlant.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plantName: formName.trim(),
            scientificName: formScientific.trim() || "Botanical cultivar",
            category: formCategory.trim(),
            location: formLocation.trim(),
            notes: formNotes.trim(),
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setPlants((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
          setEditingPlant(null);
        }
      } else {
        const res = await fetch("/api/plants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plantName: formName.trim(),
            scientificName: formScientific.trim() || "Botanical cultivar",
            category: formCategory.trim(),
            location: formLocation.trim(),
            notes: formNotes.trim(),
          }),
        });
        if (res.ok) {
          const created = await res.json();
          setPlants((prev) => [created, ...prev]);
          setIsAddModalOpen(false);
        }
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeletePlant = async (id: string) => {
    try {
      const res = await fetch(`/api/plants/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlants((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      // ignore
    }
  };

  const healthyCount = plants.filter((p) => (p.latestHealthScore ?? 80) >= 85).length;
  const attentionCount = plants.filter((p) => (p.latestHealthScore ?? 80) < 85).length;
  const avgHealth =
    plants.length > 0
      ? Math.round(
          plants.reduce((acc, p) => acc + (p.latestHealthScore ?? 88), 0) / plants.length
        )
      : 92;

  return (
    <div className="space-y-7 pb-16 max-w-[1240px] mx-auto font-sans antialiased text-[#163A2D] dark:text-[#F1F7F3]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <nav className="flex items-center gap-1.5 text-xs text-[#668074] dark:text-[#B0C9BA]">
            <Link to="/dashboard" className="hover:text-[#176B4D] dark:hover:text-[#8EAD9B]">
              PlantCare AI
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#163A2D] dark:text-[#F1F7F3]">My Plants</span>
          </nav>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#163A2D] dark:text-[#F1F7F3] tracking-tight">
              My Plants Collection
            </h1>
            <p className="text-sm text-[#668074] dark:text-[#B0C9BA] mt-1">
              Manage your saved plants, monitor their health status, and access personalized care guides.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <AudioSpeechButton
            text={`My Plants collection: You have ${plants.length} plants.`}
            label="Listen"
            size="md"
          />
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#12563D] rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plant</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737]">
          <span className="text-xs font-semibold text-[#668074] dark:text-[#B0C9BA]">
            Total Plants
          </span>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[#163A2D] dark:text-[#F1F7F3] mt-1">
            {plants.length}
          </p>
        </div>
        <div className="p-5 rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737]">
          <span className="text-xs font-semibold text-[#668074] dark:text-[#B0C9BA]">
            Healthy & Thriving
          </span>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[#2D8A62] mt-1">
            {healthyCount}
          </p>
        </div>
        <div className="p-5 rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737]">
          <span className="text-xs font-semibold text-[#668074] dark:text-[#B0C9BA]">
            Needs Attention
          </span>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[#C96F62] mt-1">
            {attentionCount}
          </p>
        </div>
        <div className="p-5 rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737]">
          <span className="text-xs font-semibold text-[#668074] dark:text-[#B0C9BA]">
            Average Health
          </span>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[#176B4D] dark:text-[#8EAD9B] mt-1">
            {avgHealth}%
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#668074] dark:text-[#B0C9BA] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search plant name, species, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2 text-xs bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl text-[#163A2D] dark:text-[#F1F7F3] focus:outline-none"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <VoiceInputButton onTranscript={(spoken) => setSearchQuery(spoken)} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#176B4D] text-white"
                  : "bg-[#F0F6F1] dark:bg-[#12281E] text-[#668074] dark:text-[#B0C9BA]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Plants Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-72 rounded-[22px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlants.map((plant) => {
            const score = plant.latestHealthScore ?? 90;
            const isHealthy = score >= 85;
            return (
              <div
                key={plant.id}
                className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] overflow-hidden shadow-[0_2px_8px_rgba(22,58,45,0.03)] flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 bg-[#F6F9F5] dark:bg-[#12281E] border-b border-[#DCE7DF] dark:border-[#244737] overflow-hidden">
                    <img
                      src={resolveRealisticPlantImage(
                        plant.imageUrl,
                        plant.plantName,
                        plant.scientificName,
                        plant.latestDisease
                      )}
                      alt={`${plant.plantName} (${plant.scientificName})`}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={(e) =>
                        handlePlantImageError(e, plant.plantName, plant.scientificName)
                      }
                      className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
                    />
                    <span
                      className={`absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        isHealthy
                          ? "bg-white/95 dark:bg-[#173126]/95 text-[#2D8A62] border-[#DCE7DF]"
                          : "bg-[#FBECE9] text-[#C96F62] border-[#C96F62]/30"
                      }`}
                    >
                      {isHealthy ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      <span>{score}% Health</span>
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                        {plant.plantName}
                      </h3>
                      <p className="text-xs italic text-[#668074] dark:text-[#B0C9BA]">
                        {plant.scientificName}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#668074] dark:text-[#B0C9BA]">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
                        {plant.location || "Home Garden"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-[#F6F9F5] dark:bg-[#12281E] border-t border-[#DCE7DF] dark:border-[#244737] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/plants/${plant.id}`}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737]"
                    >
                      Profile
                    </Link>
                    <Link
                      to={`/analyze?mode=disease&plantId=${plant.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#176B4D]"
                    >
                      <ScanLine className="w-3 h-3" />
                      <span>Check</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(plant)}
                      className="p-1.5 text-[#668074] hover:text-[#163A2D] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlant(plant.id)}
                      className="p-1.5 text-[#668074] hover:text-[#C96F62] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingPlant) && (
        <div className="fixed inset-0 z-50 bg-[#163A2D]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#173126] rounded-[24px] max-w-md w-full p-6 space-y-4 border border-[#DCE7DF] dark:border-[#244737] shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE7DF] dark:border-[#244737]">
              <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                {editingPlant ? "Edit Plant" : "Add New Plant"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingPlant(null);
                }}
                className="p-1 text-[#668074] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlant} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#668074] dark:text-[#B0C9BA] mb-1 font-semibold">
                  Common Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl text-[#163A2D] dark:text-[#F1F7F3]"
                />
              </div>
              <div>
                <label className="block text-[#668074] dark:text-[#B0C9BA] mb-1 font-semibold">
                  Scientific Name
                </label>
                <input
                  type="text"
                  value={formScientific}
                  onChange={(e) => setFormScientific(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl text-[#163A2D] dark:text-[#F1F7F3]"
                />
              </div>
              <div>
                <label className="block text-[#668074] dark:text-[#B0C9BA] mb-1 font-semibold">
                  Location
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl text-[#163A2D] dark:text-[#F1F7F3]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingPlant(null);
                  }}
                  className="px-4 py-2 rounded-xl text-[#668074] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl font-semibold text-white bg-[#176B4D] cursor-pointer"
                >
                  Save Plant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

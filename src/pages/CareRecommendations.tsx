import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Droplets,
  Sun,
  Thermometer,
  Sparkles,
  Check,
  Calendar,
  ArrowRight,
  Sprout,
  Plus,
} from "lucide-react";
import {
  REAL_PLANT_IMAGES,
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";
import { useLanguage } from "../context/LanguageContext";
import { AudioSpeechButton } from "../components/AudioSpeechButton";

interface CareGuideItem {
  id: string;
  plantName: string;
  scientificName: string;
  imageUrl: string;
  water: string;
  sunlight: string;
  temperature: string;
  humidity: string;
  fertilizer: string;
  seasonalTip: string;
}

interface CareTask {
  id: string;
  plantName: string;
  title: string;
  schedule: string;
  completed: boolean;
}

const CARE_GUIDES: CareGuideItem[] = [
  {
    id: "care-1",
    plantName: "Monstera Deliciosa",
    scientificName: "Monstera deliciosa",
    imageUrl: REAL_PLANT_IMAGES.monstera,
    water: "Every 7–10 days (top 5cm dry)",
    sunlight: "Bright Indirect Light",
    temperature: "18°C – 29°C",
    humidity: "60% – 80%",
    fertilizer: "Balanced 20-20-20 monthly",
    seasonalTip:
      "Wipe fenestrated leaves with a damp cloth monthly to maximize photosynthesis.",
  },
  {
    id: "care-2",
    plantName: "Tomato",
    scientificName: "Solanum lycopersicum",
    imageUrl: REAL_PLANT_IMAGES.tomato,
    water: "Daily in warm weather (consistent moisture)",
    sunlight: "Full Sun (6–8 hrs direct)",
    temperature: "21°C – 27°C",
    humidity: "50% – 70%",
    fertilizer: "High-potassium & calcium feed biweekly",
    seasonalTip:
      "Prune lower leaves touching the soil and apply organic copper fungicide preventatively.",
  },
  {
    id: "care-3",
    plantName: "Garden Rose",
    scientificName: "Rosa × hybrida",
    imageUrl: REAL_PLANT_IMAGES.rose,
    water: "Every 4–5 days (deep root soak)",
    sunlight: "Full Sun (6+ hrs)",
    temperature: "16°C – 26°C",
    humidity: "50% – 65%",
    fertilizer: "Organic rose fertilizer every 3 weeks",
    seasonalTip:
      "Water at the base rather than overhead to prevent black spot and powdery mildew.",
  },
  {
    id: "care-4",
    plantName: "Chilli Pepper",
    scientificName: "Capsicum annuum",
    imageUrl: REAL_PLANT_IMAGES.chilli,
    water: "Every 3–4 days (avoid waterlogging)",
    sunlight: "Full Sun (6–8 hrs direct)",
    temperature: "20°C – 30°C",
    humidity: "55% – 70%",
    fertilizer: "Organic nitrogen & micronutrient boost",
    seasonalTip:
      "Check underside of curling leaves for aphids or mites and maintain even soil moisture.",
  },
];

export const CareRecommendations: React.FC = () => {
  const navigate = useNavigate();
  const { tr, localizePlantName } = useLanguage();
  const [tasks, setTasks] = useState<CareTask[]>([
    {
      id: "t-1",
      plantName: "Monstera Deliciosa",
      title: "Check soil moisture & mist fenestrated leaves",
      schedule: "Today",
      completed: false,
    },
    {
      id: "t-2",
      plantName: "Tomato",
      title: "Apply organic bio-fungicide for early blight prevention",
      schedule: "Today",
      completed: false,
    },
    {
      id: "t-3",
      plantName: "Chilli Pepper",
      title: "Fertigate with balanced organic nitrogen amendment",
      schedule: "Tomorrow",
      completed: false,
    },
    {
      id: "t-4",
      plantName: "Garden Rose",
      title: "Rotate pot 90° for uniform sun exposure",
      schedule: "In 2 days",
      completed: true,
    },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPlant, setNewTaskPlant] = useState("Monstera Deliciosa");
  const [showTaskForm, setShowTaskForm] = useState(false);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTasks((prev) => [
      {
        id: `t-${Date.now()}`,
        plantName: newTaskPlant,
        title: newTaskTitle.trim(),
        schedule: "Today",
        completed: false,
      },
      ...prev,
    ]);
    setNewTaskTitle("");
    setShowTaskForm(false);
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
              {tr("Care Recommendations")}
            </span>
          </nav>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#163A2D] dark:text-[#F1F7F3] tracking-tight">
            {tr("Care Recommendations")}
          </h1>
          <p className="text-sm text-[#668074] dark:text-[#B0C9BA] mt-1">
            {tr("Botanical care schedules, environmental targets, and actionable tasks for your plants.")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/analyze?mode=identify")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#12563D] cursor-pointer self-start sm:self-auto"
        >
          <Sprout className="w-4 h-4" />
          <span>{tr("Identify Plant")}</span>
        </button>
      </div>

      {/* Interactive Care Tasks */}
      <section className="rounded-[22px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)] space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-[#DCE7DF] dark:border-[#244737]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                {tr("Scheduled Care Tasks")}
              </h2>
              <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                {tasks.filter((t) => t.completed).length} / {tasks.length} {tr("Completed")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTaskForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{tr("Add Task")}</span>
          </button>
        </div>

        {showTaskForm && (
          <form
            onSubmit={handleAddTask}
            className="p-4 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex flex-col sm:flex-row gap-3"
          >
            <select
              value={newTaskPlant}
              onChange={(e) => setNewTaskPlant(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3]"
            >
              <option value="Monstera Deliciosa">{localizePlantName("Monstera Deliciosa")}</option>
              <option value="Tomato">{localizePlantName("Tomato")}</option>
              <option value="Garden Rose">{localizePlantName("Garden Rose")}</option>
              <option value="Chilli Pepper">{localizePlantName("Chilli Pepper")}</option>
            </select>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder={tr("Add custom task for a plant...")}
              className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3]"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#176B4D] cursor-pointer"
            >
              {tr("Add")}
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-between gap-3 cursor-pointer hover:border-[#8EAD9B] transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                    task.completed
                      ? "bg-[#176B4D] text-white"
                      : "border-2 border-[#DCE7DF] dark:border-[#244737] bg-white dark:bg-[#173126]"
                  }`}
                >
                  {task.completed && <Check className="w-3.5 h-3.5" />}
                </span>
                <img
                  src={resolveRealisticPlantImage(null, task.plantName)}
                  alt={task.plantName}
                  referrerPolicy="no-referrer"
                  onError={(e) => handlePlantImageError(e, task.plantName)}
                  className="w-10 h-10 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0"
                />
                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold truncate ${
                      task.completed
                        ? "line-through text-[#668074]"
                        : "text-[#163A2D] dark:text-[#F1F7F3]"
                    }`}
                  >
                    {localizePlantName(task.plantName)}
                  </p>
                  <p className="text-xs text-[#668074] dark:text-[#B0C9BA] truncate">
                    {tr(task.title)}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] text-[#668074] dark:text-[#B0C9BA] shrink-0">
                {tr(task.schedule)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Plant Care Guides */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3]">
          {tr("Plant Care Guides")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CARE_GUIDES.map((guide) => {
            const localizedName = localizePlantName(guide.plantName);
            const localizedTip = tr(guide.seasonalTip);
            const speechSummary = `${localizedName}. ${tr("Sunlight")}: ${tr(guide.sunlight)}. ${tr("Water")}: ${tr(guide.water)}. ${tr("Care Tip:")} ${localizedTip}`;

            return (
              <div
                key={guide.id}
                className="rounded-[22px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-5 shadow-[0_2px_8px_rgba(22,58,45,0.03)] space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={resolveRealisticPlantImage(
                          guide.imageUrl,
                          guide.plantName,
                          guide.scientificName
                        )}
                        alt={`${guide.plantName} (${guide.scientificName})`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) =>
                          handlePlantImageError(e, guide.plantName, guide.scientificName)
                        }
                        className="w-16 h-16 rounded-2xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3] truncate">
                          {localizedName}
                        </h3>
                        <p className="text-xs italic text-[#668074] dark:text-[#B0C9BA] truncate">
                          {guide.scientificName}
                        </p>
                      </div>
                    </div>

                    <AudioSpeechButton text={speechSummary} />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B]">
                        <Sun className="w-3.5 h-3.5" />
                        <span>{tr("Light")}</span>
                      </div>
                      <p className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3] mt-1">
                        {tr(guide.sunlight)}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B]">
                        <Droplets className="w-3.5 h-3.5" />
                        <span>{tr("Water")}</span>
                      </div>
                      <p className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3] mt-1">
                        {tr(guide.water)}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B]">
                        <Thermometer className="w-3.5 h-3.5" />
                        <span>{tr("Temperature")}</span>
                      </div>
                      <p className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3] mt-1">
                        {guide.temperature} ({guide.humidity} {tr("Humidity")})
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{tr("Fertilizer")}</span>
                      </div>
                      <p className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3] mt-1">
                        {tr(guide.fertilizer)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F0F6F1] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-between gap-3">
                  <p className="text-xs text-[#163A2D] dark:text-[#F1F7F3] leading-relaxed">
                    <span className="font-bold text-[#176B4D] dark:text-[#8EAD9B]">
                      {tr("Care Tip:")}{" "}
                    </span>
                    {localizedTip}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/plants")}
                    className="p-2 rounded-lg bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] shrink-0 cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ScanLine, Plus, Sprout } from "lucide-react";
import { plantService, PlantProfileItem } from "../services/plantService";
import { AudioSpeechButton } from "../components/AudioSpeechButton";
import {
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";

export const PlantProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plant, setPlant] = useState<PlantProfileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSensorLog, setShowSensorLog] = useState(false);
  const [moisture, setMoisture] = useState(45);
  const [ph, setPh] = useState(6.4);
  const [temp, setTemp] = useState(25);
  const [hum, setHum] = useState(60);

  useEffect(() => {
    const targetId = id || "671f9b20c4d8a912e4560101";
    setLoading(true);
    plantService
      .getPlantById(targetId)
      .then((data) => setPlant(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plant) return;
    await plantService.logSensorData({
      plantId: plant.id,
      soilMoisture: moisture,
      soilPH: ph,
      temperature: temp,
      humidity: hum,
    });
    setShowSensorLog(false);
    const updated = await plantService.getPlantById(plant.id);
    setPlant(updated);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#668074] dark:text-[#B0C9BA]">
        Loading plant profile...
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="p-8 space-y-4 max-w-md mx-auto text-center bg-white dark:bg-[#173126] rounded-[22px] border border-[#DCE7DF] dark:border-[#244737]">
        <p className="text-sm font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
          Plant profile not found.
        </p>
        <Link
          to="/plants"
          className="text-xs font-bold text-[#176B4D] dark:text-[#8EAD9B] hover:underline"
        >
          Return to My Plants
        </Link>
      </div>
    );
  }

  const narration = `Plant profile for ${plant.plantName}, scientific name ${plant.scientificName}. Location: ${plant.location}. Health score: ${plant.latestHealthScore || 88} percent.`;

  return (
    <div className="space-y-7 pb-16 max-w-6xl mx-auto font-sans antialiased text-[#163A2D] dark:text-[#F1F7F3]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#668074] dark:text-[#B0C9BA]">
            <Link
              to="/plants"
              className="inline-flex items-center gap-1 hover:text-[#176B4D] dark:hover:text-[#8EAD9B]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> My Plants
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
              Plant Profile
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#163A2D] dark:text-[#F1F7F3] tracking-tight">
            {plant.plantName}{" "}
            <span className="italic font-normal text-base text-[#668074] dark:text-[#B0C9BA]">
              ({plant.scientificName})
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <AudioSpeechButton text={narration} label="Listen" size="md" />
          <button
            type="button"
            onClick={() => setShowSensorLog((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-xl cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
            <span>Log Conditions</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`/analyze?mode=disease&plantId=${plant.id}`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#176B4D] rounded-xl cursor-pointer"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Check Plant Health</span>
          </button>
        </div>
      </div>

      {showSensorLog && (
        <form
          onSubmit={handleSaveSensor}
          className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-6 space-y-4"
        >
          <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
            Record Plant Environment Conditions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-[#668074] dark:text-[#B0C9BA] mb-1 font-semibold">
                Soil Moisture (%)
              </label>
              <input
                type="number"
                value={moisture}
                onChange={(e) => setMoisture(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl text-[#163A2D] dark:text-[#F1F7F3]"
              />
            </div>
            <div>
              <label className="block text-[#668074] dark:text-[#B0C9BA] mb-1 font-semibold">
                Soil pH
              </label>
              <input
                type="number"
                step="0.1"
                value={ph}
                onChange={(e) => setPh(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl text-[#163A2D] dark:text-[#F1F7F3]"
              />
            </div>
            <div>
              <label className="block text-[#668074] dark:text-[#B0C9BA] mb-1 font-semibold">
                Temperature (°C)
              </label>
              <input
                type="number"
                value={temp}
                onChange={(e) => setTemp(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl text-[#163A2D] dark:text-[#F1F7F3]"
              />
            </div>
            <div>
              <label className="block text-[#668074] dark:text-[#B0C9BA] mb-1 font-semibold">
                Humidity (%)
              </label>
              <input
                type="number"
                value={hum}
                onChange={(e) => setHum(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl text-[#163A2D] dark:text-[#F1F7F3]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowSensorLog(false)}
              className="px-3.5 py-1.5 text-xs text-[#668074] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#176B4D] rounded-xl cursor-pointer"
            >
              Save Conditions
            </button>
          </div>
        </form>
      )}

      {/* Profile Overview Card */}
      <section className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-6 sm:p-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 aspect-4/3 rounded-2xl overflow-hidden bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] shadow-2xs">
            <img
              src={resolveRealisticPlantImage(
                plant.imageUrl,
                plant.plantName,
                plant.scientificName,
                plant.latestDisease
              )}
              alt={`${plant.plantName} (${plant.scientificName})`}
              referrerPolicy="no-referrer"
              onError={(e) =>
                handlePlantImageError(e, plant.plantName, plant.scientificName)
              }
              className="w-full h-full object-cover object-center"
            />
          </div>

          <div className="lg:col-span-8 space-y-5 text-xs">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#DCE7DF] dark:border-[#244737]">
              <div>
                <span className="text-[#668074] dark:text-[#B0C9BA] block text-[11px] font-medium">
                  Location
                </span>
                <span className="font-bold text-base text-[#163A2D] dark:text-[#F1F7F3] mt-0.5 block">
                  {plant.location}
                </span>
              </div>
              <div>
                <span className="text-[#668074] dark:text-[#B0C9BA] block text-[11px] font-medium">
                  Health Score
                </span>
                <span className="font-bold text-lg text-[#2D8A62] mt-0.5 block">
                  {plant.latestHealthScore || 88}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
                <span className="text-[#668074] dark:text-[#B0C9BA] block font-semibold">
                  Soil Type
                </span>
                <span className="font-medium text-[#163A2D] dark:text-[#F1F7F3] mt-0.5 block">
                  {plant.soilType || "Well-draining potting mix (pH 6.0–6.8)"}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
                <span className="text-[#668074] dark:text-[#B0C9BA] block font-semibold">
                  Sunlight
                </span>
                <span className="font-medium text-[#163A2D] dark:text-[#F1F7F3] mt-0.5 block">
                  {plant.sunlightRequirement || "Bright indirect sunlight"}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
                <span className="text-[#668074] dark:text-[#B0C9BA] block font-semibold">
                  Watering Schedule
                </span>
                <span className="font-medium text-[#163A2D] dark:text-[#F1F7F3] mt-0.5 block">
                  {plant.waterRequirement || "Water when top 2 inches of soil feel dry"}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
                <span className="text-[#668074] dark:text-[#B0C9BA] block font-semibold">
                  Temperature Range
                </span>
                <span className="font-medium text-[#163A2D] dark:text-[#F1F7F3] mt-0.5 block">
                  {plant.temperatureRange || "18°C – 27°C"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

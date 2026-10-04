import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sprout,
  Stethoscope,
  Sparkles,
  Activity,
  ScanLine,
  Upload,
  Camera,
  ArrowRight,
  ChevronRight,
  Leaf,
  Sun,
  Volume2,
  VolumeX,
  X,
  AlertTriangle,
  Layers,
  Thermometer,
  Droplets,
  Loader2,
  Clock,
  Check,
  Calendar,
  Bookmark,
} from "lucide-react";
import {
  plantService,
  PlantProfileItem,
  DiagnosticResult,
} from "../services/plantService";
import {
  validateImageFile,
  optimizeImageForAnalysis,
} from "../utils/imageOptimizer";
import {
  REAL_PLANT_IMAGES,
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";

interface CareReminder {
  id: string;
  plantName: string;
  task: string;
  type: "water" | "light" | "fertilize" | "prune";
  dueDate: string;
  isUrgent?: boolean;
  completed: boolean;
}

interface ActivityEvent {
  id: string;
  type: "identify" | "disease" | "care" | "plant_added" | "sensor";
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [plants, setPlants] = useState<PlantProfileItem[]>([]);
  const [analyses, setAnalyses] = useState<DiagnosticResult[]>([]);
  const [, setLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCareModal, setShowCareModal] = useState(false);
  const [showPlantsModal, setShowPlantsModal] = useState(false);
  const [newPlantName, setNewPlantName] = useState("");
  const [newScientificName, setNewScientificName] = useState("");
  const [newLocation, setNewLocation] = useState("Living Room Shelf");

  const [reminders, setReminders] = useState<CareReminder[]>([
    {
      id: "rem-1",
      plantName: "Monstera Deliciosa",
      task: "Check soil moisture & mist fenestrated leaves",
      type: "water",
      dueDate: "Today",
      isUrgent: true,
      completed: false,
    },
    {
      id: "rem-2",
      plantName: "Tomato (Bed A4)",
      task: "Apply organic bio-fungicide for early blight prevention",
      type: "prune",
      dueDate: "Today",
      isUrgent: true,
      completed: false,
    },
    {
      id: "rem-3",
      plantName: "Chilli Pepper",
      task: "Fertigate with balanced organic nitrogen amendment",
      type: "fertilize",
      dueDate: "Tomorrow",
      isUrgent: false,
      completed: false,
    },
    {
      id: "rem-4",
      plantName: "Garden Rose",
      task: "Rotate pot 90° for uniform sun exposure",
      type: "light",
      dueDate: "In 2 days",
      isUrgent: false,
      completed: false,
    },
  ]);

  useEffect(() => {
    Promise.all([plantService.getPlants(), plantService.getAnalysisHistory()])
      .then(([pList, aList]) => {
        setPlants(pList);
        setAnalyses(aList);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const attentionPlants = useMemo(() => {
    if (plants.length === 0) {
      return [
        {
          id: "671f9b20c4d8a912e4560101",
          plantName: "Tomato",
          scientificName: "Solanum lycopersicum",
          latestStatus: "Moderate Stress",
          latestDisease: "Early Blight",
          latestHealthScore: 82,
          imageUrl: REAL_PLANT_IMAGES.tomato,
          actionText: "Prune lower infected foliage and apply copper bio-fungicide",
        },
        {
          id: "671f9b20c4d8a912e4560103",
          plantName: "Chilli",
          scientificName: "Capsicum annuum",
          latestStatus: "Mild Stress",
          latestDisease: "Nitrogen Deficiency",
          latestHealthScore: 76,
          imageUrl: REAL_PLANT_IMAGES.chilli,
          actionText: "Check soil nitrate levels and apply organic nitrogen feed",
        },
      ];
    }
    const filtered = plants.filter(
      (p) =>
        (p.latestStatus && p.latestStatus !== "Healthy") ||
        (p.latestHealthScore && p.latestHealthScore < 85) ||
        (p.latestDisease && p.latestDisease !== "Healthy")
    );
    return filtered.length > 0 ? filtered : plants.slice(0, 2);
  }, [plants]);

  const healthStats = useMemo(() => {
    const totalPlants = plants.length > 0 ? plants.length : 24;
    const healthyCount =
      plants.length > 0
        ? plants.filter((p) => p.latestStatus === "Healthy").length
        : 20;
    const attentionCount =
      plants.length > 0
        ? plants.filter(
            (p) =>
              p.latestStatus === "Mild Stress" ||
              p.latestStatus === "Moderate Stress"
          ).length
        : 3;
    const criticalCount =
      plants.length > 0
        ? plants.filter(
            (p) =>
              p.latestStatus === "Severe Stress" ||
              p.latestStatus === "Disease Suspected"
          ).length
        : 1;
    const avgScore =
      plants.length > 0
        ? Math.round(
            plants.reduce((acc, p) => acc + (p.latestHealthScore || 85), 0) /
              plants.length
          )
        : 89;

    return {
      totalPlants,
      healthyCount: healthyCount || Math.max(1, totalPlants - 4),
      attentionCount: attentionCount || 3,
      criticalCount: criticalCount || 1,
      avgScore,
    };
  }, [plants]);

  const recentActivities: ActivityEvent[] = useMemo(() => {
    const list: ActivityEvent[] = [];
    if (analyses.length > 0) {
      analyses.slice(0, 3).forEach((a) => {
        const isDisease = a.disease_name && a.disease_name !== "Healthy";
        list.push({
          id: `act-${a.id}`,
          type: isDisease ? "disease" : "identify",
          title: isDisease
            ? `Disease Scan: ${a.disease_name}`
            : `Species Identified: ${a.plant_name}`,
          description: `${a.plant_name} (${a.scientific_name || "Botanical specimen"}) · Confidence ${Math.round((a.confidence_score || 0.95) * 100)}%`,
          timestamp: "Recently",
          link: `/results/${a.id}`,
        });
      });
    } else {
      list.push(
        {
          id: "act-default-1",
          type: "disease",
          title: "Disease Detection: Early Blight",
          description: "Tomato leaf checked · Moderate severity symptoms identified",
          timestamp: "2 hours ago",
          link: "/results/671f9b20c4d8a912e4560201",
        },
        {
          id: "act-default-2",
          type: "identify",
          title: "Plant Identified: Garden Rose",
          description: "Rosa × hybrida · Healthy foliage (96% health score)",
          timestamp: "5 hours ago",
          link: "/results/671f9b20c4d8a912e4560202",
        },
        {
          id: "act-default-3",
          type: "care",
          title: "Care Update: Soil Moisture",
          description: "Monstera Deliciosa watered to 68% optimal moisture",
          timestamp: "Yesterday",
          link: "/care",
        }
      );
    }
    return list;
  }, [analyses]);

  const handleListenInsight = () => {
    const text =
      "Your Monstera is thriving. Rotate it a quarter turn this week to encourage balanced foliar growth toward the light.";
    if (!("speechSynthesis" in window)) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleFileProcess = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || "Invalid image file.");
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      const optimizedFile = await optimizeImageForAnalysis(file);
      const formData = new FormData();
      formData.append("image", optimizedFile);
      formData.append("mime_type", optimizedFile.type || "image/jpeg");
      const result = await plantService.analyzePlantImage(formData);
      if (result && result.id) {
        navigate(`/results/${result.id}`, { state: { result } });
      } else {
        throw new Error("Analysis failed. Please try again.");
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Analysis failed.");
      setIsUploading(false);
    }
  };

  const startCamera = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setVideoStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setShowCameraModal(false);
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
          stopCamera();
          handleFileProcess(file);
        }
      }, "image/jpeg");
    }
  };

  const handleRegisterPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlantName.trim()) return;
    try {
      const created = await plantService.createPlant({
        plantName: newPlantName.trim(),
        scientificName: newScientificName.trim() || "Monstera deliciosa",
        location: newLocation.trim(),
        category: "Indoor Tropical",
        latestHealthScore: 94,
        latestStatus: "Healthy",
        latestDisease: "Healthy",
      });
      setPlants((prev) => [created, ...prev]);
      setNewPlantName("");
      setNewScientificName("");
      setShowPlantsModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-7 pb-16 font-sans select-none max-w-[1320px] mx-auto relative">
      {/* 1. TOP HERO CARD */}
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-white via-[#F2F8F4] to-[#DFEFE6] dark:from-[#173126] dark:via-[#142C22] dark:to-[#0F241B] border border-[#C6DDD0] dark:border-[#2A5240] p-6 sm:p-8 lg:p-9 shadow-[0_4px_16px_rgba(23,107,77,0.08)]">
        {/* Minimalist Tree-Theme Background Artwork with Forest Green Shade */}
        <svg
          viewBox="0 0 1200 360"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="pointer-events-none select-none absolute inset-0 w-full h-full opacity-95 dark:opacity-60 z-0"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="heroTreeCanopy1" x1="680" y1="20" x2="680" y2="260" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#176B4D" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#2D8A62" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#176B4D" stopOpacity="0.06" />
            </linearGradient>
            <linearGradient id="heroTreeCanopy2" x1="1180" y1="-10" x2="940" y2="230" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#163A2D" stopOpacity="0.38" />
              <stop offset="55%" stopColor="#176B4D" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#2D8A62" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="heroForestGroundShade" x1="600" y1="270" x2="600" y2="360" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#176B4D" stopOpacity="0" />
              <stop offset="100%" stopColor="#176B4D" stopOpacity="0.14" />
            </linearGradient>
          </defs>

          {/* Soft forest green lower horizon shade */}
          <path
            d="M0 315 Q 360 295, 720 312 T 1200 300 L 1200 360 L 0 360 Z"
            fill="url(#heroForestGroundShade)"
          />
          <path
            d="M0 335 Q 360 322, 720 332 T 1200 326"
            stroke="#176B4D"
            strokeWidth="1.4"
            strokeOpacity="0.32"
          />

          {/* Center-right minimalist architectural tree (slender trunk, forked limbs, forest green canopy) */}
          <circle cx="690" cy="135" r="90" fill="url(#heroTreeCanopy1)" />
          <circle cx="748" cy="165" r="58" fill="url(#heroTreeCanopy1)" />
          <circle cx="636" cy="172" r="54" fill="url(#heroTreeCanopy1)" />
          {/* Tree trunk and minimalist Y-branches */}
          <path
            d="M690 332 V 145 M690 235 C668 212, 648 192, 635 168 M690 205 C715 184, 734 168, 748 146 M690 175 C676 155, 665 138, 658 118 M662 204 C650 200, 638 198, 626 200 M720 178 C732 176, 744 178, 756 184"
            stroke="#163A2D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.45"
          />
          {/* Minimalist forest green leaf nodes on center-right tree */}
          <path
            d="M658 118 C652 104, 660 92, 670 98 C668 110, 662 115, 658 118 Z"
            fill="#176B4D"
            fillOpacity="0.42"
          />
          <path
            d="M748 146 C754 134, 766 132, 768 142 C760 148, 752 148, 748 146 Z"
            fill="#176B4D"
            fillOpacity="0.38"
          />
          <path
            d="M635 168 C624 160, 624 148, 634 146 C638 154, 638 162, 635 168 Z"
            fill="#2D8A62"
            fillOpacity="0.38"
          />

          {/* Far-right overhanging minimalist tree bough in deep forest green */}
          <path
            d="M1210 28 C1130 42, 1065 78, 1005 132 C978 156, 952 172, 922 184"
            stroke="#163A2D"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeOpacity="0.48"
          />
          <path
            d="M1095 62 C1072 92, 1058 122, 1035 148 M1005 132 C982 124, 962 112, 944 96"
            stroke="#176B4D"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeOpacity="0.42"
          />
          <path
            d="M1205 -10 C1125 12, 1075 68, 1098 145 C1152 120, 1190 62, 1205 -10 Z"
            fill="url(#heroTreeCanopy2)"
          />
          <path
            d="M944 96 C930 88, 932 74, 946 74 C950 84, 948 92, 944 96 Z"
            fill="#176B4D"
            fillOpacity="0.42"
          />
          <path
            d="M922 184 C906 180, 902 190, 912 198 C920 196, 922 190, 922 184 Z"
            fill="#2D8A62"
            fillOpacity="0.4"
          />

          {/* Left-side minimalist sapling silhouette */}
          <circle cx="48" cy="272" r="46" fill="url(#heroTreeCanopy1)" />
          <path
            d="M48 335 V 242 M48 295 L 28 272 M48 278 L 68 256"
            stroke="#176B4D"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeOpacity="0.38"
          />
        </svg>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center relative z-10">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] text-xs font-semibold">
              <Leaf className="w-3.5 h-3.5" />
              <span>Botanical Health & Diagnostics</span>
            </div>

            <div className="space-y-2.5">
              <h1 className="font-display text-[32px] sm:text-[42px] lg:text-[50px] font-extrabold text-[#163A2D] dark:text-[#F1F7F3] tracking-[-0.035em] leading-[1.08] text-balance">
                Know Your Plant.{" "}
                <span className="block sm:inline text-[#176B4D] dark:text-[#8EAD9B] font-semibold">
                  Keep It Healthy.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-[#668074] dark:text-[#B0C9BA] max-w-xl leading-relaxed">
                AI-powered plant identification, disease detection and personalized care insights.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate("/analyze?mode=identify")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#176B4D] hover:bg-[#12563D] transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <Sprout className="w-4 h-4" />
                <span>Identify Plant</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/analyze?mode=disease")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#176B4D] dark:text-[#8EAD9B] bg-[#E4F0E7] dark:bg-[#1D3B2D] hover:bg-[#DCE7DF] border border-[#DCE7DF] dark:border-[#244737] transition-all cursor-pointer active:scale-95"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Detect Disease</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/plants")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#163A2D] dark:text-[#F1F7F3] bg-[#F6F9F5] dark:bg-[#12281E] hover:bg-[#F0F6F1] border border-[#DCE7DF] dark:border-[#244737] transition-all cursor-pointer active:scale-95"
              >
                <Bookmark className="w-4 h-4 text-[#176B4D] dark:text-[#8EAD9B]" />
                <span>View My Plants</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-[360px] bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-[20px] p-4 space-y-3.5">
              <div className="relative h-36 w-full rounded-2xl overflow-hidden bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737]">
                <img
                  src="/src/assets/images/hero_monstera_plant_1791123269478.jpg"
                  alt="Monstera Deliciosa"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 dark:bg-[#173126]/95 border border-[#DCE7DF] dark:border-[#244737] text-[11px] font-semibold text-[#176B4D] dark:text-[#8EAD9B]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D8A62]" />
                  <span>Healthy Specimen</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-sm font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                    Monstera Deliciosa
                  </p>
                  <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">Swiss Cheese Plant</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] text-xs font-bold">
                  {healthStats.avgScore}% Health
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SUMMARY METRIC CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate("/plants")}
          className="rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-5 flex flex-col justify-between shadow-[0_2px_8px_rgba(22,58,45,0.03)] hover:border-[#8EAD9B] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#668074] dark:text-[#B0C9BA]">
              Plant Health
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
              <Activity className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#163A2D] dark:text-[#F1F7F3]">
              {healthStats.avgScore}%
            </p>
            <p className="text-xs text-[#668074] dark:text-[#B0C9BA] mt-1 flex items-center justify-between">
              <span>Average collection vitality</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#176B4D]" />
            </p>
          </div>
        </div>

        <div
          onClick={() => navigate("/plants")}
          className="rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-5 flex flex-col justify-between shadow-[0_2px_8px_rgba(22,58,45,0.03)] hover:border-[#8EAD9B] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#668074] dark:text-[#B0C9BA]">
              Plants Monitored
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
              <Leaf className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#163A2D] dark:text-[#F1F7F3]">
              {healthStats.totalPlants}
            </p>
            <p className="text-xs text-[#668074] dark:text-[#B0C9BA] mt-1 flex items-center justify-between">
              <span>{healthStats.healthyCount} thriving in collection</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#176B4D]" />
            </p>
          </div>
        </div>

        <div
          onClick={() => navigate("/history")}
          className="rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-5 flex flex-col justify-between shadow-[0_2px_8px_rgba(22,58,45,0.03)] hover:border-[#8EAD9B] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#668074] dark:text-[#B0C9BA]">
              Recent Analyses
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
              <ScanLine className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#163A2D] dark:text-[#F1F7F3]">
              {analyses.length > 0 ? analyses.length : 18}
            </p>
            <p className="text-xs text-[#668074] dark:text-[#B0C9BA] mt-1 flex items-center justify-between">
              <span>AI visual diagnostics</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#176B4D]" />
            </p>
          </div>
        </div>

        <div
          onClick={() => navigate("/analyze?mode=disease")}
          className="rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-5 flex flex-col justify-between shadow-[0_2px_8px_rgba(22,58,45,0.03)] hover:border-[#C96F62]/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#668074] dark:text-[#B0C9BA]">
              Plants Needing Attention
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F8E9E5] dark:bg-[#2A1612] text-[#C96F62] flex items-center justify-center">
              <Stethoscope className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#163A2D] dark:text-[#F1F7F3]">
              {healthStats.attentionCount + healthStats.criticalCount}
            </p>
            <p className="text-xs text-[#668074] dark:text-[#B0C9BA] mt-1 flex items-center justify-between">
              <span>Check symptoms & care</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#C96F62]" />
            </p>
          </div>
        </div>
      </section>

      {/* 3. PLANT HEALTH SUMMARY + AI INSIGHT */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        <div
          id="plant-health-overview"
          className="lg:col-span-7 bg-white dark:bg-[#173126] rounded-[22px] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#DCE7DF] dark:border-[#244737]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                  Plant Health Summary
                </h3>
                <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                  Overall collection wellness overview
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/plants")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer"
            >
              <span>View All ({healthStats.totalPlants})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center py-5">
            <div className="sm:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-[#E4F0E7] dark:text-[#1D3B2D]"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    stroke="#176B4D"
                    strokeWidth="6.5"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - healthStats.avgScore / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-display text-2xl font-extrabold text-[#163A2D] dark:text-[#F1F7F3]">
                    {healthStats.avgScore}%
                  </span>
                  <span className="text-[10px] text-[#668074] dark:text-[#B0C9BA] mt-1 uppercase font-semibold">
                    Health Score
                  </span>
                </div>
              </div>
            </div>

            <div className="sm:col-span-7 space-y-2.5">
              <div className="px-3.5 py-2.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2D8A62] shrink-0" />
                  <span className="text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
                    Healthy & Thriving
                  </span>
                </div>
                <span className="text-xs font-bold text-[#176B4D] dark:text-[#8EAD9B]">
                  {healthStats.healthyCount} / {healthStats.totalPlants}
                </span>
              </div>

              <div className="px-3.5 py-2.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C98A4A] shrink-0" />
                  <span className="text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
                    Needs Care
                  </span>
                </div>
                <span className="text-xs font-bold text-[#C98A4A]">
                  {healthStats.attentionCount} / {healthStats.totalPlants}
                </span>
              </div>

              <div className="px-3.5 py-2.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C96F62] shrink-0" />
                  <span className="text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
                    Disease Detected
                  </span>
                </div>
                <span className="text-xs font-bold text-[#C96F62]">
                  {healthStats.criticalCount} / {healthStats.totalPlants}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-[22px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
            <div className="flex items-center gap-3">
              <img
                src={REAL_PLANT_IMAGES.monstera}
                alt="Monstera Deliciosa care insight"
                referrerPolicy="no-referrer"
                onError={(e) => handlePlantImageError(e, "Monstera Deliciosa")}
                className="w-11 h-11 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0"
              />
              <div>
                <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                  Daily Care Insight
                </h3>
                <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                  Monstera Deliciosa · Seasonal Tip
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F0F6F1] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] border-l-4 border-l-[#176B4D]">
            <blockquote className="font-sans text-xs sm:text-sm text-[#163A2D] dark:text-[#F1F7F3] leading-relaxed italic">
              “Your Monstera is thriving. Rotate it a quarter turn this week to
              encourage balanced foliar growth toward the light.”
            </blockquote>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#DCE7DF] dark:border-[#244737] text-xs">
            <span className="flex items-center gap-1.5 text-[#668074] dark:text-[#B0C9BA] font-medium">
              <Sun className="w-4 h-4 text-[#C98A4A]" />
              Bright indirect morning light
            </span>
            <button
              type="button"
              onClick={handleListenInsight}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F6F9F5] dark:bg-[#12281E] text-[#163A2D] dark:text-[#F1F7F3] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer"
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
                  <span>Listen</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 4. PLANTS NEEDING ATTENTION */}
      <section className="bg-white dark:bg-[#173126] rounded-[22px] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DCE7DF] dark:border-[#244737]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F8E9E5] dark:bg-[#2A1612] border border-[#C96F62]/30 text-[#C96F62] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-[#C96F62]" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                Plants Needing Attention
              </h3>
              <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                Plants showing visible leaf symptoms or needing care adjustments
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/analyze?mode=disease")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer"
          >
            <span>Check Plant Disease</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {attentionPlants.map((plant) => (
            <div
              key={plant.id}
              className="p-4 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
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
                  className="w-14 h-14 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display text-sm font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                      {plant.plantName}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F8E9E5] text-[#C96F62]">
                      {plant.latestDisease || "Early Blight"}
                    </span>
                  </div>
                  <p className="text-xs text-[#668074] dark:text-[#B0C9BA] italic mt-0.5">
                    {plant.scientificName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate(`/analyze?mode=disease&plantId=${plant.id}`)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#12563D] cursor-pointer"
                >
                  Diagnose
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/plants/${plant.id}`)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. MONITORED PLANTS & RECENT ANALYSES */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Monitored Plants Cards */}
        <div className="lg:col-span-7 bg-white dark:bg-[#173126] rounded-[22px] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)] space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
                <Sprout className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                  Monitored Plants
                </h3>
                <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                  Active specimens in your botanical collection
                </p>
              </div>
            </div>
            <Link
              to="/plants"
              className="text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] hover:underline flex items-center gap-1"
            >
              <span>All plants</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {(plants.length > 0
              ? plants.slice(0, 4)
              : [
                  {
                    id: "671f9b20c4d8a912e4560104",
                    plantName: "Monstera Deliciosa",
                    scientificName: "Monstera deliciosa",
                    location: "Living Room East Window",
                    imageUrl: REAL_PLANT_IMAGES.monstera,
                    latestHealthScore: 94,
                  },
                  {
                    id: "671f9b20c4d8a912e4560102",
                    plantName: "Garden Rose",
                    scientificName: "Rosa × hybrida",
                    location: "South Courtyard",
                    imageUrl: REAL_PLANT_IMAGES.rose,
                    latestHealthScore: 96,
                  },
                  {
                    id: "671f9b20c4d8a912e4560105",
                    plantName: "Fiddle Leaf Fig",
                    scientificName: "Ficus lyrata",
                    location: "Sunroom Corner",
                    imageUrl: REAL_PLANT_IMAGES.fiddleLeafFig,
                    latestHealthScore: 93,
                  },
                  {
                    id: "671f9b20c4d8a912e4560106",
                    plantName: "Peace Lily",
                    scientificName: "Spathiphyllum wallisii",
                    location: "Study Desk North Window",
                    imageUrl: REAL_PLANT_IMAGES.peaceLily,
                    latestHealthScore: 95,
                  },
                ]
            ).map((plant) => {
              const score = plant.latestHealthScore ?? 92;
              return (
                <div
                  key={plant.id}
                  onClick={() => navigate(`/plants/${plant.id}`)}
                  className="group p-3 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] hover:border-[#8EAD9B] flex items-center gap-3.5 cursor-pointer transition-all"
                >
                  <img
                    src={resolveRealisticPlantImage(
                      plant.imageUrl,
                      plant.plantName,
                      plant.scientificName
                    )}
                    alt={`${plant.plantName} (${plant.scientificName})`}
                    referrerPolicy="no-referrer"
                    onError={(e) =>
                      handlePlantImageError(e, plant.plantName, plant.scientificName)
                    }
                    className="w-14 h-14 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display text-xs sm:text-sm font-bold text-[#163A2D] dark:text-[#F1F7F3] truncate">
                        {plant.plantName}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          score >= 85
                            ? "bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B]"
                            : "bg-[#F8E9E5] text-[#C96F62]"
                        }`}
                      >
                        {score}%
                      </span>
                    </div>
                    <p className="text-[11px] italic text-[#668074] dark:text-[#B0C9BA] truncate">
                      {plant.scientificName}
                    </p>
                    <p className="text-[11px] text-[#668074] dark:text-[#B0C9BA] truncate mt-0.5">
                      {plant.location || "Home Garden"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Analyses Cards */}
        <div className="lg:col-span-5 bg-white dark:bg-[#173126] rounded-[22px] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                    Recent Analyses
                  </h3>
                  <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                    Latest diagnostic scans & species checks
                  </p>
                </div>
              </div>
              <Link
                to="/history"
                className="text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] hover:underline flex items-center gap-1"
              >
                <span>History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {(analyses.length > 0
                ? analyses.slice(0, 3)
                : [
                    {
                      id: "671f9b20c4d8a912e4560201",
                      plant_name: "Tomato",
                      scientific_name: "Solanum lycopersicum",
                      disease_name: "Early Blight",
                      health_score: 78,
                      overall_status: "Moderate Stress",
                      image_path: REAL_PLANT_IMAGES.tomato,
                    },
                    {
                      id: "671f9b20c4d8a912e4560202",
                      plant_name: "Garden Rose",
                      scientific_name: "Rosa × hybrida",
                      disease_name: "Healthy",
                      health_score: 96,
                      overall_status: "Healthy",
                      image_path: REAL_PLANT_IMAGES.rose,
                    },
                    {
                      id: "671f9b20c4d8a912e4560203",
                      plant_name: "Chilli Pepper",
                      scientific_name: "Capsicum annuum",
                      disease_name: "Interveinal Chlorosis",
                      health_score: 76,
                      overall_status: "Mild Stress",
                      image_path: REAL_PLANT_IMAGES.chilli,
                    },
                  ]
              ).map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => navigate(`/results/${scan.id}`)}
                  className="p-3 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] hover:border-[#8EAD9B] flex items-center justify-between gap-3 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={resolveRealisticPlantImage(
                        scan.image_path,
                        scan.plant_name,
                        scan.scientific_name,
                        scan.disease_name
                      )}
                      alt={`${scan.plant_name} — ${scan.disease_name}`}
                      referrerPolicy="no-referrer"
                      onError={(e) =>
                        handlePlantImageError(e, scan.plant_name, scan.scientific_name)
                      }
                      className="w-12 h-12 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3] truncate">
                        {scan.plant_name}
                      </p>
                      <p className="text-[11px] text-[#668074] dark:text-[#B0C9BA] truncate">
                        {scan.disease_name}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ${
                      scan.overall_status?.toLowerCase() === "healthy"
                        ? "bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B]"
                        : "bg-[#F8E9E5] text-[#C96F62]"
                    }`}
                  >
                    {scan.health_score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. QUICK PLANT PHOTO UPLOAD + CARE REMINDERS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 bg-white dark:bg-[#173126] rounded-[22px] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
          <div className="flex items-center justify-between pb-4 border-b border-[#DCE7DF] dark:border-[#244737]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                  Care Recommendations & Tasks
                </h3>
                <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                  Personalized care schedule for your plants
                </p>
              </div>
            </div>
            <Link
              to="/care"
              className="text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] hover:underline flex items-center gap-1"
            >
              View all care plans <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                onClick={() => handleToggleReminder(rem.id)}
                className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                      rem.completed
                        ? "bg-[#176B4D] text-white"
                        : "border-2 border-[#DCE7DF] dark:border-[#244737] bg-white dark:bg-[#173126]"
                    }`}
                  >
                    {rem.completed && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <img
                    src={resolveRealisticPlantImage(null, rem.plantName)}
                    alt={`${rem.plantName} care reminder`}
                    referrerPolicy="no-referrer"
                    onError={(e) => handlePlantImageError(e, rem.plantName)}
                    className="w-10 h-10 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0"
                  />
                  <div className="min-w-0">
                    <span
                      className={`text-xs font-bold block truncate ${
                        rem.completed
                          ? "line-through text-[#668074]"
                          : "text-[#163A2D] dark:text-[#F1F7F3]"
                      }`}
                    >
                      {rem.plantName}
                    </span>
                    <span className="text-xs text-[#668074] dark:text-[#B0C9BA] block truncate">
                      {rem.task}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium text-[#668074] dark:text-[#B0C9BA] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] px-2.5 py-1 rounded-lg shrink-0">
                  {rem.dueDate}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden lg:col-span-5 rounded-[22px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)] flex flex-col justify-between">
          {/* Decorative Forest Green Botanical Leaf Background */}
          <svg
            viewBox="0 0 360 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="pointer-events-none select-none absolute inset-0 w-full h-full opacity-90 dark:opacity-55 z-0"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="quickLeafForestGrad1" x1="365" y1="-10" x2="255" y2="135" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#176B4D" stopOpacity="0.38" />
                <stop offset="60%" stopColor="#2D8A62" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#176B4D" stopOpacity="0.12" />
              </linearGradient>
              <linearGradient id="quickLeafForestGrad2" x1="365" y1="55" x2="295" y2="160" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#163A2D" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#176B4D" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="quickLeafForestGrad3" x1="-10" y1="325" x2="115" y2="245" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#176B4D" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#2D8A62" stopOpacity="0.14" />
              </linearGradient>
            </defs>

            {/* Top-right primary forest green leaf & veins */}
            <path
              d="M365 -10 C295 8, 245 55, 265 130 C315 110, 350 55, 365 -10 Z"
              fill="url(#quickLeafForestGrad1)"
            />
            <path
              d="M355 -5 C315 35, 290 75, 265 130"
              stroke="#176B4D"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeOpacity="0.55"
            />
            <path
              d="M312 42 L338 35 M294 68 L325 60 M280 94 L306 88 M312 42 L298 22 M294 68 L280 46"
              stroke="#176B4D"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeOpacity="0.45"
            />
            {/* Secondary overlapping forest green leaf */}
            <path
              d="M365 55 C320 72, 295 105, 310 155 C340 135, 356 98, 365 55 Z"
              fill="url(#quickLeafForestGrad2)"
            />
            <path
              d="M362 60 C338 92, 322 122, 310 155"
              stroke="#163A2D"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeOpacity="0.4"
            />

            {/* Bottom-left forest green leaf silhouette & stem */}
            <path
              d="M-10 325 C25 265, 80 240, 115 280 C70 308, 30 320, -10 325 Z"
              fill="url(#quickLeafForestGrad3)"
            />
            <path
              d="M-5 320 C35 295, 72 286, 115 280"
              stroke="#176B4D"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeOpacity="0.5"
            />
            <path
              d="M35 301 L52 288 M62 292 L80 278 M35 301 L26 286"
              stroke="#176B4D"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeOpacity="0.4"
            />
            <path
              d="M-12 275 C18 240, 58 228, 78 256 C48 272, 16 278, -12 275 Z"
              fill="#176B4D"
              fillOpacity="0.2"
            />
          </svg>

          <div className="relative z-10">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#DCE7DF] dark:border-[#244737]">
              <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                  Quick Plant Analysis
                </h3>
                <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                  Upload a photo to identify or check health
                </p>
              </div>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileProcess(file);
              }}
              className={`mt-4 rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center transition-all ${
                isDragging
                  ? "border-[#176B4D] bg-[#E4F0E7] dark:bg-[#1D3B2D]"
                  : "border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileProcess(f);
                }}
                className="hidden"
              />
              {isUploading ? (
                <div className="py-5 flex flex-col items-center gap-2 text-xs">
                  <Loader2 className="w-8 h-8 animate-spin text-[#176B4D]" />
                  <span className="font-semibold text-sm">Analyzing your plant...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full">
                  <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center mb-3">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] mb-3">
                    Drag and drop a plant photo or browse
                  </p>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs text-white bg-[#176B4D] hover:bg-[#12563D] cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs text-[#163A2D] dark:text-[#F1F7F3] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
                      <span>Camera</span>
                    </button>
                  </div>
                </div>
              )}
              {uploadError && (
                <p className="mt-3 text-xs text-[#C96F62] font-medium">{uploadError}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-[#163A2D]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#173126] rounded-[24px] max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#DCE7DF] dark:border-[#244737]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE7DF] dark:border-[#244737]">
              <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                Camera Capture
              </h3>
              <button type="button" onClick={stopCamera} className="p-1 text-[#668074]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-4/3 bg-black rounded-2xl overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#668074]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#176B4D] cursor-pointer"
              >
                Capture & Analyze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

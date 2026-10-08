import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Camera,
  Image as ImageIcon,
  Clipboard,
  RotateCcw,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Leaf,
  ScanLine,
  Check,
  X,
  Sprout,
  Stethoscope,
  Upload,
  Sun,
  Droplets,
  Layers,
  Thermometer,
  Bookmark,
  Share2,
} from "lucide-react";
import { LoadingAnalysis } from "../components/LoadingAnalysis";
import { AudioSpeechButton } from "../components/AudioSpeechButton";
import { plantService, DiagnosticResult } from "../services/plantService";
import { useLanguage } from "../context/LanguageContext";
import {
  validateImageFile,
  optimizeImageForAnalysis,
} from "../utils/imageOptimizer";
import {
  REAL_PLANT_IMAGES,
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";
import {
  sharePlantDiagnosis,
  triggerHaptic,
  getPlatformInfo,
} from "../utils/platform";

interface SamplePreset {
  id: "tomato" | "rose" | "chilli" | "monstera";
  label: string;
  scientificName: string;
  imageUrl: string;
}

const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: "tomato",
    label: "Tomato Leaf",
    scientificName: "Solanum lycopersicum",
    imageUrl: REAL_PLANT_IMAGES.tomato,
  },
  {
    id: "rose",
    label: "Rose Leaf",
    scientificName: "Rosa × hybrida",
    imageUrl: REAL_PLANT_IMAGES.rose,
  },
  {
    id: "chilli",
    label: "Chilli Leaf",
    scientificName: "Capsicum annuum",
    imageUrl: REAL_PLANT_IMAGES.chilli,
  },
  {
    id: "monstera",
    label: "Monstera Leaf",
    scientificName: "Monstera deliciosa",
    imageUrl: REAL_PLANT_IMAGES.monsteraSpot,
  },
];

const PIPELINE_STEPS = [
  "Image processed",
  "Plant identified",
  "Disease analysis",
  "Nutrition analysis",
  "Health analysis",
];

export const AnalyzePlant: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawMode = searchParams.get("mode") || "all";
  const activeTab: "all" | "identify" | "disease" =
    rawMode === "identify" ? "identify" : rawMode === "disease" ? "disease" : "all";
  const isIdentifyMode = activeTab === "identify";

  const initialPlantId = searchParams.get("plantId") || "";
  const presetParam = searchParams.get("preset") || "";
  const { language, t, tr, localizeDiagnosticResult } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [recentAnalyses, setRecentAnalyses] = useState<DiagnosticResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<SamplePreset | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [plantHint, setPlantHint] = useState<string>("");

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inlineResult, setInlineResult] = useState<DiagnosticResult | null>(null);
  const [savedToPlants, setSavedToPlants] = useState<boolean>(false);

  useEffect(() => {
    plantService
      .getAnalysisHistory()
      .then((history) => {
        setRecentAnalyses(history.slice(0, 3));
      })
      .catch(() => {});

    if (presetParam) {
      const found = SAMPLE_PRESETS.find((p) => p.id === presetParam);
      if (found) {
        setSelectedPreset(found);
        setPreviewUrl(found.imageUrl);
        setPlantHint(found.label);
      }
    }
  }, [presetParam]);

  useEffect(() => {
    setSavedToPlants(false);
    setErrorMessage(null);
  }, [activeTab]);

  const handleTabSelect = (tab: "all" | "identify" | "disease") => {
    triggerHaptic("light");
    if (tab === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ mode: tab });
    }
  };

  const validateAndAcceptFile = useCallback((file: File) => {
    setValidationError(null);
    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setValidationError(
        validation.error || "Please upload a valid image (JPG, PNG, or WEBP under 10 MB)."
      );
      return;
    }
    triggerHaptic("light");
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    setSelectedPreset(null);
    setInlineResult(null);
    setSavedToPlants(false);
  }, []);

  const handleSelectPreset = (preset: SamplePreset) => {
    triggerHaptic("light");
    setSelectedFile(null);
    setSelectedPreset(preset);
    setPreviewUrl(preset.imageUrl);
    setPlantHint(preset.label);
    setValidationError(null);
    setErrorMessage(null);
    setInlineResult(null);
    setSavedToPlants(false);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setSelectedPreset(null);
    setPreviewUrl(null);
    setPlantHint("");
    setSelectedSymptoms([]);
    setErrorMessage(null);
    setInlineResult(null);
    setSavedToPlants(false);
  };

  const startCamera = useCallback(async () => {
    setCameraError(null);
    const platform = getPlatformInfo();

    // On mobile devices, fallback to native camera input directly if getUserMedia is restricted or fails
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
      if (mobileCameraInputRef.current) {
        mobileCameraInputRef.current.click();
        return;
      }
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      // Permission denied or blocked in iframe: provide native device file/camera fallback
      if (platform.isMobile && mobileCameraInputRef.current) {
        mobileCameraInputRef.current.click();
      } else {
        setCameraError(
          "Camera access denied or unavailable. Please use the device camera or upload an image."
        );
      }
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const capturedFile = new File([blob], `plant_photo_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          stopCamera();
          validateAndAcceptFile(capturedFile);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const handleClipboardPaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith("image/"));
          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File([blob], `clipboard_${Date.now()}.png`, { type: imageType });
            validateAndAcceptFile(file);
            return;
          }
        }
      }
      setValidationError(
        "No image found in clipboard. Copy an image or screenshot first, then paste."
      );
    } catch {
      setValidationError(
        "Clipboard access requires permission. Press ⌘V / Ctrl+V to paste directly."
      );
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            validateAndAcceptFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [validateAndAcceptFile]);

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !selectedPreset) {
      setErrorMessage("Please upload a plant photo or pick a sample leaf below.");
      return;
    }

    if (selectedFile) {
      const validation = validateImageFile(selectedFile);
      if (!validation.valid) {
        setErrorMessage(
          validation.error || "Please upload an image smaller than 10 MB in JPG, PNG, or WEBP format."
        );
        return;
      }
    }

    setErrorMessage(null);
    setIsAnalyzing(true);
    setSavedToPlants(false);

    try {
      const formData = new FormData();
      if (selectedFile) {
        const fileToUpload = await optimizeImageForAnalysis(selectedFile);
        formData.append("image", fileToUpload);
        formData.append("mime_type", fileToUpload.type || "image/jpeg");
      } else if (selectedPreset) {
        formData.append("specimenPreset", selectedPreset.id);
      }

      if (initialPlantId) formData.append("plant_id", initialPlantId);

      let contextHint = plantHint.trim();
      if (selectedSymptoms.length > 0) {
        contextHint += ` [Observed: ${selectedSymptoms.join(", ")}]`;
      }
      if (contextHint.trim()) formData.append("plant_hint", contextHint.trim());
      formData.append("language", language);

      const result = await plantService.analyzePlantImage(formData);

      if (!result || !result.id) {
        throw new Error("Unable to analyze this image. Please try again.");
      }

      setInlineResult(result);
      setIsAnalyzing(false);

      plantService
        .getAnalysisHistory()
        .then((history) => setRecentAnalyses(history.slice(0, 3)))
        .catch(() => {});

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(
        rawMsg || "Unable to analyze this image. Please ensure the image is clear and try again."
      );
      setIsAnalyzing(false);
    }
  };

  const handleSaveIdentifiedPlant = async () => {
    if (!inlineResult || savedToPlants) return;
    try {
      await plantService.createPlant({
        plantName: inlineResult.plant_name || "Identified Plant",
        scientificName: inlineResult.scientific_name || "Botanical specimen",
        category: inlineResult.family || "Botanical Specimen",
        location: "Home Garden",
        imageUrl: inlineResult.image_path || previewUrl || undefined,
        latestHealthScore: inlineResult.health_score || 92,
        latestStatus: inlineResult.overall_status || "Healthy",
        latestDisease: inlineResult.disease_name || "Healthy",
      });
      setSavedToPlants(true);
    } catch (err) {
      console.error("Error saving plant:", err);
    }
  };

  const symptomOptions = [
    "Brown spots",
    "Yellowing",
    "Leaf curling",
    "Powdery coating",
    "Dark lesions",
    "Scorched edges",
  ];

  const hasImageReady = Boolean(previewUrl || selectedFile || selectedPreset);
  const localizedInline = inlineResult ? localizeDiagnosticResult(inlineResult) : null;
  const inlineNarration = localizedInline
    ? language === "ta"
      ? `${localizedInline.plant_name}. ஒட்டுமொத்த நிலை: ${localizedInline.overall_status}. ஆரோக்கிய மதிப்பெண்: ${localizedInline.health_score} சதவீதம். நோய் கண்டறிதல்: ${localizedInline.disease_name}. ${
          localizedInline.treatment_recommendations?.[0]
            ? `பரிந்துரை: ${localizedInline.treatment_recommendations[0]}`
            : ""
        }`
      : `${localizedInline.plant_name}. Status: ${localizedInline.overall_status}. Health score: ${localizedInline.health_score} percent. Diagnosis: ${localizedInline.disease_name}.`
    : "";

  return (
    <div className="space-y-6 pb-16 max-w-[1280px] mx-auto font-sans antialiased text-[#163A2D] dark:text-[#F1F7F3] transition-colors duration-200">
      {/* 1. LARGE ROUNDED TOP CARD */}
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-white via-[#F2F8F4] to-[#DFEFE6] dark:from-[#173126] dark:via-[#142C22] dark:to-[#0F241B] border border-[#C6DDD0] dark:border-[#2A5240] p-6 sm:p-8 shadow-[0_4px_16px_rgba(23,107,77,0.08)] transition-colors duration-200">
        {/* Minimalist Tree-Theme Background Artwork with Forest Green Shade */}
        <svg
          viewBox="0 0 1200 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="pointer-events-none select-none absolute inset-0 w-full h-full opacity-95 dark:opacity-60 z-0"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="analyzeHeroTreeCanopy1" x1="880" y1="10" x2="880" y2="230" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#176B4D" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#2D8A62" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#176B4D" stopOpacity="0.06" />
            </linearGradient>
            <linearGradient id="analyzeHeroTreeCanopy2" x1="1180" y1="-10" x2="1020" y2="200" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#163A2D" stopOpacity="0.38" />
              <stop offset="55%" stopColor="#176B4D" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#2D8A62" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="analyzeHeroGroundShade" x1="600" y1="190" x2="600" y2="260" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#176B4D" stopOpacity="0" />
              <stop offset="100%" stopColor="#176B4D" stopOpacity="0.14" />
            </linearGradient>
          </defs>

          <path
            d="M0 225 Q 400 212, 800 222 T 1200 214 L 1200 260 L 0 260 Z"
            fill="url(#analyzeHeroGroundShade)"
          />
          <path
            d="M0 245 Q 400 234, 800 242 T 1200 236"
            stroke="#176B4D"
            strokeWidth="1.4"
            strokeOpacity="0.32"
          />

          {/* Minimalist tree silhouette on right */}
          <circle cx="885" cy="115" r="78" fill="url(#analyzeHeroTreeCanopy1)" />
          <circle cx="935" cy="140" r="50" fill="url(#analyzeHeroTreeCanopy1)" />
          <circle cx="838" cy="145" r="46" fill="url(#analyzeHeroTreeCanopy1)" />
          <path
            d="M885 242 V 120 M885 188 C866 168, 848 152, 836 132 M885 165 C906 148, 922 134, 935 116 M885 142 C873 124, 864 110, 858 94"
            stroke="#163A2D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.45"
          />
          <path
            d="M1210 20 C1140 34, 1080 65, 1025 112 C1000 132, 976 146, 950 156"
            stroke="#163A2D"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeOpacity="0.46"
          />
          <path
            d="M1205 -10 C1130 10, 1085 58, 1105 128 C1155 106, 1190 54, 1205 -10 Z"
            fill="url(#analyzeHeroTreeCanopy2)"
          />
        </svg>

        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div
              role="tablist"
              aria-label="Analysis mode"
              className="inline-flex flex-wrap items-center gap-1 p-1.5 rounded-2xl bg-[#F0F6F1] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "all"}
                onClick={() => handleTabSelect("all")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-[13px] transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-[#176B4D] text-white font-semibold shadow-2xs"
                    : "text-[#163A2D] dark:text-[#B0C9BA] font-medium hover:bg-[#E4F0E7] dark:hover:bg-[#1D3B2D]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{tr("All-in-One")}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "identify"}
                onClick={() => handleTabSelect("identify")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-[13px] transition-all cursor-pointer ${
                  activeTab === "identify"
                    ? "bg-[#176B4D] text-white font-semibold shadow-2xs"
                    : "text-[#163A2D] dark:text-[#B0C9BA] font-medium hover:bg-[#E4F0E7] dark:hover:bg-[#1D3B2D]"
                }`}
              >
                <Sprout className="w-3.5 h-3.5 shrink-0" />
                <span>{t.navIdentify}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "disease"}
                onClick={() => handleTabSelect("disease")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-[13px] transition-all cursor-pointer ${
                  activeTab === "disease"
                    ? "bg-[#176B4D] text-white font-semibold shadow-2xs"
                    : "text-[#163A2D] dark:text-[#B0C9BA] font-medium hover:bg-[#E4F0E7] dark:hover:bg-[#1D3B2D]"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                <span>{t.navDisease}</span>
              </button>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B]">
              <span className="w-2 h-2 rounded-full bg-[#2D8A62] shrink-0" />
              <span>{tr("AI Diagnostic Engine Ready")}</span>
            </div>
          </div>

          <div className="space-y-2 max-w-3xl">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#163A2D] dark:text-[#F1F7F3] tracking-tight leading-tight">
              {tr("Plant Health & Disease Analysis")}
            </h1>
            <p className="text-sm sm:text-base text-[#668074] dark:text-[#B0C9BA] leading-relaxed">
              {tr(
                "Comprehensive foliar diagnostics: identify species, diagnose health problems, and get personalized care recommendations."
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 2. PROCESS SECTION: 3 CLEAN STEP CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-5 shadow-[0_2px_8px_rgba(22,58,45,0.03)] flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#176B4D] dark:text-[#8EAD9B] block">
              {tr("STEP 01")}
            </span>
            <h2 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3] mt-0.5">
              {tr("Upload Photo")}
            </h2>
            <p className="text-xs text-[#668074] dark:text-[#B0C9BA] mt-0.5">
              {tr("Select a clear leaf or plant image")}
            </p>
          </div>
        </div>

        <div className="rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-5 shadow-[0_2px_8px_rgba(22,58,45,0.03)] flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#176B4D] dark:text-[#8EAD9B] block">
              {tr("STEP 02")}
            </span>
            <h2 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3] mt-0.5">
              {tr("AI Analysis")}
            </h2>
            <p className="text-xs text-[#668074] dark:text-[#B0C9BA] mt-0.5">
              {tr("Identify species & detect disease")}
            </p>
          </div>
        </div>

        <div className="rounded-[20px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-5 shadow-[0_2px_8px_rgba(22,58,45,0.03)] flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center shrink-0">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#176B4D] dark:text-[#8EAD9B] block">
              {tr("STEP 03")}
            </span>
            <h2 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3] mt-0.5">
              {tr("Results & Care")}
            </h2>
            <p className="text-xs text-[#668074] dark:text-[#B0C9BA] mt-0.5">
              {tr("Get diagnosis & care recommendations")}
            </p>
          </div>
        </div>
      </section>

      {/* 3. MAIN WORKSPACE / ANALYSIS CARD */}
      {isAnalyzing ? (
        <LoadingAnalysis />
      ) : (
        <form onSubmit={handleAnalyze} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Image Upload / Plant Preview Card */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-white dark:bg-[#173126] rounded-[24px] p-6 sm:p-7 border border-[#DCE7DF] dark:border-[#244737] shadow-[0_2px_10px_rgba(22,58,45,0.04)] space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                      {tr("Upload Plant Photo")}
                    </h2>
                    <p className="text-xs text-[#668074] dark:text-[#B0C9BA] mt-0.5">
                      {tr("Use a clear, well-lit photo of the leaf or plant area.")}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F0F6F1] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] border border-[#DCE7DF] dark:border-[#244737] shrink-0">
                    {activeTab === "identify"
                      ? tr("Species ID")
                      : activeTab === "disease"
                        ? tr("Disease Check")
                        : tr("Full Diagnostics")}
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) validateAndAcceptFile(file);
                  }}
                />

                {/* Cross-platform device camera direct capture */}
                <input
                  ref={mobileCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) validateAndAcceptFile(file);
                  }}
                />

                {!previewUrl && !cameraActive && (
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
                      if (file) validateAndAcceptFile(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 p-8 sm:p-10 text-center cursor-pointer flex flex-col items-center justify-center ${
                      isDragging
                        ? "border-[#176B4D] bg-[#E4F0E7] dark:bg-[#1D3B2D]"
                        : "border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] hover:border-[#8EAD9B]"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center shadow-2xs mb-3">
                      <Leaf className="w-6 h-6" />
                    </div>
                    <p className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                      {tr("Drop your plant image here")}
                    </p>
                    <p className="text-xs text-[#668074] dark:text-[#B0C9BA] mt-0.5">
                      {tr("or browse from your device (JPG, PNG, WEBP up to 10 MB)")}
                    </p>

                    <div
                      className="flex flex-wrap items-center justify-center gap-2.5 mt-5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#12563D] rounded-xl shadow-2xs cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{tr("Browse Image")}</span>
                      </button>

                      <button
                        type="button"
                        onClick={startCamera}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-xl cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B] shrink-0" />
                        <span>{tr("Use Camera")}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClipboardPaste}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#668074] dark:text-[#B0C9BA] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-xl cursor-pointer"
                      >
                        <Clipboard className="w-3.5 h-3.5 shrink-0" />
                        <span>{tr("Paste")}</span>
                      </button>
                    </div>
                  </div>
                )}

                {cameraActive && (
                  <div className="relative overflow-hidden bg-[#163A2D] rounded-2xl p-4 space-y-3 text-white">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#8EAD9B] flex items-center gap-1.5">
                        <ScanLine className="w-4 h-4 animate-pulse" />
                        {tr("Camera Active")}
                      </span>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="text-white/80 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" /> {tr("Close")}
                      </button>
                    </div>
                    <div className="relative aspect-4/3 max-h-[340px] rounded-xl overflow-hidden bg-black mx-auto">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex justify-center pt-1">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#176B4D] rounded-xl cursor-pointer"
                      >
                        <Camera className="w-4 h-4" /> {tr("Capture Photo")}
                      </button>
                    </div>
                  </div>
                )}

                {previewUrl && !cameraActive && (
                  <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] p-2.5 flex items-center justify-center max-h-[360px]">
                      <img
                        src={previewUrl}
                        alt={
                          selectedFile
                            ? `Uploaded plant image: ${selectedFile.name}`
                            : selectedPreset
                              ? `${selectedPreset.label} (${selectedPreset.scientificName})`
                              : "Selected plant preview"
                        }
                        referrerPolicy="no-referrer"
                        onError={(e) =>
                          handlePlantImageError(
                            e,
                            selectedPreset?.label,
                            selectedPreset?.scientificName
                          )
                        }
                        className="max-h-[330px] w-full sm:w-auto object-contain rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={handleClear}
                        className="absolute top-4 right-4 p-2 rounded-xl bg-white/95 dark:bg-[#173126]/95 text-[#163A2D] dark:text-[#F1F7F3] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer"
                        title="Change image"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                      <div>
                        <p className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3] truncate max-w-xs">
                          {selectedFile
                            ? selectedFile.name
                            : selectedPreset
                              ? tr(selectedPreset.label)
                              : tr("Plant photo")}
                        </p>
                        <p className="text-[11px] text-[#668074] dark:text-[#B0C9BA]">
                          {tr("Image ready for AI diagnostic analysis")}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handleClear}
                          className="px-3 py-2 text-xs font-medium text-[#668074] dark:text-[#B0C9BA] rounded-xl cursor-pointer"
                        >
                          {tr("Change")}
                        </button>
                        <button
                          type="submit"
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#176B4D] hover:bg-[#12563D] rounded-xl cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          <span>{tr("Analyze Plant Health")}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {(validationError || cameraError) && (
                  <div className="p-3 rounded-xl bg-[#FBECE9] dark:bg-[#2A1612] border border-[#C96F62]/30 text-xs text-[#C96F62] flex items-center justify-between gap-2">
                    <span>{tr(validationError || cameraError || "")}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setValidationError(null);
                        setCameraError(null);
                      }}
                      className="text-xs font-semibold underline cursor-pointer shrink-0"
                    >
                      {tr("Dismiss")}
                    </button>
                  </div>
                )}

                {/* Sample Images Section */}
                <div className="space-y-3 pt-3 border-t border-[#DCE7DF] dark:border-[#244737]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3] uppercase tracking-wider">
                      {tr("Try a Sample Specimen")}
                    </h3>
                    <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA]">
                      {tr("Click to test instant analysis")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {SAMPLE_PRESETS.map((preset) => {
                      const isSelected = selectedPreset?.id === preset.id && !selectedFile;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`group text-left rounded-2xl border p-2.5 transition-all cursor-pointer overflow-hidden ${
                            isSelected
                              ? "border-[#176B4D] bg-[#E4F0E7] dark:bg-[#1D3B2D]"
                              : "border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E]"
                          }`}
                        >
                          <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-white dark:bg-[#173126] mb-2">
                            <img
                              src={preset.imageUrl}
                              alt={`${preset.label} (${preset.scientificName})`}
                              referrerPolicy="no-referrer"
                              onError={(e) =>
                                handlePlantImageError(e, preset.label, preset.scientificName)
                              }
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 bg-[#176B4D] text-white p-1 rounded-full">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3] truncate">
                            {tr(preset.label)}
                          </p>
                          <p className="text-[10px] italic text-[#668074] dark:text-[#B0C9BA] truncate">
                            {preset.scientificName}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Analysis Card */}
            <div className="lg:col-span-5 space-y-5">
              {localizedInline && inlineResult ? (
                isIdentifyMode ? (
                  <div className="bg-white dark:bg-[#173126] rounded-[24px] p-6 sm:p-7 border border-[#DCE7DF] dark:border-[#244737] shadow-[0_2px_10px_rgba(22,58,45,0.04)] space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#668074] dark:text-[#B0C9BA]">
                        {tr("Species Identified")}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic("light");
                            sharePlantDiagnosis({
                              title: `PlantCare AI: ${localizedInline.plant_name}`,
                              text: `${localizedInline.plant_name} (${localizedInline.scientific_name || ""}) — Identified with ${Math.round(localizedInline.confidence_score * 100)}% confidence.`,
                              url: window.location.origin + `/results/${inlineResult.id}?mode=identify`,
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] bg-[#F0F6F1] dark:bg-[#12281E] hover:bg-[#E4F0E7] border border-[#DCE7DF] dark:border-[#244737] rounded-lg cursor-pointer transition-colors"
                          title={tr("Share")}
                        >
                          <Share2 className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
                          <span className="hidden sm:inline">{tr("Share")}</span>
                        </button>
                        <AudioSpeechButton text={inlineNarration} label={t.listen} size="sm" />
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F5EE] dark:bg-[#1D3B2D] text-[#2D8A62] dark:text-[#8EAD9B] border border-[#DCE7DF] dark:border-[#244737]">
                          {Math.round(localizedInline.confidence_score * 100)}% {tr("Match")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <img
                        src={
                          previewUrl ||
                          resolveRealisticPlantImage(
                            inlineResult.image_path,
                            inlineResult.plant_name,
                            inlineResult.scientific_name
                          )
                        }
                        alt={`Identified plant: ${localizedInline.plant_name}`}
                        referrerPolicy="no-referrer"
                        onError={(e) =>
                          handlePlantImageError(
                            e,
                            inlineResult.plant_name,
                            inlineResult.scientific_name
                          )
                        }
                        className="w-20 h-20 rounded-2xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0 shadow-2xs"
                      />
                      <div className="min-w-0">
                        <h3 className="font-display text-xl sm:text-2xl font-bold text-[#163A2D] dark:text-[#F1F7F3] break-words">
                          {localizedInline.plant_name}
                        </h3>
                        <p className="text-sm italic text-[#668074] dark:text-[#B0C9BA] mt-0.5 truncate">
                          {localizedInline.scientific_name || "Botanical cultivar"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
                        <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA] block">
                          {tr("Botanical Family")}
                        </span>
                        <span className="font-display text-sm font-bold text-[#163A2D] dark:text-[#F1F7F3] mt-0.5 block">
                          {localizedInline.family || "Angiosperms"}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
                        <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA] block">
                          {tr("Plant Health")}
                        </span>
                        <span className="font-display text-sm font-bold text-[#2D8A62] mt-0.5 block">
                          {localizedInline.health_score || 92}% {tr("Vitality")}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <h4 className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                        {tr("Essential Care Guide")}
                      </h4>
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="p-3 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-start gap-2">
                          <Sun className="w-4 h-4 text-[#C98A4A] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block text-[#163A2D] dark:text-[#F1F7F3]">
                              {tr("Sunlight")}
                            </span>
                            <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA]">
                              {tr("Bright indirect light")}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-start gap-2">
                          <Droplets className="w-4 h-4 text-[#176B4D] dark:text-[#8EAD9B] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block text-[#163A2D] dark:text-[#F1F7F3]">
                              {tr("Watering")}
                            </span>
                            <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA]">
                              {tr('When top 2" is dry')}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-start gap-2">
                          <Layers className="w-4 h-4 text-[#2D8A62] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block text-[#163A2D] dark:text-[#F1F7F3]">
                              {tr("Soil Type")}
                            </span>
                            <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA]">
                              {tr("Well-draining mix")}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-start gap-2">
                          <Thermometer className="w-4 h-4 text-[#C96F62] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block text-[#163A2D] dark:text-[#F1F7F3]">
                              {tr("Temperature")}
                            </span>
                            <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA]">
                              {tr("18°C – 27°C ideal")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2.5">
                      <button
                        type="button"
                        onClick={handleSaveIdentifiedPlant}
                        disabled={savedToPlants}
                        className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                          savedToPlants
                            ? "bg-[#E8F5EE] dark:bg-[#1D3B2D] text-[#2D8A62] dark:text-[#8EAD9B] border border-[#DCE7DF] dark:border-[#244737]"
                            : "bg-[#176B4D] hover:bg-[#12563D] text-white"
                        }`}
                      >
                        {savedToPlants ? (
                          <>
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>{tr("Saved to My Plants")}</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5 shrink-0" />
                            <span>{tr("Save to My Plants")}</span>
                          </>
                        )}
                      </button>

                      <Link
                        to={`/results/${inlineResult.id}?mode=identify`}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-[#176B4D] dark:text-[#8EAD9B] bg-[#E4F0E7] dark:bg-[#1D3B2D] rounded-xl"
                      >
                        <span>{tr("View Full Botanical Profile")}</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#173126] rounded-[24px] p-6 sm:p-7 border border-[#DCE7DF] dark:border-[#244737] shadow-[0_2px_10px_rgba(22,58,45,0.04)] space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#668074] dark:text-[#B0C9BA]">
                        {tr("Analysis Result")}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic("light");
                            sharePlantDiagnosis({
                              title: `PlantCare AI: ${localizedInline.plant_name} — ${localizedInline.disease_name}`,
                              text: `${localizedInline.plant_name} — Health Score: ${localizedInline.health_score}%. Diagnosis: ${localizedInline.disease_name}. Status: ${localizedInline.overall_status}.`,
                              url: window.location.origin + `/results/${inlineResult.id}?mode=disease`,
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] bg-[#F0F6F1] dark:bg-[#12281E] hover:bg-[#E4F0E7] border border-[#DCE7DF] dark:border-[#244737] rounded-lg cursor-pointer transition-colors"
                          title={tr("Share")}
                        >
                          <Share2 className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
                          <span className="hidden sm:inline">{tr("Share")}</span>
                        </button>
                        <AudioSpeechButton text={inlineNarration} label={t.listen} size="sm" />
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F5EE] dark:bg-[#1D3B2D] text-[#2D8A62] dark:text-[#8EAD9B] border border-[#DCE7DF] dark:border-[#244737]">
                          {localizedInline.overall_status || tr("Diagnosed")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <img
                        src={
                          previewUrl ||
                          resolveRealisticPlantImage(
                            inlineResult.image_path,
                            inlineResult.plant_name,
                            inlineResult.scientific_name,
                            inlineResult.disease_name
                          )
                        }
                        alt={`Analyzed leaf for ${localizedInline.plant_name} — ${localizedInline.disease_name}`}
                        referrerPolicy="no-referrer"
                        onError={(e) =>
                          handlePlantImageError(
                            e,
                            inlineResult.plant_name,
                            inlineResult.scientific_name
                          )
                        }
                        className="w-20 h-20 rounded-2xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0 shadow-2xs"
                      />
                      <div className="min-w-0">
                        <h3 className="font-display text-lg sm:text-xl font-bold text-[#163A2D] dark:text-[#F1F7F3] break-words">
                          {localizedInline.disease_name}
                        </h3>
                        <p className="text-xs text-[#668074] dark:text-[#B0C9BA] mt-0.5 break-words">
                          {localizedInline.plant_name}{" "}
                          {localizedInline.scientific_name
                            ? `(${localizedInline.scientific_name})`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
                        <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA] block">
                          {t.confidence}
                        </span>
                        <span className="font-display text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3] mt-0.5 block">
                          {Math.round(localizedInline.confidence_score * 100)}%
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]">
                        <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA] block">
                          {tr("Severity")}
                        </span>
                        <span className="font-display text-base sm:text-lg font-bold capitalize text-[#163A2D] dark:text-[#F1F7F3] mt-0.5 block">
                          {localizedInline.severity || tr("None")}
                        </span>
                      </div>
                    </div>

                    {localizedInline.treatment_recommendations &&
                      localizedInline.treatment_recommendations.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-[#DCE7DF] dark:border-[#244737]">
                          <h4 className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                            {tr("Recommended next steps")}
                          </h4>
                          <div className="space-y-2">
                            {localizedInline.treatment_recommendations
                              .slice(0, 3)
                              .map((rec, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-start gap-2.5 text-xs text-[#163A2D] dark:text-[#F1F7F3]"
                                >
                                  <span className="w-5 h-5 rounded-full bg-[#176B4D] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span>{rec}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    <div className="pt-2">
                      <Link
                        to={`/results/${inlineResult.id}?mode=disease`}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-[#176B4D] dark:text-[#8EAD9B] bg-[#E4F0E7] dark:bg-[#1D3B2D] rounded-xl"
                      >
                        <span>{tr("View Full Report")}</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </Link>
                    </div>
                  </div>
                )
              ) : (
                /* ANALYSIS CARD (Matches Reference Screenshot) */
                <div className="relative overflow-hidden bg-white dark:bg-[#173126] rounded-[24px] p-6 sm:p-7 border border-[#DCE7DF] dark:border-[#244737] shadow-[0_2px_10px_rgba(22,58,45,0.04)] space-y-5">
                  <svg
                    viewBox="0 0 420 520"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="pointer-events-none select-none absolute inset-0 w-full h-full opacity-90 dark:opacity-55 z-0"
                    preserveAspectRatio="xMidYMid slice"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="analyzePlantGradTop" x1="425" y1="-10" x2="285" y2="160" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#176B4D" stopOpacity="0.38" />
                        <stop offset="60%" stopColor="#2D8A62" stopOpacity="0.24" />
                        <stop offset="100%" stopColor="#176B4D" stopOpacity="0.1" />
                      </linearGradient>
                      <linearGradient id="analyzePlantGradSecondary" x1="425" y1="65" x2="335" y2="195" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#163A2D" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#176B4D" stopOpacity="0.14" />
                      </linearGradient>
                      <linearGradient id="analyzePlantGradBottom" x1="-10" y1="525" x2="155" y2="375" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#176B4D" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#2D8A62" stopOpacity="0.14" />
                      </linearGradient>
                    </defs>

                    {/* Top-right overhanging botanical plant branch & leaves */}
                    <path
                      d="M425 -10 C345 12, 285 65, 310 155 C365 130, 405 68, 425 -10 Z"
                      fill="url(#analyzePlantGradTop)"
                    />
                    <path
                      d="M415 -5 C365 42, 338 92, 310 155"
                      stroke="#176B4D"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeOpacity="0.55"
                    />
                    <path
                      d="M362 50 L392 42 M342 82 L378 72 M326 112 L356 105 M362 50 L346 26 M342 82 L326 56"
                      stroke="#176B4D"
                      strokeWidth="1.35"
                      strokeLinecap="round"
                      strokeOpacity="0.45"
                    />
                    <path
                      d="M425 65 C372 85, 345 125, 362 182 C395 158, 415 115, 425 65 Z"
                      fill="url(#analyzePlantGradSecondary)"
                    />

                    {/* Bottom-left ascending botanical plant stem & leaves */}
                    <path
                      d="M-10 525 C32 455, 78 405, 138 365"
                      stroke="#176B4D"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeOpacity="0.36"
                    />
                    <path
                      d="M-10 525 C35 445, 98 415, 140 465 C85 500, 35 518, -10 525 Z"
                      fill="url(#analyzePlantGradBottom)"
                    />
                    <path
                      d="M-5 518 C42 488, 88 475, 140 465"
                      stroke="#176B4D"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeOpacity="0.48"
                    />
                    <path
                      d="M45 445 C28 412, 42 378, 76 375 C78 408, 62 432, 45 445 Z"
                      fill="url(#analyzePlantGradTop)"
                    />
                    <path
                      d="M88 402 C112 385, 138 392, 140 416 C116 420, 98 412, 88 402 Z"
                      fill="#176B4D"
                      fillOpacity="0.22"
                    />
                  </svg>

                  <div className="relative z-10 flex items-center gap-3.5 pb-4 border-b border-[#DCE7DF] dark:border-[#244737]">
                    <div className="w-10 h-10 rounded-2xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                        {tr("Analyzing your plant...")}
                      </h3>
                      <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                        {hasImageReady
                          ? tr("Photo selected — click Analyze Plant Health to run checks")
                          : tr("Automated 5-stage botanical diagnostic pipeline")}
                      </p>
                    </div>
                  </div>

                  <ul className="relative z-10 space-y-2.5">
                    {PIPELINE_STEPS.map((stepLabel, idx) => {
                      const stepActive = idx === 0 && hasImageReady;
                      return (
                        <li
                          key={stepLabel}
                          className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl border text-xs transition-colors ${
                            stepActive
                              ? "bg-[#E4F0E7]/70 dark:bg-[#1D3B2D] border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3] font-semibold"
                              : "bg-[#F6F9F5] dark:bg-[#12281E] border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3] font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-[#176B4D] dark:bg-[#2D8A62] text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                            </span>
                            <span className="truncate">{tr(stepLabel)}</span>
                          </div>
                          <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA] shrink-0">
                            {stepActive ? tr("Ready") : tr("Included")}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="relative z-10 pt-3 border-t border-[#DCE7DF] dark:border-[#244737] space-y-2.5">
                    <span className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3] block">
                      {tr("Observed symptoms (optional)")}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {symptomOptions.map((sym) => {
                        const active = selectedSymptoms.includes(sym);
                        return (
                          <button
                            key={sym}
                            type="button"
                            onClick={() => toggleSymptom(sym)}
                            className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer border ${
                              active
                                ? "bg-[#176B4D] text-white border-[#176B4D] font-semibold"
                                : "bg-[#E4F0E7] dark:bg-[#1D3B2D] border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3]"
                            }`}
                          >
                            {tr(sym)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="relative z-10 pt-1">
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#176B4D] hover:bg-[#12563D] transition-all shadow-2xs cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>{tr("Analyze Plant Health")}</span>
                    </button>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-4 rounded-2xl bg-[#FBECE9] dark:bg-[#2A1612] border border-[#C96F62]/40 flex items-start gap-3 text-xs text-[#C96F62]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">{tr("Analysis Notice:")}</strong>
                    <p className="mt-0.5 leading-relaxed">{tr(errorMessage)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      )}

      {/* 4. RECENT PLANT ANALYSES */}
      <section className="bg-white dark:bg-[#173126] rounded-[24px] p-6 sm:p-7 border border-[#DCE7DF] dark:border-[#244737] shadow-[0_2px_10px_rgba(22,58,45,0.03)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#DCE7DF] dark:border-[#244737]">
          <div>
            <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
              {tr("Recent Plant Analyses")}
            </h3>
            <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
              {tr("Previous species identifications and foliar health reports")}
            </p>
          </div>
          <Link
            to="/history"
            className="text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] hover:underline flex items-center gap-1"
          >
            <span>{tr("View history")}</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {recentAnalyses.length > 0 ? (
            recentAnalyses.map((rawItem) => {
              const item = localizeDiagnosticResult(rawItem);
              return (
                <div
                  key={item.id}
                  onClick={() =>
                    navigate(`/results/${item.id}?mode=${isIdentifyMode ? "identify" : "disease"}`)
                  }
                  className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center gap-3 cursor-pointer"
                >
                  <img
                    src={resolveRealisticPlantImage(
                      rawItem.image_path,
                      rawItem.plant_name,
                      rawItem.scientific_name,
                      rawItem.disease_name
                    )}
                    alt={`${item.plant_name} — ${item.disease_name}`}
                    referrerPolicy="no-referrer"
                    onError={(e) =>
                      handlePlantImageError(e, rawItem.plant_name, rawItem.scientific_name)
                    }
                    className="w-12 h-12 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-[#163A2D] dark:text-[#F1F7F3] truncate">
                      {item.plant_name}
                    </h4>
                    <p className="text-[11px] text-[#668074] dark:text-[#B0C9BA] truncate">
                      {item.disease_name}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-6 text-xs text-[#668074] dark:text-[#B0C9BA]">
              {tr("No previous records found. Upload a plant photo above to begin.")}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

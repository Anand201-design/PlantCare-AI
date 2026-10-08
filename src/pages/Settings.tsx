import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Sun,
  Moon,
  Monitor,
  Globe,
  Bell,
  Download,
  CheckCircle2,
  Play,
  AlertCircle,
  Smartphone,
  Laptop,
  LogIn,
  LogOut,
  Database,
  ShieldCheck,
} from "lucide-react";
import { useLanguage, SupportedLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { getPlatformInfo } from "../utils/platform";
import {
  getStoredSpeechSettings,
  saveStoredSpeechSettings,
  SpeechSettings,
  VoiceTonePreset,
  VOICE_TONE_PRESETS,
  tts,
} from "../services/speechService";
import { AudioSpeechButton } from "../components/AudioSpeechButton";

export const Settings: React.FC = () => {
  const { language, setLanguage, t, tr } = useLanguage();
  const { theme, setTheme, density } = useTheme();
  const { user, isAuthenticated, isGuest, logout, openAuthModal, updateProfile } = useAuth();
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const platform = getPlatformInfo();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNameInput, setEditNameInput] = useState(user?.name || "Emily Morgan");
  const [editEmailInput, setEditEmailInput] = useState(user?.email || "emily.morgan@plantcare.ai");

  const [notifyDisease, setNotifyDisease] = useState(true);
  const [notifyCare, setNotifyCare] = useState(true);

  const [speechSettings, setSpeechSettings] = useState<SpeechSettings>(() =>
    getStoredSpeechSettings()
  );
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>(() =>
    tts.getRankedVoicesForLanguage(language)
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [voiceWarning, setVoiceWarning] = useState<string | null>(null);

  React.useEffect(() => {
    setVoiceWarning(null);
    setAvailableVoices(tts.getRankedVoicesForLanguage(language));
    const unsubscribe = tts.onVoicesChanged((voices) => {
      setAvailableVoices(tts.getRankedVoicesForLanguage(language, voices));
      if (language === "ta" && voices.length > 0) {
        const tamilVoice = tts.findTamilVoice(voices);
        if (tamilVoice) {
          setVoiceWarning(null);
        }
      }
    });
    return unsubscribe;
  }, [language]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name: editNameInput, email: editEmailInput });
    setIsEditingProfile(false);
    showToast(tr("Profile updated."));
  };

  const handleUpdateSpeechSettings = (updates: Partial<SpeechSettings>) => {
    const updated = { ...speechSettings, ...updates };
    setSpeechSettings(updated);
    saveStoredSpeechSettings(updated);
    showToast(tr("Voice settings saved."));
  };

  const handleTonePresetChange = (tone: VoiceTonePreset) => {
    const preset = VOICE_TONE_PRESETS[tone];
    handleUpdateSpeechSettings({
      voiceTone: tone,
      speechRate: preset.rate,
      speechPitch: preset.pitch,
      speechVolume: preset.volume,
    });
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setVoiceWarning(null);
    setLanguage(newLang);
  };

  const handleTestSpeech = () => {
    setVoiceWarning(null);
    const sampleText = tts.getSampleText(language);

    tts.speak(sampleText, {
      lang: language,
      rate: speechSettings.speechRate,
      pitch: speechSettings.speechPitch,
      volume: speechSettings.speechVolume,
      onVoiceFallbackWarning: () => {
        if (language === "ta") {
          const fallback = tts.findFallbackVoice();
          const fallbackLabel = fallback ? ` (${fallback.name})` : "";
          setVoiceWarning(
            `தகவல்: இந்த சாதனத்தில் பிரத்யேக தமிழ் (ta-IN) குரல் இல்லை; மாற்றுக் குரல்${fallbackLabel} பயன்படுத்தப்படுகிறது.`
          );
        }
      },
    });
  };

  const handleExportData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      profile: {
        name: user?.name || "Emily Morgan",
        email: user?.email || "emily.morgan@plantcare.ai",
      },
      preferences: { theme, density, language, speechSettings },
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plantcare_settings_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(tr("Preferences exported."));
  };

  const settingsListenText =
    language === "ta"
      ? "அமைப்புகள் மற்றும் விருப்பத்தேர்வுகள். உங்கள் சுயவிவரம், தோற்றம், மொழி மற்றும் குரல் வாசிப்பு வேகத்தை இங்கே நிர்வகிக்கலாம்."
      : "Settings and preferences. Customize your profile, appearance theme, language, and voice reading.";

  return (
    <div className="space-y-7 pb-16 max-w-4xl mx-auto font-sans antialiased text-[#163A2D] dark:text-[#F1F7F3]">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-3.5 rounded-xl bg-[#176B4D] text-white text-xs font-semibold shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
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
              {t.navSettings}
            </span>
          </nav>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#163A2D] dark:text-[#F1F7F3] tracking-tight">
              {tr("Settings & Preferences")}
            </h1>
            <p className="text-sm text-[#668074] dark:text-[#B0C9BA] mt-1">
              {tr(
                "Manage your account profile, light or dark theme, language, voice reading, and notifications."
              )}
            </p>
          </div>
        </div>

        <AudioSpeechButton text={settingsListenText} label={t.listen} />
      </div>

      {/* 1. PROFILE & ACCOUNT */}
      <section className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-6 space-y-5 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                {tr("Profile & Account")}
              </h2>
              <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                {tr("Your personal plant care profile")}
              </p>
            </div>
          </div>

          {!isEditingProfile && (
            <button
              type="button"
              onClick={() => setIsEditingProfile(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] bg-[#E4F0E7] dark:bg-[#1D3B2D] cursor-pointer"
            >
              {tr("Edit Profile")}
            </button>
          )}
        </div>

        {isEditingProfile ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#668074] dark:text-[#B0C9BA] mb-1 font-semibold">
                  {tr("Full Name")}
                </label>
                <input
                  type="text"
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3]"
                />
              </div>
              <div>
                <label className="block text-[#668074] dark:text-[#B0C9BA] mb-1 font-semibold">
                  {tr("Email Address")}
                </label>
                <input
                  type="email"
                  value={editEmailInput}
                  onChange={(e) => setEditEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 rounded-xl text-[#668074] cursor-pointer"
              >
                {tr("Cancel")}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl font-semibold text-white bg-[#176B4D] cursor-pointer"
              >
                {tr("Save Changes")}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] font-bold text-sm flex items-center justify-center border border-[#DCE7DF] dark:border-[#244737] shrink-0">
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "EM"}
              </div>
              <div className="min-w-0">
                <p className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3] truncate">
                  {user?.name || "Emily Morgan"}
                </p>
                <p className="text-xs text-[#668074] dark:text-[#B0C9BA] truncate">
                  {user?.email || "emily.morgan@plantcare.ai"}
                </p>
                <p className="text-[11px] text-[#176B4D] dark:text-[#8EAD9B] font-medium mt-0.5">
                  {user?.role || tr("Botanical Care Specialist")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <button
                    type="button"
                    onClick={() => openAuthModal("login")}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] hover:bg-[#E4F0E7] transition-colors cursor-pointer"
                  >
                    {tr("Switch Account")}
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 hover:bg-red-100 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{tr("Sign Out")}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#176B4D] hover:bg-[#12563D] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{tr("Sign In / Sign Up")}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* CROSS-PLATFORM & APP INSTALLATION */}
      <section className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-6 space-y-5 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                {tr("Cross-Platform & Offline Capabilities")}
              </h2>
              <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                {tr("Device readiness, native PWA install, and local storage")}
              </p>
            </div>
          </div>

          {isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={installApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#176B4D] hover:bg-[#12563D] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{tr("Install Application")}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] space-y-1">
            <span className="text-[#668074] dark:text-[#B0C9BA] block font-medium">
              {tr("Target Platform")}
            </span>
            <p className="font-display text-sm font-bold text-[#163A2D] dark:text-[#F1F7F3] flex items-center gap-1.5">
              {platform.isMobile ? (
                <Smartphone className="w-4 h-4 text-[#176B4D]" />
              ) : (
                <Laptop className="w-4 h-4 text-[#176B4D]" />
              )}
              <span>
                {platform.isIOS
                  ? "iOS (Apple Safari / PWA)"
                  : platform.isAndroid
                    ? "Android (Chrome / TWA)"
                    : "Desktop & Web Application"}
              </span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] space-y-1">
            <span className="text-[#668074] dark:text-[#B0C9BA] block font-medium">
              {tr("Installation Status")}
            </span>
            <p className="font-display text-sm font-bold text-[#163A2D] dark:text-[#F1F7F3] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2D8A62]" />
              <span>
                {isInstalled
                  ? tr("Standalone App (Installed)")
                  : tr("Browser Web App / Ready")}
              </span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] space-y-1">
            <span className="text-[#668074] dark:text-[#B0C9BA] block font-medium">
              {tr("Offline Data Cache")}
            </span>
            <p className="font-display text-sm font-bold text-[#163A2D] dark:text-[#F1F7F3] flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#176B4D]" />
              <span>{tr("Active & Synchronized")}</span>
            </p>
          </div>
        </div>
      </section>

      {/* 2. APPEARANCE & THEME */}
      <section className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-6 space-y-5 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
        <div className="flex items-center gap-2.5 pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
          <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center shrink-0">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
              {tr("Appearance & Theme")}
            </h2>
            <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
              {tr("Choose Light Mode or Dark Mode for PlantCare AI")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
              theme === "light"
                ? "border-[#176B4D] bg-[#E4F0E7] dark:bg-[#1D3B2D]"
                : "border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E]"
            }`}
          >
            <Sun className="w-5 h-5 text-[#C98A4A] shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold block text-[#163A2D] dark:text-[#F1F7F3]">
                {tr("Light Mode")}
              </span>
              <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA]">
                {tr("Fresh botanical daylight")}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
              theme === "dark"
                ? "border-[#176B4D] bg-[#E4F0E7] dark:bg-[#1D3B2D]"
                : "border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E]"
            }`}
          >
            <Moon className="w-5 h-5 text-[#176B4D] dark:text-[#8EAD9B] shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold block text-[#163A2D] dark:text-[#F1F7F3]">
                {tr("Dark Mode")}
              </span>
              <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA]">
                {tr("Deep forest botanical")}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
              theme === "system"
                ? "border-[#176B4D] bg-[#E4F0E7] dark:bg-[#1D3B2D]"
                : "border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E]"
            }`}
          >
            <Monitor className="w-5 h-5 text-[#668074] dark:text-[#B0C9BA] shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold block text-[#163A2D] dark:text-[#F1F7F3]">
                {tr("System Default")}
              </span>
              <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA]">
                {tr("Follow device setting")}
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* 3. LANGUAGE & VOICE */}
      <section className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-6 space-y-5 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                {tr("Language & Voice Reading")}
              </h2>
              <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                {tr("Select preferred language and audio narration speed")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestSpeech}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] bg-[#E4F0E7] dark:bg-[#1D3B2D] cursor-pointer whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 shrink-0" />
            <span>{t.testVoice}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[#668074] dark:text-[#B0C9BA] mb-1.5 font-semibold">
              {tr("Display & Diagnosis Language")}
            </label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3]"
            >
              <option value="en">English (EN)</option>
              <option value="es">Español (ES)</option>
              <option value="hi">हिन्दी (HI)</option>
              <option value="fr">Français (FR)</option>
              <option value="de">Deutsch (DE)</option>
              <option value="zh">中文 (ZH)</option>
              <option value="ta">தமிழ் (TA)</option>
            </select>
          </div>

          <div>
            <label className="block text-[#668074] dark:text-[#B0C9BA] mb-1.5 font-semibold">
              {tr("Voice Tone & Clarity")}
            </label>
            <select
              value={speechSettings.voiceTone || "soft-clear"}
              onChange={(e) => handleTonePresetChange(e.target.value as VoiceTonePreset)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3]"
            >
              <option value="soft-clear">{tr("Soft & Clear (Recommended)")}</option>
              <option value="warm-calm">{tr("Warm & Soothing")}</option>
              <option value="natural-balanced">{tr("Natural & Balanced")}</option>
            </select>
          </div>

          <div>
            <label className="block text-[#668074] dark:text-[#B0C9BA] mb-1.5 font-semibold">
              {tr("Voice Profile")}
            </label>
            <select
              value={speechSettings.preferredVoiceURI || ""}
              onChange={(e) =>
                handleUpdateSpeechSettings({ preferredVoiceURI: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3]"
            >
              <option value="">
                {tr("Auto — Softest & Clearest Voice")}
                {availableVoices[0] ? ` (${availableVoices[0].name})` : ""}
              </option>
              {availableVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#668074] dark:text-[#B0C9BA] mb-1.5 font-semibold">
              {tr("Voice Reading Speed")} ({speechSettings.speechRate}x)
            </label>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.02"
              value={speechSettings.speechRate}
              onChange={(e) =>
                handleUpdateSpeechSettings({ speechRate: parseFloat(e.target.value) })
              }
              className="w-full accent-[#176B4D] mt-2"
            />
          </div>
        </div>

        {voiceWarning && (
          <div className="p-3 rounded-xl bg-[#F0F6F1] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-xs text-[#176B4D] dark:text-[#8EAD9B] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{voiceWarning}</span>
          </div>
        )}
      </section>

      {/* 4. NOTIFICATIONS & DATA */}
      <section className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-6 space-y-5 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
        <div className="flex items-center gap-2.5 pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
          <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
              {tr("Notifications & Data Export")}
            </h2>
            <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
              {tr("Manage care reminders and export your plant records")}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer">
            <div>
              <span className="font-bold text-[#163A2D] dark:text-[#F1F7F3] block">
                {tr("Disease Detection Alerts")}
              </span>
              <span className="text-[#668074] dark:text-[#B0C9BA]">
                {tr("Notify when a plant requires immediate treatment")}
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifyDisease}
              onChange={(e) => setNotifyDisease(e.target.checked)}
              className="w-4 h-4 accent-[#176B4D] shrink-0"
            />
          </label>

          <label className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer">
            <div>
              <span className="font-bold text-[#163A2D] dark:text-[#F1F7F3] block">
                {tr("Watering & Seasonal Care Reminders")}
              </span>
              <span className="text-[#668074] dark:text-[#B0C9BA]">
                {tr("Receive scheduled care reminders for your collection")}
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifyCare}
              onChange={(e) => setNotifyCare(e.target.checked)}
              className="w-4 h-4 accent-[#176B4D] shrink-0"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
            <span>{tr("Export Preferences")}</span>
          </button>
        </div>
      </section>
    </div>
  );
};

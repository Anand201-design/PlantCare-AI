import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Sun,
  Moon,
  Monitor,
  Globe,
  Bell,
  Volume2,
  Trash2,
  Download,
  CheckCircle2,
  Play,
} from "lucide-react";
import { useLanguage, SupportedLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import {
  getStoredSpeechSettings,
  saveStoredSpeechSettings,
  SpeechSettings,
  tts,
} from "../services/speechService";
import { AudioSpeechButton } from "../components/AudioSpeechButton";

export const Settings: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme, density, setDensity } = useTheme();

  const [profileName, setProfileName] = useState(
    () => localStorage.getItem("plantcare_user_name") || "Emily Morgan"
  );
  const [profileEmail, setProfileEmail] = useState(
    () => localStorage.getItem("plantcare_user_email") || "emily.morgan@plantcare.ai"
  );
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNameInput, setEditNameInput] = useState(profileName);
  const [editEmailInput, setEditEmailInput] = useState(profileEmail);

  const [notifyDisease, setNotifyDisease] = useState(true);
  const [notifyCare, setNotifyCare] = useState(true);

  const [speechSettings, setSpeechSettings] = useState<SpeechSettings>(() =>
    getStoredSpeechSettings()
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileName(editNameInput);
    setProfileEmail(editEmailInput);
    localStorage.setItem("plantcare_user_name", editNameInput);
    localStorage.setItem("plantcare_user_email", editEmailInput);
    setIsEditingProfile(false);
    showToast("Profile updated.");
  };

  const handleUpdateSpeechSettings = (updates: Partial<SpeechSettings>) => {
    const updated = { ...speechSettings, ...updates };
    setSpeechSettings(updated);
    saveStoredSpeechSettings(updated);
    showToast("Voice settings saved.");
  };

  const handleTestSpeech = () => {
    tts.speak("PlantCare AI voice test. Your plant care assistant is ready.", {
      rate: speechSettings.speechRate,
    });
  };

  const handleExportData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      profile: { name: profileName, email: profileEmail },
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
    showToast("Preferences exported.");
  };

  return (
    <div className="space-y-7 pb-16 max-w-4xl mx-auto font-sans antialiased text-[#163A2D] dark:text-[#F1F7F3]">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-3.5 rounded-xl bg-[#176B4D] text-white text-xs font-semibold shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
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
            <span className="font-semibold text-[#163A2D] dark:text-[#F1F7F3]">Settings</span>
          </nav>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#163A2D] dark:text-[#F1F7F3] tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-sm text-[#668074] dark:text-[#B0C9BA] mt-1">
              Manage your account profile, light or dark theme, language, voice reading, and notifications.
            </p>
          </div>
        </div>

        <AudioSpeechButton
          text="Settings and preferences. Customize your profile, appearance theme, language, and voice reading."
          label="Listen"
        />
      </div>

      {/* 1. PROFILE & ACCOUNT */}
      <section className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-6 space-y-5 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                Profile & Account
              </h2>
              <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                Your personal plant care profile
              </p>
            </div>
          </div>

          {!isEditingProfile && (
            <button
              type="button"
              onClick={() => setIsEditingProfile(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] bg-[#E4F0E7] dark:bg-[#1D3B2D] cursor-pointer"
            >
              Edit Profile
            </button>
          )}
        </div>

        {isEditingProfile ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#668074] dark:text-[#B0C9BA] mb-1 font-semibold">
                  Full Name
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
                  Email Address
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
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl font-semibold text-white bg-[#176B4D] cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] font-bold text-sm flex items-center justify-center border border-[#DCE7DF] dark:border-[#244737]">
              EM
            </div>
            <div>
              <p className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                {profileName}
              </p>
              <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">{profileEmail}</p>
            </div>
          </div>
        )}
      </section>

      {/* 2. APPEARANCE & THEME */}
      <section className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-6 space-y-5 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
        <div className="flex items-center gap-2.5 pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
          <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
              Appearance & Theme
            </h2>
            <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
              Choose Light Mode or Dark Mode for PlantCare AI
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
            <Sun className="w-5 h-5 text-[#C98A4A]" />
            <div>
              <span className="text-xs font-bold block text-[#163A2D] dark:text-[#F1F7F3]">
                Light Mode
              </span>
              <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA]">
                Fresh botanical daylight
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
            <Moon className="w-5 h-5 text-[#176B4D] dark:text-[#8EAD9B]" />
            <div>
              <span className="text-xs font-bold block text-[#163A2D] dark:text-[#F1F7F3]">
                Dark Mode
              </span>
              <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA]">
                Deep forest botanical
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
            <Monitor className="w-5 h-5 text-[#668074] dark:text-[#B0C9BA]" />
            <div>
              <span className="text-xs font-bold block text-[#163A2D] dark:text-[#F1F7F3]">
                System Default
              </span>
              <span className="text-[11px] text-[#668074] dark:text-[#B0C9BA]">
                Follow device setting
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* 3. LANGUAGE & VOICE */}
      <section className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-6 space-y-5 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                Language & Voice Reading
              </h2>
              <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                Select preferred language and audio narration speed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestSpeech}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] bg-[#E4F0E7] dark:bg-[#1D3B2D] cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Test Voice</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[#668074] dark:text-[#B0C9BA] mb-1.5 font-semibold">
              Display & Diagnosis Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3]"
            >
              <option value="en">English (EN)</option>
              <option value="es">Español (ES)</option>
              <option value="hi">हिन्दी (HI)</option>
              <option value="fr">Français (FR)</option>
              <option value="de">Deutsch (DE)</option>
              <option value="zh">中文 (ZH)</option>
            </select>
          </div>

          <div>
            <label className="block text-[#668074] dark:text-[#B0C9BA] mb-1.5 font-semibold">
              Voice Reading Speed ({speechSettings.speechRate}x)
            </label>
            <input
              type="range"
              min="0.7"
              max="1.4"
              step="0.1"
              value={speechSettings.speechRate}
              onChange={(e) =>
                handleUpdateSpeechSettings({ speechRate: parseFloat(e.target.value) })
              }
              className="w-full accent-[#176B4D] mt-2"
            />
          </div>
        </div>
      </section>

      {/* 4. NOTIFICATIONS & DATA */}
      <section className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-[22px] p-6 space-y-5 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
        <div className="flex items-center gap-2.5 pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
          <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
              Notifications & Data Export
            </h2>
            <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
              Manage care reminders and export your plant records
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer">
            <div>
              <span className="font-bold text-[#163A2D] dark:text-[#F1F7F3] block">
                Disease Detection Alerts
              </span>
              <span className="text-[#668074] dark:text-[#B0C9BA]">
                Notify when a plant requires immediate treatment
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifyDisease}
              onChange={(e) => setNotifyDisease(e.target.checked)}
              className="w-4 h-4 accent-[#176B4D]"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer">
            <div>
              <span className="font-bold text-[#163A2D] dark:text-[#F1F7F3] block">
                Watering & Seasonal Care Reminders
              </span>
              <span className="text-[#668074] dark:text-[#B0C9BA]">
                Receive scheduled care reminders for your collection
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifyCare}
              onChange={(e) => setNotifyCare(e.target.checked)}
              className="w-4 h-4 accent-[#176B4D]"
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
            <span>Export Preferences</span>
          </button>
        </div>
      </section>
    </div>
  );
};

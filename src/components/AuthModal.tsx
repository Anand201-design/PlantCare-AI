import React, { useState } from "react";
import { X, Mail, Lock, User, LogIn, UserPlus, Sparkles, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    openAuthModal,
    login,
    signup,
    continueAsGuest,
  } = useAuth();
  const { tr } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError(tr("Please provide a valid email address."));
      return;
    }

    setLoading(true);
    try {
      if (authModalMode === "signup") {
        if (!name.trim()) {
          setError(tr("Please enter your name."));
          setLoading(false);
          return;
        }
        await signup(name, email);
      } else {
        await login(email, name || undefined);
      }
    } catch {
      setError(tr("Unable to process request. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await login("emily.morgan@plantcare.ai", "Emily Morgan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-6 shadow-2xl text-[#163A2D] dark:text-[#F1F7F3] relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE7DF] dark:border-[#244737]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center font-bold">
              🌿
            </div>
            <div>
              <h2 className="font-display font-bold text-lg leading-tight">
                {authModalMode === "login" ? tr("Sign In") : tr("Create Account")}
              </h2>
              <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                {tr("Sync your plants and care history across all devices")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="p-1.5 text-[#668074] hover:text-[#163A2D] dark:text-[#B0C9BA] rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#F0F6F1] dark:bg-[#12281E] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              authModalMode === "login"
                ? "bg-white dark:bg-[#173126] text-[#176B4D] dark:text-[#8EAD9B] shadow-2xs"
                : "text-[#668074] dark:text-[#B0C9BA]"
            }`}
          >
            {tr("Sign In")}
          </button>
          <button
            type="button"
            onClick={() => openAuthModal("signup")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              authModalMode === "signup"
                ? "bg-white dark:bg-[#173126] text-[#176B4D] dark:text-[#8EAD9B] shadow-2xs"
                : "text-[#668074] dark:text-[#B0C9BA]"
            }`}
          >
            {tr("Sign Up")}
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalMode === "signup" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#668074] dark:text-[#B0C9BA] block">
                {tr("Full Name")}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8EAD9B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emily Morgan"
                  className="w-full pl-9 pr-3 py-2 bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl text-xs text-[#163A2D] dark:text-[#F1F7F3] focus:outline-none focus:border-[#176B4D]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#668074] dark:text-[#B0C9BA] block">
              {tr("Email Address")}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8EAD9B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl text-xs text-[#163A2D] dark:text-[#F1F7F3] focus:outline-none focus:border-[#176B4D]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#668074] dark:text-[#B0C9BA] block">
              {tr("Password")}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8EAD9B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl text-xs text-[#163A2D] dark:text-[#F1F7F3] focus:outline-none focus:border-[#176B4D]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#176B4D] hover:bg-[#12563D] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {authModalMode === "login" ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>{loading ? tr("Signing in...") : tr("Sign In")}</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{loading ? tr("Creating account...") : tr("Create Account")}</span>
              </>
            )}
          </button>
        </form>

        {/* Demo & Guest Access */}
        <div className="pt-2 border-t border-[#DCE7DF] dark:border-[#244737] space-y-2">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2 px-3 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] text-xs font-semibold hover:bg-[#D7E8DC] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{tr("Use Demo Account (Emily Morgan)")}</span>
          </button>

          <button
            type="button"
            onClick={continueAsGuest}
            className="w-full py-1.5 text-xs text-[#668074] dark:text-[#B0C9BA] hover:text-[#163A2D] dark:hover:text-[#F1F7F3] text-center block cursor-pointer transition-colors"
          >
            {tr("Continue as Guest (Offline Mode)")}
          </button>
        </div>
      </div>
    </div>
  );
};

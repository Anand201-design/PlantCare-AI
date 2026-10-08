import React from "react";
import { WifiOff } from "lucide-react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useLanguage } from "../context/LanguageContext";

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const { tr } = useLanguage();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[#C98A4A] text-white px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition-all animate-in fade-in"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        {tr(
          "You are currently offline. Cached plants, diagnostic records, and care guides remain available."
        )}
      </span>
    </div>
  );
};

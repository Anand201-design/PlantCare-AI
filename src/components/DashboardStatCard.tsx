import React from "react";
import { ArrowUpRight } from "lucide-react";

export type StatBadgeVariant = "positive" | "neutral" | "attention";
export type StatAccentVariant = "botanical" | "attention";

export interface DashboardStatCardProps {
  title: string;
  value: string | number;
  description: string;
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  badgeVariant?: StatBadgeVariant;
  icon: React.ReactNode;
  accentVariant?: StatAccentVariant;
  loading?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  description,
  badgeText,
  badgeIcon,
  badgeVariant = "positive",
  icon,
  accentVariant = "botanical",
  loading = false,
  onClick,
  ariaLabel,
}) => {
  if (loading) {
    return (
      <div
        aria-busy="true"
        className="relative overflow-hidden rounded-tl-[26px] rounded-br-[26px] rounded-tr-[8px] rounded-bl-[8px] bg-white dark:bg-[#142B21] border border-[#DCE7DF]/90 dark:border-[#244737] p-6 flex flex-col justify-between min-h-[168px] animate-pulse"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="h-3 w-24 rounded-sm bg-[#E4F0E7] dark:bg-[#1D3B2D]" />
          <div className="w-5 h-5 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D]" />
        </div>
        <div className="my-4 flex items-baseline gap-3">
          <div className="h-10 w-20 rounded-md bg-[#E4F0E7] dark:bg-[#1D3B2D]" />
          <div className="h-3.5 w-16 rounded-sm bg-[#F0F6F1] dark:bg-[#12281E]" />
        </div>
        <div className="h-3 w-36 rounded-sm bg-[#F0F6F1] dark:bg-[#12281E]" />
      </div>
    );
  }

  const isAttention = accentVariant === "attention";

  const cardSurfaceStyle = isAttention
    ? "bg-[#FCFBF9] dark:bg-[#182921] border-[#E8DEC8] dark:border-[#3A3526] hover:border-[#C98A4A]/70 dark:hover:border-[#C98A4A]/60"
    : "bg-white dark:bg-[#142B21] border-[#DCE7DF]/90 dark:border-[#234435] hover:border-[#176B4D]/50 dark:hover:border-[#528B72]";

  const accentSpineColor = isAttention
    ? "bg-[#C98A4A] dark:bg-[#E2A86B]"
    : "bg-[#176B4D] dark:bg-[#68A88B]";

  const iconTone = isAttention
    ? "text-[#B87333] dark:text-[#E2A86B] group-hover:bg-[#FDF5EB] dark:group-hover:bg-[#282016]"
    : "text-[#176B4D] dark:text-[#8EAD9B] group-hover:bg-[#EDF5F0] dark:group-hover:bg-[#1D3B2D]";

  const dotColor =
    badgeVariant === "attention"
      ? "bg-[#C98A4A] dark:bg-[#E2A86B]"
      : badgeVariant === "neutral"
        ? "bg-[#8FA69A] dark:bg-[#668074]"
        : "bg-[#2D8A62] dark:bg-[#58B88C]";

  const statusTextColor =
    badgeVariant === "attention"
      ? "text-[#B87333] dark:text-[#E2A86B]"
      : badgeVariant === "neutral"
        ? "text-[#668074] dark:text-[#9AB8A8]"
        : "text-[#176B4D] dark:text-[#8EAD9B]";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || `${title}: ${value}. ${description}`}
      className={`group relative w-full text-left overflow-hidden rounded-tl-[26px] rounded-br-[26px] rounded-tr-[8px] rounded-bl-[8px] border ${cardSurfaceStyle} p-6 flex flex-col justify-between min-h-[168px] shadow-[0_1px_4px_rgba(22,58,45,0.025)] hover:shadow-[0_14px_30px_-10px_rgba(22,58,45,0.09)] dark:hover:shadow-[0_14px_30px_-10px_rgba(0,0,0,0.4)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.99] transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B4D] dark:focus-visible:ring-[#8EAD9B]`}
    >
      {/* Minimalist Architectural Left Spine */}
      <span
        aria-hidden="true"
        className={` via-current absolute left-0 top-6 bottom-6 w-[3px] rounded-r-full opacity-65 group-hover:top-4 group-hover:bottom-4 group-hover:opacity-100 transition-all duration-300 ${accentSpineColor}`}
      />

      {/* Subtle Ambient Corner Curve */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
          isAttention
            ? "bg-[#C98A4A]/[0.05] dark:bg-[#E2A86B]/[0.05]"
            : "bg-[#176B4D]/[0.04] dark:bg-[#8EAD9B]/[0.05]"
        }`}
      />

      {/* Top Row: Minimalist Uppercase Eyebrow + Frameless Icon */}
      <div className="flex items-center justify-between gap-3 w-full pl-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#5C786B] dark:text-[#96B4A4] leading-none">
          {title}
        </span>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${iconTone}`}
        >
          {icon}
        </div>
      </div>

      {/* Middle Row: Monumental Primary Figure + Minimalist Status Dot */}
      <div className="my-3.5 pl-1 flex items-baseline justify-between gap-2.5 w-full">
        <span className="font-display text-[36px] sm:text-[40px] font-bold tracking-[-0.04em] leading-none tabular-nums text-[#122E23] dark:text-[#F3F8F5]">
          {value}
        </span>

        {badgeText && (
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[-0.01em] leading-none ${statusTextColor}`}
          >
            {badgeIcon || (
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
            )}
            <span>{badgeText}</span>
          </span>
        )}
      </div>

      {/* Bottom Row: Clean Description + Directional Micro-Arrow */}
      <div className="w-full pl-1 flex items-center justify-between gap-3">
        <span className="text-[12px] text-[#668074] dark:text-[#99B3A5] leading-snug line-clamp-1">
          {description}
        </span>
        <ArrowUpRight
          className={`w-3.5 h-3.5 shrink-0 opacity-45 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${statusTextColor}`}
        />
      </div>
    </button>
  );
};


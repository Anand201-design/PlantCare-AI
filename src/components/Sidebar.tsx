import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Sprout,
  Stethoscope,
  Leaf,
  History,
  Sparkles,
  Settings,
  Sun,
  Moon,
  ChevronDown,
  Globe,
  X,
} from "lucide-react";
import { useLanguage, SupportedLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

interface SidebarProps {
  onCloseMobile?: () => void;
  onOpenCareModal?: () => void;
  onOpenMyPlantsModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t, tr } = useLanguage();
  const { setTheme, resolvedTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems = [
    {
      to: "/dashboard",
      label: t.navDashboard,
      icon: LayoutDashboard,
    },
    {
      to: "/analyze?mode=identify",
      label: t.navIdentify,
      icon: Sprout,
    },
    {
      to: "/analyze?mode=disease",
      label: t.navDisease,
      icon: Stethoscope,
    },
    {
      to: "/plants",
      label: t.navMyPlants,
      icon: Leaf,
    },
    {
      to: "/history",
      label: t.navHistory,
      icon: History,
    },
    {
      to: "/care",
      label: t.navCare,
      icon: Sparkles,
    },
    {
      to: "/plant-talk",
      label: t.navPlantTalk,
      icon: Sprout,
    },
    {
      to: "/assistant",
      label: t.navAssistant,
      icon: Sprout,
    },
    {
      to: "/settings",
      label: t.navSettings,
      icon: Settings,
    },
  ];

  const handleItemClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  const renderNavIcon = (to: string, active: boolean) => {
    const baseClass = `w-7 h-7 shrink-0 transition-transform duration-200 group-hover/nav:scale-105 ${
      active
        ? "text-[#176B4D] dark:text-[#8EAD9B]"
        : "text-[#527062] dark:text-[#9AB8A8] group-hover/nav:text-[#176B4D] dark:group-hover/nav:text-[#F1F7F3]"
    }`;

    switch (to) {
      case "/dashboard":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            <rect
              x="6.5"
              y="6.5"
              width="6.5"
              height="6.5"
              rx="2"
              fill="currentColor"
              fillOpacity={active ? "0.28" : "0.16"}
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <rect
              x="15"
              y="6.5"
              width="6.5"
              height="6.5"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <rect
              x="6.5"
              y="15"
              width="6.5"
              height="6.5"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M15.5 20.5C15.5 17.2 17.8 15.2 21.2 15.2C21.2 18.6 19.2 20.8 15.5 20.5Z"
              fill="currentColor"
              fillOpacity={active ? "0.3" : "0.18"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "/analyze?mode=identify":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            {/* Viewfinder corners */}
            <path
              d="M6.5 9.5V8C6.5 7.17 7.17 6.5 8 6.5H9.5M18.5 6.5H20C20.83 6.5 21.5 7.17 21.5 8V9.5M21.5 18.5V20C21.5 20.83 20.83 21.5 20 21.5H18.5M9.5 21.5H8C7.17 21.5 6.5 20.83 6.5 20V18.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeOpacity="0.65"
            />
            {/* Botanical sprout */}
            <path
              d="M14 20V12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M14 14.5C14 11.2 16.5 9.2 19.5 9.5C19.5 12.5 17.3 14.5 14 14.5Z"
              fill="currentColor"
              fillOpacity={active ? "0.3" : "0.18"}
              stroke="currentColor"
              strokeWidth="1.45"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 16C14 13.5 11.8 11.8 9 12C9 14.6 11.1 16 14 16Z"
              stroke="currentColor"
              strokeWidth="1.45"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "/analyze?mode=disease":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            {/* Leaf silhouette */}
            <path
              d="M8.5 19.5C7.5 13.5 11.5 8 19.5 7.5C20 15.5 14.5 19.5 8.5 19.5Z"
              fill="currentColor"
              fillOpacity={active ? "0.26" : "0.15"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Vein + vital pulse */}
            <path
              d="M8 20L12.5 15.5L14.2 17L16.5 13.2L18 14.2"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Diagnostic indicator dot */}
            <circle
              cx="18.5"
              cy="18.5"
              r="2.5"
              className="fill-[#C96F62]/25 stroke-[#C96F62]"
              strokeWidth="1.4"
            />
          </svg>
        );

      case "/plants":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            {/* Ceramic planter */}
            <path
              d="M9.5 16.5H18.5L17.4 21C17.25 21.6 16.7 22 16.1 22H11.9C11.3 22 10.75 21.6 10.6 21L9.5 16.5Z"
              fill="currentColor"
              fillOpacity={active ? "0.28" : "0.16"}
              stroke="currentColor"
              strokeWidth="1.45"
              strokeLinejoin="round"
            />
            {/* Left & right leaves */}
            <path
              d="M14 16.5V10.5M14 13.5C14 10.2 16.6 8 20 8.2C20 11.4 17.5 13.5 14 13.5ZM14 14.5C14 11.5 11.6 9.5 8.5 9.8C8.5 12.6 10.8 14.5 14 14.5Z"
              stroke="currentColor"
              strokeWidth="1.45"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "/history":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            <circle
              cx="14"
              cy="14"
              r="7"
              fill="currentColor"
              fillOpacity={active ? "0.22" : "0.12"}
            />
            <path
              d="M8.2 10.5C9.4 8.4 11.5 7 14 7C17.87 7 21 10.13 21 14C21 17.87 17.87 21 14 21C10.6 21 7.77 18.58 7.14 15.36"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M7 7.5V10.8H10.3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 10.5V14.2L16.6 15.8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "/care":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            {/* Botanical water droplet */}
            <path
              d="M12.5 7.5C12.5 7.5 17.5 12.6 17.5 16.2C17.5 18.96 15.26 21.2 12.5 21.2C9.74 21.2 7.5 18.96 7.5 16.2C7.5 12.6 12.5 7.5 12.5 7.5Z"
              fill="currentColor"
              fillOpacity={active ? "0.28" : "0.16"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Aesthetic sparkle star */}
            <path
              d="M19.5 6.8L20.1 8.6L21.9 9.2L20.1 9.8L19.5 11.6L18.9 9.8L17.1 9.2L18.9 8.6L19.5 6.8Z"
              fill="currentColor"
            />
          </svg>
        );

      case "/plant-talk":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            {/* Friendly leaf with speech wave */}
            <path
              d="M8.5 19.5C8 13.8 11.5 8.5 18.5 8C19 15 14 19.5 8.5 19.5Z"
              fill="currentColor"
              fillOpacity={active ? "0.28" : "0.16"}
              stroke="currentColor"
              strokeWidth="1.45"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8.5 19.5L13.5 14.5"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinecap="round"
            />
            {/* Soft voice arcs */}
            <path
              d="M19.2 13.5C20.2 14.3 20.2 15.8 19.2 16.6M21.2 12C22.8 13.5 22.8 16.6 21.2 18.1"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        );

      case "/assistant":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            {/* Chat bubble with botanical sprout */}
            <path
              d="M7 10C7 8.34 8.34 7 10 7H18C19.66 7 21 8.34 21 10V15.5C21 17.16 19.66 18.5 18 18.5H12.2L8.5 21.2V18.5C7.67 18.15 7 17.3 7 15.5V10Z"
              fill="currentColor"
              fillOpacity={active ? "0.26" : "0.14"}
              stroke="currentColor"
              strokeWidth="1.45"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 15.8V11.5M14 13.2C14 11.1 15.6 9.8 17.5 10C17.5 11.9 16 13.2 14 13.2ZM14 13.8C14 12 12.6 10.9 10.8 11.1C10.8 12.7 12.1 13.8 14 13.8Z"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "/settings":
      default:
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            {/* Aesthetic tuning sliders */}
            <path
              d="M7.5 10.5H11.5M15.5 10.5H20.5M7.5 17.5H12.5M16.5 17.5H20.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle
              cx="13.5"
              cy="10.5"
              r="2.2"
              fill="currentColor"
              fillOpacity={active ? "0.35" : "0.2"}
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle
              cx="14.5"
              cy="17.5"
              r="2.2"
              fill="currentColor"
              fillOpacity={active ? "0.35" : "0.2"}
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        );
    }
  };

  const isCurrentActive = (item: (typeof navItems)[0]) => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode");

    if (item.to === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    if (item.to === "/analyze?mode=identify") {
      return location.pathname === "/analyze" && mode === "identify";
    }
    if (item.to === "/analyze?mode=disease") {
      return (
        location.pathname === "/analyze" &&
        (mode === "disease" || (!mode && location.pathname === "/analyze"))
      );
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <aside className="w-[244px] shrink-0 flex flex-col justify-between bg-white dark:bg-[#173126] border-r border-[#DCE7DF] dark:border-[#244737] min-h-screen p-5 select-none font-sans relative overflow-hidden transition-colors duration-200">
      {/* Botanical Tree Branch & Leaf Artwork */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0 opacity-75 dark:opacity-35"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 244 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Upper-right overhanging tree branch */}
          <path
            d="M250 18 C215 32, 185 52, 152 86 C135 104, 118 115, 98 124"
            stroke="#8EAD9B"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.45"
          />
          <path
            d="M192 50 C180 72, 174 95, 158 116"
            stroke="#8EAD9B"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.4"
          />
          <path
            d="M152 86 C132 82, 114 74, 96 62"
            stroke="#8EAD9B"
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.35"
          />
          {/* Leaves on upper-right branch */}
          <path
            d="M152 86 C162 68, 180 62, 190 70 C178 82, 164 88, 152 86 Z"
            fill="#DCE7DF"
          />
          <path
            d="M124 108 C130 92, 145 88, 154 96 C143 106, 132 110, 124 108 Z"
            fill="#E4F0E7"
          />
          <path
            d="M98 124 C84 118, 76 125, 82 136 C92 134, 96 129, 98 124 Z"
            fill="#8EAD9B"
            fillOpacity="0.25"
          />
          <path
            d="M158 116 C168 112, 178 118, 174 128 C164 126, 160 121, 158 116 Z"
            fill="#DCE7DF"
          />

          {/* Main ascending botanical tree branch along lower-mid sidebar */}
          <path
            d="M-8 740 C28 690, 56 640, 88 580 C118 524, 156 482, 206 435 C222 420, 236 404, 248 390"
            stroke="#176B4D"
            strokeWidth="2.8"
            strokeLinecap="round"
            opacity="0.22"
          />
          {/* Secondary fork reaching left-upward */}
          <path
            d="M88 580 C74 535, 52 496, 26 458 C16 443, 8 428, 2 412"
            stroke="#176B4D"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.18"
          />
          {/* Tertiary fine twig branching right */}
          <path
            d="M134 514 C162 518, 188 512, 218 496"
            stroke="#176B4D"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.18"
          />
          {/* Fine upper twig on main branch */}
          <path
            d="M174 466 C166 436, 152 412, 134 392"
            stroke="#176B4D"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.16"
          />
          {/* Lower offshoot branch towards bottom right */}
          <path
            d="M44 658 C82 652, 118 662, 158 684 C182 697, 208 704, 234 702"
            stroke="#176B4D"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.16"
          />

          {/* Botanical leaves & buds along the middle-lower tree branches */}
          {/* Leaf cluster 1 - left fork */}
          <path
            d="M58 512 C42 498, 44 476, 60 470 C68 486, 66 502, 58 512 Z"
            fill="#E4F0E7"
            stroke="#8EAD9B"
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />
          <path
            d="M68 534 C86 520, 98 526, 94 542 C82 544, 74 540, 68 534 Z"
            fill="#DCE7DF"
          />
          <path
            d="M26 458 C12 452, 10 434, 22 426 C32 438, 30 450, 26 458 Z"
            fill="#8EAD9B"
            fillOpacity="0.22"
          />

          {/* Leaf cluster 2 - main central bough */}
          <path
            d="M112 544 C102 522, 110 500, 128 498 C130 518, 122 534, 112 544 Z"
            fill="#E4F0E7"
            stroke="#176B4D"
            strokeWidth="0.8"
            strokeOpacity="0.22"
          />
          <path
            d="M152 490 C146 468, 158 450, 174 452 C172 470, 162 484, 152 490 Z"
            fill="#DCE7DF"
          />
          <path
            d="M134 392 C122 382, 124 366, 138 364 C144 376, 140 386, 134 392 Z"
            fill="#8EAD9B"
            fillOpacity="0.25"
          />
          <path
            d="M160 434 C174 422, 190 426, 188 440 C176 442, 166 438, 160 434 Z"
            fill="#E4F0E7"
          />

          {/* Leaf cluster 3 - right twig */}
          <path
            d="M178 512 C192 498, 210 502, 212 516 C198 522, 186 518, 178 512 Z"
            fill="#E4F0E7"
            stroke="#8EAD9B"
            strokeWidth="0.8"
            strokeOpacity="0.35"
          />
          <path
            d="M218 496 C226 484, 238 486, 240 498 C230 502, 222 500, 218 496 Z"
            fill="#8EAD9B"
            fillOpacity="0.22"
          />
          <path
            d="M206 435 C198 418, 206 402, 222 404 C220 420, 214 430, 206 435 Z"
            fill="#DCE7DF"
          />

          {/* Leaf cluster 4 - lower branch */}
          <path
            d="M96 658 C108 642, 128 644, 130 658 C116 664, 104 662, 96 658 Z"
            fill="#E4F0E7"
          />
          <path
            d="M142 676 C134 692, 142 708, 156 704 C156 690, 150 682, 142 676 Z"
            fill="#DCE7DF"
          />
          <path
            d="M188 696 C202 684, 218 688, 218 700 C206 704, 196 700, 188 696 Z"
            fill="#8EAD9B"
            fillOpacity="0.2"
          />

          {/* Delicate botanical nodes / berries */}
          <circle cx="96" cy="62" r="2.5" fill="#8EAD9B" fillOpacity="0.4" />
          <circle cx="134" cy="392" r="2.2" fill="#176B4D" fillOpacity="0.25" />
          <circle cx="218" cy="496" r="2.2" fill="#176B4D" fillOpacity="0.25" />
          <circle cx="80" cy="594" r="2" fill="#8EAD9B" fillOpacity="0.35" />
        </svg>
      </div>

      {/* Top: Brand Logo & Navigation */}
      <div className="space-y-7 relative z-10">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1">
          <Link
            to="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-center text-[#176B4D] dark:text-[#8EAD9B] transition-transform group-hover:scale-105">
              <Leaf className="w-4.5 h-4.5 text-[#176B4D] dark:text-[#8EAD9B]" />
            </div>
            <div className="flex items-baseline">
              <span className="font-display text-lg font-bold tracking-tight text-[#163A2D] dark:text-[#F1F7F3]">
                PlantCare
              </span>
              <span className="font-display text-lg font-bold text-[#176B4D] dark:text-[#8EAD9B] ml-1">
                AI
              </span>
            </div>
          </Link>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-[#668074] hover:text-[#163A2D] dark:text-[#B0C9BA] rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const active = isCurrentActive(item);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={handleItemClick}
                className={`group/nav flex items-center justify-between px-2.5 py-2.5 rounded-xl text-[15px] leading-snug transition-all ${
                  active
                    ? "bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] font-semibold"
                    : "text-[#668074] dark:text-[#B0C9BA] font-medium hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D]/60 hover:text-[#163A2D] dark:hover:text-[#F1F7F3]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {renderNavIcon(item.to, active)}
                  <span className="truncate text-[15px] tracking-[-0.015em]">
                    {item.label}
                  </span>
                </div>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#176B4D] dark:bg-[#8EAD9B] shrink-0 ml-1.5" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls */}
      <div className="space-y-3.5 pt-4 border-t border-[#DCE7DF] dark:border-[#244737] relative z-10">
        {/* Language Switcher */}
        <div className="flex items-center justify-between gap-2 px-1.5 text-xs text-[#668074] dark:text-[#B0C9BA]">
          <span className="flex items-center gap-1.5 font-medium shrink-0">
            <Globe className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B] shrink-0" />
            {t.languageLabel}
          </span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            aria-label="Select application language"
            className="bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-lg px-2 py-1 text-xs text-[#163A2D] dark:text-[#F1F7F3] font-medium focus:outline-none cursor-pointer max-w-[140px]"
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

        {/* Light / Dark Mode Toggle */}
        <div className="bg-[#F0F6F1] dark:bg-[#12281E] p-1 rounded-full flex items-center gap-1 border border-[#DCE7DF] dark:border-[#244737]">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs transition-all cursor-pointer ${
              resolvedTheme === "light"
                ? "bg-white text-[#163A2D] font-semibold shadow-2xs"
                : "text-[#668074] dark:text-[#B0C9BA] hover:text-[#163A2D] dark:hover:text-[#F1F7F3]"
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-[#C98A4A] shrink-0" />
            <span className="truncate">{t.lightModeShort}</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs transition-all cursor-pointer ${
              resolvedTheme === "dark"
                ? "bg-[#173126] text-[#F1F7F3] border border-[#8EAD9B]/30 font-semibold shadow-2xs"
                : "text-[#668074] dark:text-[#B0C9BA] hover:text-[#163A2D] dark:hover:text-[#F1F7F3]"
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-[#8EAD9B] shrink-0" />
            <span className="truncate">{t.darkModeShort}</span>
          </button>
        </div>

        {/* User Profile Card */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] font-semibold text-xs flex items-center justify-center shrink-0 border border-[#DCE7DF] dark:border-[#244737]">
                EM
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] truncate leading-tight">
                  Emily Morgan
                </p>
                <p className="text-[11px] text-[#668074] dark:text-[#B0C9BA] truncate leading-tight">
                  {tr("Botanical Care")}
                </p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#668074] dark:text-[#B0C9BA] shrink-0" />
          </button>

          {showProfileMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-xl shadow-md p-1.5 text-xs text-[#163A2D] dark:text-[#F1F7F3] space-y-1 z-20">
              <Link
                to="/settings"
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onCloseMobile) onCloseMobile();
                }}
                className="block px-3 py-1.5 rounded-lg hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D] transition-colors"
              >
                {tr("Profile & Account")}
              </Link>
              <Link
                to="/history"
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onCloseMobile) onCloseMobile();
                }}
                className="block px-3 py-1.5 rounded-lg hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D] transition-colors"
              >
                {t.navHistory}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/settings");
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] font-medium transition-colors cursor-pointer"
              >
                {tr("Preferences")}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

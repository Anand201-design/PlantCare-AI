import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type UIDensity = "comfortable" | "compact";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  density: UIDensity;
  setDensity: (density: UIDensity) => void;
  reduceMotion: boolean;
  setReduceMotion: (val: boolean) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "plantcare_theme_mode_v2";
const DENSITY_STORAGE_KEY = "plantcare_ui_density";
const MOTION_STORAGE_KEY = "plantcare_reduce_motion";
const CONTRAST_STORAGE_KEY = "plantcare_high_contrast";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved === "light" || saved === "dark" || saved === "system") {
        return saved;
      }
    }
    return "light";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const [density, setDensityState] = useState<UIDensity>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(DENSITY_STORAGE_KEY) as UIDensity | null;
      if (saved === "comfortable" || saved === "compact") return saved;
    }
    return "comfortable";
  });

  const [reduceMotion, setReduceMotionState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(MOTION_STORAGE_KEY) === "true";
    }
    return false;
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(CONTRAST_STORAGE_KEY) === "true";
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let active: "light" | "dark" = "light";
      if (theme === "dark") {
        active = "dark";
      } else if (theme === "light") {
        active = "light";
      } else if (theme === "system") {
        active = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }

      setResolvedTheme(active);

      if (active === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (theme === "system") applyTheme();
    };
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (density === "compact") {
      root.classList.add("density-compact");
    } else {
      root.classList.remove("density-compact");
    }
  }, [density]);

  useEffect(() => {
    const root = document.documentElement;
    if (reduceMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }
  }, [reduceMotion]);

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
  }, [highContrast]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const setDensity = (newDensity: UIDensity) => {
    setDensityState(newDensity);
    localStorage.setItem(DENSITY_STORAGE_KEY, newDensity);
  };

  const setReduceMotion = (val: boolean) => {
    setReduceMotionState(val);
    localStorage.setItem(MOTION_STORAGE_KEY, String(val));
  };

  const setHighContrast = (val: boolean) => {
    setHighContrastState(val);
    localStorage.setItem(CONTRAST_STORAGE_KEY, String(val));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
        density,
        setDensity,
        reduceMotion,
        setReduceMotion,
        highContrast,
        setHighContrast,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
};

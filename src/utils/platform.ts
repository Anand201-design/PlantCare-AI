export interface PlatformInfo {
  isPWA: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  hasCamera: boolean;
  canShare: boolean;
}

export function getPlatformInfo(): PlatformInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isPWA: false,
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      isDesktop: true,
      hasCamera: false,
      canShare: false,
    };
  }

  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(ua);
  const isMobile = isIOS || isAndroid || /mobile|blackberry|iemobile|opera mini/i.test(ua);
  const isPWA =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  const hasCamera = Boolean(
    navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function"
  );
  const canShare = Boolean(typeof navigator.share === "function");

  return {
    isPWA,
    isMobile,
    isIOS,
    isAndroid,
    isDesktop: !isMobile,
    hasCamera,
    canShare,
  };
}

export async function sharePlantDiagnosis(data: {
  title: string;
  text: string;
  url?: string;
}): Promise<boolean> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url || window.location.href,
      });
      return true;
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        return false;
      }
    }
  }

  // Fallback: Copy to clipboard
  try {
    const textToCopy = `${data.title}\n\n${data.text}\n\n${data.url || window.location.href}`;
    await navigator.clipboard.writeText(textToCopy);
    return true;
  } catch {
    return false;
  }
}

export function triggerHaptic(type: "light" | "medium" | "heavy" = "light"): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      if (type === "light") navigator.vibrate(12);
      else if (type === "medium") navigator.vibrate(25);
      else if (type === "heavy") navigator.vibrate([30, 40, 30]);
    } catch {
      // Ignore haptic errors on unsupported devices
    }
  }
}

/* Captures Chromium's native install prompt and tracks app-installed state. */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("om-installable"));
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    window.dispatchEvent(new Event("om-installed"));
  });
}

export function isInstalledApp(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function installable(): boolean {
  return deferred !== null;
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferred) return "unavailable";
  try {
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") deferred = null;
    return choice.outcome;
  } catch {
    return "unavailable";
  }
}

/** Subscribe to install-state changes; returns an unsubscribe fn. */
export function onInstallChange(cb: () => void): () => void {
  window.addEventListener("om-installable", cb);
  window.addEventListener("om-installed", cb);
  return () => {
    window.removeEventListener("om-installable", cb);
    window.removeEventListener("om-installed", cb);
  };
}

export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad/.test(navigator.platform ?? "") || /Mac OS X/.test(navigator.userAgent);
}

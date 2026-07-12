import { create } from "zustand";
import type { AppSettings } from "@/types";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  language: "ar",
  notifications: true,
  currency: "EGP",
  alertSound: true,
};

function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem("dahab-misr-settings");
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.warn("Failed to load settings:", e);
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("dahab-misr-settings", JSON.stringify(settings));
  } catch (e) {
    console.warn("Failed to save settings:", e);
  }
}

interface SettingsState {
  settings: AppSettings;
  isLoaded: boolean;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  loadFromStorage: () => void;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,
  loadFromStorage: () => {
    if (get().isLoaded) return;
    const settings = loadSettings();
    set({ settings, isLoaded: true });
  },
  updateSettings: (updates) => {
    const next = { ...get().settings, ...updates };
    saveSettings(next);
    set({ settings: next });
  },
  resetSettings: () => {
    saveSettings(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },
}));

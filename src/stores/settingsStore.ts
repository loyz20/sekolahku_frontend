import { create } from "zustand";
import type { Setting } from "@/types";
import { settingsService } from "@/services/settingsService";

interface SettingsState {
  settings: Setting[];
  isLoaded: boolean;

  // Computed getters
  get: (key: string) => string | number | boolean | null;
  getString: (key: string, fallback?: string) => string;
  getNumber: (key: string, fallback?: number) => number;

  // Actions
  hydrate: () => Promise<void>;
  updateLocal: (updated: Setting[]) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: [],
  isLoaded: false,

  get: (key) => {
    const s = get().settings.find((s) => s.key === key);
    return s?.value ?? null;
  },

  getString: (key, fallback = "") => {
    const val = get().get(key);
    return val?.toString() ?? fallback;
  },

  getNumber: (key, fallback = 0) => {
    const val = get().get(key);
    return typeof val === "number" ? val : fallback;
  },

  hydrate: async () => {
    try {
      const res = await settingsService.getPublicSettings();
      set({ settings: res.data, isLoaded: true });
    } catch {
      // Silently fail — use defaults
      set({ isLoaded: true });
    }
  },

  updateLocal: (updated) => {
    set((state) => ({
      settings: state.settings.map((s) => {
        const u = updated.find((u) => u.key === s.key);
        return u ?? s;
      }),
    }));
  },
}));

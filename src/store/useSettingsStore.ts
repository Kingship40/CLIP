import { create } from 'zustand';
import { UserSettings } from '../types';
import { DEFAULT_SETTINGS, getStoredSettings, saveStoredSettings, resetAllStorageData } from '../utils/storage';

interface SettingsState {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetAllData: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: getStoredSettings(),
  updateSettings: (newSettings) => {
    set((state) => {
      const updated = { ...state.settings, ...newSettings };
      saveStoredSettings(updated);
      return { settings: updated };
    });
  },
  resetAllData: () => {
    resetAllStorageData();
    set({ settings: DEFAULT_SETTINGS });
  },
}));

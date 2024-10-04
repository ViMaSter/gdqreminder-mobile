import { defineStore } from "pinia";

export enum Theme {
  Device = "device",
  Dark = "dark",
  Light = "light",
}

type ThemeState = {
  selectedTheme: Theme;
};
const key = "theme";
const defaultValue: ThemeState = {
  selectedTheme: Theme.Device,
};

export const useThemeStore = defineStore({
  id: key,
  state: (): ThemeState => {
    const state = localStorage.getItem("piniaState-" + key);
    if (!state) {
      return defaultValue;
    }

    return JSON.parse(state);
  },
  getters: {
    currentTheme: (state) => {
      if (state.selectedTheme == Theme.Device) {
        return window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
          ? Theme.Dark
          : Theme.Light;
      }
      return state.selectedTheme;
    },
  },
  actions: {
    override(newTheme: Theme) {
      this.$state.selectedTheme = newTheme;
      localStorage.setItem("piniaState-" + key, JSON.stringify(this.$state));
    },
  },
});

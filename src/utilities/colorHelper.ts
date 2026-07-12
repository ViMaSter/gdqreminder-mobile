const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
};

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (channel: number) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const mix = (foreground: string, background: string, ratio: number) => {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  return rgbToHex(
    fg.r * ratio + bg.r * (1 - ratio),
    fg.g * ratio + bg.g * (1 - ratio),
    fg.b * ratio + bg.b * (1 - ratio),
  );
};

const relativeLuminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r, g, b].map((v) => v / 255).map((v) => {
    if (v <= 0.03928) {
      return v / 12.92;
    }
    return ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};

const bestTextColor = (hex: string) => {
  return relativeLuminance(hex) > 0.36 ? "#111111" : "#f8f9fb";
};

export const reflectColor = (currentEventName: string, isDarkMode: boolean) => {
  const isAgdq = currentEventName.startsWith("AGDQ");
  const isSgdq = currentEventName.startsWith("SGDQ");

  const agdq = "#00ffff";
  const sgdq = "#f21847";
  const other = "#9142ff";

  const active = isAgdq ? agdq : isSgdq ? sgdq : other;
  const background = isDarkMode ? "#121212" : "#f5f5f5";
  const surface = isDarkMode ? "#1d1d1d" : "#ffffff";
  const primary = mix(active, background, isDarkMode ? 0.72 : 0.86);
  const secondary = mix(active, background, isDarkMode ? 0.5 : 0.62);
  const onPrimary = bestTextColor(primary);
  const onSecondary = bestTextColor(secondary);
  const onSurface = bestTextColor(surface);
  const onBackground = bestTextColor(background);

  document.documentElement.style.setProperty("--md-sys-color-primary", primary);
  document.documentElement.style.setProperty("--md-sys-color-secondary", secondary);
  document.documentElement.style.setProperty("--md-sys-color-surface", surface);
  document.documentElement.style.setProperty("--md-sys-color-background", background);
  document.documentElement.style.setProperty("--md-sys-color-on-primary", onPrimary);
  document.documentElement.style.setProperty("--md-sys-color-on-secondary", onSecondary);
  document.documentElement.style.setProperty("--md-sys-color-on-surface", onSurface);
  document.documentElement.style.setProperty("--md-sys-color-on-background", onBackground);

  document.documentElement.style.setProperty(
    "--mdc-theme-primary",
    primary,
  );
  document.documentElement.style.setProperty(
    "--mdc-theme-secondary",
    secondary,
  );
  document.documentElement.style.setProperty(
    "--mdc-theme-background",
    background,
  );
  document.documentElement.style.setProperty(
    "--mdc-theme-surface",
    surface,
  );
  document.documentElement.style.setProperty(
    "--mdc-theme-on-primary",
    onPrimary,
  );
  document.documentElement.style.setProperty(
    "--mdc-theme-on-secondary",
    onSecondary,
  );
  document.documentElement.style.setProperty(
    "--mdc-theme-on-surface",
    onSurface,
  );
  document.documentElement.style.setProperty(
    "--mdc-theme-on-background",
    onBackground,
  );
  document.documentElement.style.setProperty(
    "--mdc-theme-error",
    "#b3261e",
  );
};

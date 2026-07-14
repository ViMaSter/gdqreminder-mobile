import {
  applyTheme,
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
} from "@material/material-color-utilities";

export const reflectColor = (currentEventName: string, isDarkMode: boolean) => {
  const isAgdq = currentEventName.startsWith("AGDQ");
  const isSgdq = currentEventName.startsWith("SGDQ");

  const agdq = "#00ffff";
  const sgdq = "#f21847";
  const other = "#9142ff";

  const active = isAgdq ? agdq : isSgdq ? sgdq : other;
  const theme = themeFromSourceColor(argbFromHex(active));

  applyTheme(theme, { target: document.body, dark: isDarkMode });
  document.documentElement.style.setProperty(
    "--mdc-theme-primary",
    hexFromArgb(theme.schemes[isDarkMode ? "dark" : "light"].primaryContainer),
  );
  document.documentElement.style.setProperty(
    "--mdc-theme-secondary",
    hexFromArgb(
      theme.schemes[isDarkMode ? "dark" : "light"].secondaryContainer,
    ),
  );
  document.documentElement.style.setProperty(
    "--mdc-theme-background",
    hexFromArgb(theme.schemes[isDarkMode ? "dark" : "light"].background),
  );
  document.documentElement.style.setProperty(
    "--mdc-theme-surface",
    hexFromArgb(theme.schemes[isDarkMode ? "dark" : "light"].surface),
  );
  document.documentElement.style.setProperty(
    "--mdc-theme-on-primary",
    hexFromArgb(
      theme.schemes[isDarkMode ? "dark" : "light"].onPrimaryContainer,
    ),
  );
  document.documentElement.style.setProperty(
    "--mdc-theme-on-secondary",
    hexFromArgb(
      theme.schemes[isDarkMode ? "dark" : "light"].onSecondaryContainer,
    ),
  );
  document.documentElement.style.setProperty(
    "--mdc-theme-on-surface",
    hexFromArgb(theme.schemes[isDarkMode ? "dark" : "light"].onSurface),
  );
  document.documentElement.style.setProperty(
    "--mdc-theme-on-background",
    hexFromArgb(theme.schemes[isDarkMode ? "dark" : "light"].onBackground),
  );
  document.documentElement.style.setProperty(
    "--mdc-theme-error",
    hexFromArgb(theme.schemes[isDarkMode ? "dark" : "light"].error),
  );
};

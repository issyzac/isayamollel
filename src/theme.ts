import { must } from "./dom";
import { writeStore } from "./storage";

/**
 * Light / dark switch.
 *
 * Until the visitor picks a theme, the page follows the device setting (see styles.css).
 * The saved choice is applied before first paint by a tiny inline script in index.html.
 */
export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function isDark(root: HTMLElement): boolean {
  const chosen = root.dataset.theme;
  if (chosen === "dark" || chosen === "light") return chosen === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function initTheme(): void {
  const root = document.documentElement;
  const button = must<HTMLButtonElement>("#theme-btn");

  button.addEventListener("click", () => {
    const next: Theme = isDark(root) ? "light" : "dark";
    root.dataset.theme = next;
    writeStore(STORAGE_KEY, next);
  });
}

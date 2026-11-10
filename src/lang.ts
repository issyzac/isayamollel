import { must } from "./dom";
import { readStore, writeStore } from "./storage";

/**
 * English / Kiswahili switch.
 *
 * English text is the page's own markup. Swahili text sits in each element's
 * data-sw attribute, and buttons carry their Swahili label in data-sw-label.
 * The script remembers the English text so it can switch back.
 */
export type Lang = "en" | "sw";

const STORAGE_KEY = "lang";

function isLang(value: string | null): value is Lang {
  return value === "en" || value === "sw";
}

export function initLang(): void {
  const root = document.documentElement;
  const button = must<HTMLButtonElement>("#lang-btn");

  const texts = Array.from(document.querySelectorAll<HTMLElement>("[data-sw]"));
  const labelled = Array.from(document.querySelectorAll<HTMLElement>("[data-sw-label]"));

  for (const el of texts) el.dataset.en = el.textContent ?? "";
  for (const el of labelled) el.dataset.enLabel = el.getAttribute("aria-label") ?? "";

  function apply(lang: Lang): void {
    root.lang = lang;
    for (const el of texts) {
      el.textContent = (lang === "sw" ? el.dataset.sw : el.dataset.en) ?? "";
    }
    for (const el of labelled) {
      el.setAttribute("aria-label", (lang === "sw" ? el.dataset.swLabel : el.dataset.enLabel) ?? "");
    }
    writeStore(STORAGE_KEY, lang);
  }

  button.addEventListener("click", () => {
    apply(root.lang === "sw" ? "en" : "sw");
  });

  const saved = readStore(STORAGE_KEY);
  if (isLang(saved) && saved === "sw") apply(saved);
}

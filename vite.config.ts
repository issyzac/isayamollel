import { readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";

/**
 * Counts the yellow placeholders left in index.html (class="tbc") and the
 * CV links that still point at the page itself (data-tbc="cv").
 * A normal build only warns. `npm run build:release` fails, so nothing ships by accident.
 */
function placeholderGuard(strict: boolean): Plugin {
  return {
    name: "placeholder-guard",
    buildStart() {
      const html = readFileSync("index.html", "utf8").replace(/<!--[\s\S]*?-->/g, "");
      const count = (html.match(/class="tbc"/g) ?? []).length + (html.match(/data-tbc=/g) ?? []).length;
      if (count === 0) return;
      const message = `index.html still has ${count} placeholder(s). Find them with: grep -n 'class="tbc"\\|data-tbc' index.html`;
      if (strict) this.error(message);
      else this.warn(message);
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [placeholderGuard(mode === "release")],
  build: { outDir: "dist", target: "es2020" },
}));

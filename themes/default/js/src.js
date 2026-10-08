// src/browser/theme.ts
var STORAGE_KEY = "commentjs-theme";
function preferredTheme() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark")
      return saved;
  } catch {}
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function applyTheme(theme, toggle) {
  document.documentElement.dataset.theme = theme;
  if (toggle) {
    toggle.textContent = theme === "dark" ? "Light" : "Dark";
    toggle.setAttribute("aria-pressed", String(theme === "dark"));
  }
}
function initTheme() {
  const element = document.getElementById("cjs-theme-toggle");
  const toggle = element instanceof HTMLButtonElement ? element : null;
  applyTheme(preferredTheme(), toggle);
  toggle?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next, toggle);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  });
}

// src/browser/source-lines.ts
initTheme();
window.prettyPrint();
var lineItems = Array.from(document.querySelectorAll("ol.linenums li"));
lineItems.forEach((li, index) => {
  const lineAnchor = document.createElement("a");
  lineAnchor.id = `L${index + 1}`;
  lineAnchor.href = `#${lineAnchor.id}`;
  li.insertBefore(lineAnchor, li.firstChild);
});

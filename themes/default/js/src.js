// src/browser/theme.ts
var STORAGE_KEY = "commentjs-theme";
function preferredTheme() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") {
    return saved;
  }
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
  const toggle = document.getElementById("cjs-theme-toggle");
  applyTheme(preferredTheme(), toggle);
  toggle?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next, toggle);
  });
}

// src/browser/source-lines.ts
initTheme();
window.prettyPrint();
var lineItems = Array.from(document.querySelectorAll("ol.linenums li"));
var anchor = document.createElement("a");
lineItems.forEach((li, index) => {
  const lineAnchor = anchor.cloneNode();
  lineAnchor.id = `L${index + 1}`;
  lineAnchor.href = `#${lineAnchor.id}`;
  li.insertBefore(lineAnchor, li.firstChild);
});

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

// src/browser/toc-filter.ts
var toc = document.getElementById("cjs-toc");
var input = document.getElementById("cjs-filter");
var resetButton = document.getElementById("cjs-search-reset");
initTheme();
if (toc && input && resetButton) {
  const nodes = Array.from(toc.getElementsByTagName("a")).map((anchor) => ({
    text: (anchor.textContent || anchor.innerText).toLowerCase(),
    li: anchor.parentNode
  }));
  const filter = () => {
    const value = input.value.toLowerCase().trim();
    nodes.forEach((node) => {
      node.li.style.display = !value || node.text.includes(value) ? "block" : "none";
    });
  };
  const resetFilter = () => {
    if (input.value) {
      input.value = "";
      filter();
    }
  };
  input.onkeyup = filter;
  resetButton.addEventListener("click", resetFilter);
}
window.prettyPrint();

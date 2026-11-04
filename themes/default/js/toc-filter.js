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

// src/browser/toc-filter.ts
var toc = document.getElementById("cjs-toc");
var input = document.getElementById("cjs-filter");
var resetButton = document.getElementById("cjs-search-reset");
initTheme();
if (toc && input instanceof HTMLInputElement && resetButton) {
  const nodes = Array.from(toc.getElementsByTagName("a")).flatMap((anchor) => anchor.parentElement ? [{
    text: (anchor.textContent || anchor.innerText).toLowerCase(),
    li: anchor.parentElement
  }] : []);
  const filter = () => {
    const value = input.value.toLowerCase().trim();
    resetButton.hidden = input.value === "";
    nodes.forEach((node) => {
      node.li.style.display = !value || node.text.includes(value) ? "block" : "none";
    });
  };
  const resetFilter = () => {
    input.value = "";
    input.focus();
    filter();
  };
  input.addEventListener("input", filter);
  input.addEventListener("keyup", filter);
  input.form?.addEventListener("submit", (event) => event.preventDefault());
  resetButton.addEventListener("click", resetFilter);
  filter();
}
window.prettyPrint();

const STORAGE_KEY = 'commentjs-theme';

type Theme = 'light' | 'dark';

function preferredTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Browsers can disable storage for local files or private sessions.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme, toggle?: HTMLButtonElement | null): void {
  document.documentElement.dataset.theme = theme;
  if (toggle) {
    toggle.textContent = theme === 'dark' ? 'Light' : 'Dark';
    toggle.setAttribute('aria-pressed', String(theme === 'dark'));
  }
}

export function initTheme(): void {
  const element = document.getElementById('cjs-theme-toggle');
  const toggle = element instanceof HTMLButtonElement ? element : null;
  applyTheme(preferredTheme(), toggle);

  toggle?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next, toggle);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The theme remains usable without persistent storage.
    }
  });
}

const STORAGE_KEY = 'commentjs-theme';

type Theme = 'light' | 'dark';

function preferredTheme(): Theme {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') {
    return saved;
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
  const toggle = document.getElementById('cjs-theme-toggle') as HTMLButtonElement | null;
  applyTheme(preferredTheme(), toggle);

  toggle?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next, toggle);
  });
}

import { initTheme } from './theme.js';

interface TocNode {
  text: string;
  li: HTMLElement;
}

declare global {
  interface Window {
    prettyPrint(): void;
  }
}

const toc = document.getElementById('cjs-toc');
const input = document.getElementById('cjs-filter');
const resetButton = document.getElementById('cjs-search-reset');

initTheme();

if (toc && input instanceof HTMLInputElement && resetButton) {
  const nodes: TocNode[] = Array.from(toc.getElementsByTagName('a')).flatMap((anchor) => anchor.parentElement ? [{
    text: (anchor.textContent || anchor.innerText).toLowerCase(),
    li: anchor.parentElement,
  }] : []);

  const filter = (): void => {
    const value = input.value.toLowerCase().trim();
    resetButton.hidden = input.value === '';
    nodes.forEach((node) => {
      node.li.style.display = !value || node.text.includes(value) ? 'block' : 'none';
    });
  };

  const resetFilter = (): void => {
    input.value = '';
    input.focus();
    filter();
  };

  input.addEventListener('input', filter);
  input.addEventListener('keyup', filter);
  input.form?.addEventListener('submit', (event) => event.preventDefault());
  resetButton.addEventListener('click', resetFilter);
  filter();
}

window.prettyPrint();

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
const input = document.getElementById('cjs-filter') as HTMLInputElement | null;
const resetButton = document.getElementById('cjs-search-reset');

initTheme();

if (toc && input && resetButton) {
  const nodes: TocNode[] = Array.from(toc.getElementsByTagName('a')).map((anchor) => ({
    text: (anchor.textContent || anchor.innerText).toLowerCase(),
    li: anchor.parentNode as HTMLElement,
  }));

  const filter = (): void => {
    const value = input.value.toLowerCase().trim();
    nodes.forEach((node) => {
      node.li.style.display = !value || node.text.includes(value) ? 'block' : 'none';
    });
  };

  const resetFilter = (): void => {
    if (input.value) {
      input.value = '';
      filter();
    }
  };

  input.onkeyup = filter;
  resetButton.addEventListener('click', resetFilter);
}

window.prettyPrint();

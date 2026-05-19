import { initTheme } from './theme.js';

declare global {
  interface Window {
    prettyPrint(): void;
  }
}

initTheme();
window.prettyPrint();

const lineItems = Array.from(document.querySelectorAll<HTMLElement>('ol.linenums li'));
const anchor = document.createElement('a');

lineItems.forEach((li, index) => {
  const lineAnchor = anchor.cloneNode() as HTMLAnchorElement;
  lineAnchor.id = `L${index + 1}`;
  lineAnchor.href = `#${lineAnchor.id}`;
  li.insertBefore(lineAnchor, li.firstChild);
});

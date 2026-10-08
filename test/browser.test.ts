import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { runInContext } from 'node:vm';
import { Window, HTMLElement } from 'happy-dom';
import { renderDocumentation, renderSource } from '../src/templates.js';
import { Parser } from '../src/parser.js';
import { block } from './fixtures.js';

async function browser(html: string, script: string, run: (window: Window) => void | Promise<void>, setup: (window: Window) => void = () => {}): Promise<void> {
  // Execute only the project browser bundles in this DOM.
  const window = new Window({ url: 'http://localhost/', settings: {
    enableJavaScriptEvaluation: true, suppressInsecureJavaScriptEnvironmentWarning: true, disableCSSFileLoading: true, disableJavaScriptFileLoading: true,
  } });
  try {
    window.document.write(html);
    runInContext(fs.readFileSync(path.resolve('themes/default/js/prettify.js'), 'utf8'), window);
    const build = await Bun.build({ entrypoints: [path.resolve(`src/browser/${script}.ts`)], target: 'browser' });
    if (!build.success) throw new Error('Browser build failed');
    setup(window);
    runInContext(await build.outputs[0].text(), window);
    await window.happyDOM.waitUntilComplete();
    await run(window);
  } finally { await window.happyDOM.close(); }
}

const documentation = () => renderDocumentation(new Parser({ filemap: { '/api.ts': block('api.one') + '\n' + block('api.two') } }).parse());

describe('browser scripts', () => {
  test('filters on input, resets through a keyboard-accessible button, and prevents form reloads', async () => {
    await browser(documentation(), 'toc-filter', (window) => {
      const input = window.document.getElementById('cjs-filter');
      const reset = window.document.getElementById('cjs-search-reset');
      if (!(input instanceof window.HTMLInputElement) || !(reset instanceof window.HTMLButtonElement)) throw new Error('Missing search controls');
      expect(input.getAttribute('aria-label')).toBe('Filter API sections');
      input.value = ' TWO '; input.dispatchEvent(new window.Event('input'));
      const items = window.document.querySelectorAll<HTMLElement>('#cjs-toc li');
      expect(items[0].style.display).toBe('none'); expect(items[1].style.display).toBe('block');
      reset.click(); expect(input.value).toBe('');
      expect([...items].every((item) => item.style.display === 'block')).toBe(true);
      expect(input.form?.dispatchEvent(new window.Event('submit', { cancelable: true }))).toBe(false);
    });
  });
  test('loads the saved theme and persists changes', async () => {
    await browser(documentation(), 'toc-filter', (window) => {
      const toggle = window.document.getElementById('cjs-theme-toggle');
      expect(window.document.documentElement.dataset.theme).toBe('dark');
      expect(toggle?.textContent).toBe('Light'); expect(toggle?.getAttribute('aria-pressed')).toBe('true');
      if (!(toggle instanceof window.HTMLButtonElement)) throw new Error('Missing theme toggle');
      toggle.click(); expect(window.localStorage.getItem('commentjs-theme')).toBe('light');
      expect(window.document.documentElement.dataset.theme).toBe('light');
    }, (window) => { window.localStorage.setItem('commentjs-theme', 'dark'); });
  });
  test('keeps the theme and filter usable when storage is blocked', async () => {
    await browser(documentation(), 'toc-filter', (window) => {
      const initial = window.document.documentElement.dataset.theme;
      const toggle = window.document.getElementById('cjs-theme-toggle');
      if (!(toggle instanceof window.HTMLButtonElement)) throw new Error('Missing theme toggle');
      toggle.click();
      expect(window.document.documentElement.dataset.theme).not.toBe(initial);
      const input = window.document.getElementById('cjs-filter');
      if (!(input instanceof window.HTMLInputElement)) throw new Error('Missing filter');
      input.value = 'one'; input.dispatchEvent(new window.Event('input'));
      expect(window.document.querySelectorAll<HTMLElement>('#cjs-toc li')[1].style.display).toBe('none');
    }, (window) => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage is blocked'); } }); });
  });
  test('adds links for every source line after actual syntax highlighting', async () => {
    await browser(renderSource('api.ts', 'const first = 1;\nconst second = 2;\nconst third = 3;'), 'source-lines', (window) => {
      const anchors = [...window.document.querySelectorAll('ol.linenums li a')];
      expect(anchors.map((anchor) => anchor.id)).toEqual(['L1', 'L2', 'L3']);
      expect(anchors.map((anchor) => anchor.getAttribute('href'))).toEqual(['#L1', '#L2', '#L3']);
      expect(window.document.getElementById('cjs-theme-toggle')).not.toBeNull();
    });
  });
});

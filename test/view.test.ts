import { afterEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { View } from '../src/view.js';
import { renderDocumentation, renderSource } from '../src/templates.js';

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('View', () => {
  test('renders React documentation and source pages', () => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'commentjs-docs-'));
    dirs.push(output);
    const view = new View({
      output,
      filemap: { '/tmp/api.ts': 'export const api = true;' },
      data: {
        docsname: 'api.ts',
        title: 'API',
        toc: [{ indent: 0, name: 'api', type: 'method', brackets: '()' }],
        sections: [[
          {
            name: 'api',
            title: 'api',
            line: 1,
            filename: 'api.ts',
            srclink: 'api',
            level: 1,
            type: 'method',
            brackets: '()',
          },
          { text: 'Description' },
          {
            json: [
              { start: '{' },
              { key: 'name', types: ['string'], desc: 'User name' },
              { end: '}' },
            ],
          },
        ]],
      },
    });

    view.render();

    const html = fs.readFileSync(path.join(output, 'index.html'), 'utf-8');
    expect(html).toContain('<div id="cjs-documentation"');
    expect(html).toContain('<li>{<ul class="cjs-json"><li><span class="cjs-json-key">name</span>');
    expect(fs.readFileSync(path.join(output, 'api-src.html'), 'utf-8')).toContain('export const api = true;');
    expect(fs.existsSync(path.join(output, 'css', 'docs.css'))).toBe(true);
  });

  test('renders optional documentation metadata and line variants', () => {
    const html = renderDocumentation({
      docsname: 'api.ts',
      title: 'Custom API',
      homepage: 'https://example.com',
      logo: 'img/custom.png',
      trackingID: 'UA-TEST',
      scripts: ['demo.ts'],
      toc: [{ indent: 1, name: 'api.item', type: 'property', brackets: '' }],
      sections: [[
        {
          name: 'api.item',
          title: 'api-item',
          line: 12,
          filename: 'api.ts',
          srclink: 'api',
          level: 3,
          type: 'property',
        },
        { head: 'Heading' },
        { html: '<aside>raw</aside>' },
        { code: ['const value = 1;'] },
        { return: { types: ['string'], desc: 'result' } },
        { json: ['plain item', {}, { end: '}' }] },
      ]],
    });

    expect(html).toContain('<title>Custom API</title>');
    expect(html).toContain('<a href="https://example.com"><img src="img/custom.png"');
    expect(html).toContain('id="cjs-theme-toggle"');
    expect(html).toContain('<script src="demo.ts"></script>');
    expect(html).toContain("window.ga&&ga('create','UA-TEST');");
    expect(html).toContain('<p class="cjs-header"><span>Heading</span></p>');
    expect(html).toContain('<aside>raw</aside>');
    expect(html).toContain('<code class="cjs-code">const value = 1;</code>');
    expect(html).toContain('<em class="cjs-type-string">string</em>');
    expect(html).toContain('<li>plain item</li><li></li><li>}</li>');
  });

  test('renders source pages with escaped code', () => {
    const html = renderSource('api.ts', '<script>');
    expect(html).toContain('id="cjs-theme-toggle"');
    expect(html).toContain('&lt;script&gt;');
  });
});

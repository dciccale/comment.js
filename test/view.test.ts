import { afterEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { View } from '../src/view.js';
import { renderDocumentation, renderSource } from '../src/templates.js';
import { Parser } from '../src/parser.js';
import { tempDir, write, block } from './fixtures.js';

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
    expect(html).toContain('window.ga&&ga(\'create\',"UA-TEST");');
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


describe('View regressions', () => {
  test('rejects output paths that contain inputs or the working directory', () => {
    const root = tempDir(); const source = write(root, 'api.ts', block('api')); const keep = write(root, 'keep.txt', 'keep');
    const filemap = { [source]: fs.readFileSync(source, 'utf8') };
    expect(() => new View({ output: root, filemap, data: new Parser({ filemap }).parse() }).render()).toThrow('Unsafe output');
    expect(fs.readFileSync(keep, 'utf8')).toBe('keep');
    expect(fs.existsSync(source)).toBe(true);
    expect(() => new View({ output: process.cwd() }).render()).toThrow('Unsafe output');
    expect(() => new View({ output: path.dirname(process.cwd()) }).render()).toThrow('Unsafe output');
  });
  test('preserves unrelated files and removes only unchanged obsolete generated files', () => {
    const root = tempDir(); const output = path.join(root, 'docs');
    const source = write(root, 'api.ts', block('api'));
    const filemap = { [source]: fs.readFileSync(source, 'utf8') };
    const data = new Parser({ filemap }).parse();
    new View({ output, filemap, data }).render();
    write(output, 'keep.txt', 'keep');
    new View({ output, filemap, data, prettify: false }).render();
    expect(fs.readFileSync(path.join(output, 'keep.txt'), 'utf8')).toBe('keep');
    expect(fs.existsSync(path.join(output, 'api-src.html'))).toBe(false);
    expect(fs.readFileSync(path.join(output, 'index.html'), 'utf8')).not.toContain('api-src.html');
  });
  test('refuses to overwrite unrelated or modified output files before any writes', () => {
    const root = tempDir(); const output = path.join(root, 'docs');
    write(output, 'index.html', 'user content');
    expect(() => new View({ output }).render()).toThrow('unowned or modified');
    expect(fs.readFileSync(path.join(output, 'index.html'), 'utf8')).toBe('user content');
    expect(fs.existsSync(path.join(output, 'css'))).toBe(false);
    fs.unlinkSync(path.join(output, 'index.html'));
    new View({ output }).render();
    write(output, 'index.html', 'user edits');
    expect(() => new View({ output }).render()).toThrow('unowned or modified');
    expect(fs.readFileSync(path.join(output, 'index.html'), 'utf8')).toBe('user edits');
  });
  test('preserves user edits to obsolete generated files', () => {
    const root = tempDir(); const output = path.join(root, 'docs');
    const filemap = { [write(root, 'api.ts', block('api'))]: block('api') };
    new View({ output, filemap, data: new Parser({ filemap }).parse() }).render();
    write(output, 'api-src.html', 'user notes');
    new View({ output, prettify: false }).render();
    expect(fs.readFileSync(path.join(output, 'api-src.html'), 'utf8')).toBe('user notes');
  });
  test('rejects output symlinks and manifest paths that escape the directory', () => {
    const root = tempDir(); const output = path.join(root, 'docs');
    fs.mkdirSync(output); fs.mkdirSync(path.join(root, 'outside'));
    fs.symlinkSync(path.join(root, 'outside'), path.join(output, 'css'), 'dir');
    expect(() => new View({ output }).render()).toThrow('symbolic link');
    fs.unlinkSync(path.join(output, 'css'));
    write(output, '.commentjs-manifest.json', JSON.stringify({ generator: 'commentjs', files: [{ path: '../outside/keep.txt', hash: '0'.repeat(64) }] }));
    expect(() => new View({ output }).render()).toThrow('Invalid generated filename');
    expect(fs.readdirSync(path.join(root, 'outside'))).toEqual([]);
  });
  test('renders config metadata and copies custom logos and demo scripts into the output', () => {
    const root = tempDir(); const output = path.join(root, 'docs');
    const logo = write(root, 'custom logo.png', 'image'); const script = write(root, 'demo.js', 'window.demo = true;');
    const data = { title: 'Data title', sections: [], toc: [], scripts: [script] };
    const view = new View({ output, title: 'Configured title', homepage: 'https://example.com', logo, trackingID: 'UA-TEST', data });
    view.render(); view.render();
    const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
    expect(html).toContain('<title>Configured title</title>');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('src="img/custom%20logo.png"');
    expect(html).toContain('UA-TEST');
    expect(html).toContain('src="demos/1-demo.js"');
    expect(fs.readFileSync(path.join(output, 'demos/1-demo.js'), 'utf8')).toBe('window.demo = true;');
    expect(data.scripts).toEqual([script]);
    expect(data.title).toBe('Data title');
  });
  test('generates distinct pages and correct links for identical filenames and stems', () => {
    const root = tempDir(); const output = path.join(root, 'docs');
    const sources = ['a/api.ts', 'b/api.ts', 'b/api.js'];
    const filemap = Object.fromEntries(sources.map((file, index) => [write(root, file, block(`api${index}`)), block(`api${index}`)]));
    const data = new Parser({ filemap }).parse();
    new View({ output, filemap, data }).render();
    expect(new Set(data.sections.map((section) => section[0].srclink)).size).toBe(3);
    const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
    for (const [index, section] of data.sections.entries()) {
      const filename = `${section[0].srclink}-src.html`;
      expect(html).toContain(`${filename}#L`);
      expect(fs.readFileSync(path.join(output, filename), 'utf8')).toContain(`* api${index}`);
    }
  });
  test('reports missing assets and TypeScript demo scripts without creating output', () => {
    const root = tempDir(); const output = path.join(root, 'docs');
    const script = write(root, 'demo.ts', 'const value: string = "typed";');
    expect(() => new View({ output, scripts: [script] }).render()).toThrow('browser-ready .js');
    expect(() => new View({ output, logo: path.join(root, 'missing.png') }).render()).toThrow();
    expect(fs.existsSync(output)).toBe(false);
  });
  test('escapes section names and tracking IDs', () => {
    const data = new Parser({ filemap: { '/api.ts': block('<img src=x onerror=alert(1)>') } }).parse();
    data.trackingID = "</script><script>alert('x')</script>";
    const html = renderDocumentation(data);
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain("</script><script>alert('x')");
    expect(html).toContain('\\u003c/script>');
  });
});

test('uses portable distinct source filenames after normalization', () => {
  const root = tempDir(); const output = path.join(root, 'docs');
  const names = ['a/Foo.ts', 'b/foo.ts', 'a/foo bar.ts', 'b/foo_bar.ts'];
  const filemap = Object.fromEntries(names.map((file, index) => [write(root, file, block(`api${index}`)), block(`api${index}`)]));
  const data = new Parser({ filemap }).parse();
  new View({ output, filemap, data }).render();
  const pages = fs.readdirSync(output).filter((name) => name.endsWith('-src.html'));
  expect(new Set(pages.map((name) => name.toLowerCase())).size).toBe(4);
  expect(pages.every((name) => /^[\w.$-]+$/.test(name))).toBe(true);
});

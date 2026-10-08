import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { createHandler } from '../scripts/serve-docs.js';
import { tempDir, write } from './fixtures.js';

describe('preview server', () => {
  test('serves the index and assets with the correct content type', async () => {
    const root = tempDir(); write(root, 'index.html', '<h1>API</h1>'); write(root, 'js/demo.js', 'window.demo=true;');
    const handler = createHandler(root);
    const response = await handler(new Request('http://localhost/'));
    expect(response.status).toBe(200); expect(await response.text()).toBe('<h1>API</h1>');
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
    const script = await handler(new Request('http://localhost/js/demo.js'));
    expect(script.headers.get('content-type')).toBe('text/javascript; charset=utf-8');
  });
  test('blocks encoded traversal to siblings and symbolic links outside the root', async () => {
    const root = tempDir(); const docs = path.join(root, 'docs');
    write(docs, 'index.html'); const secret = write(root, 'docs-extra/secret.txt', 'secret');
    fs.symlinkSync(secret, path.join(docs, 'link.txt'));
    const handler = createHandler(docs);
    for (const url of ['/..%2fdocs-extra/secret.txt', '/%2e%2e%2fdocs-extra/secret.txt', '/link.txt']) {
      expect((await handler(new Request(`http://localhost${url}`))).status).toBe(403);
    }
  });
  test('returns controlled errors for malformed URLs, directories, and missing files', async () => {
    const root = tempDir(); write(root, 'nested/file.txt'); const handler = createHandler(root);
    for (const url of ['/bad%ZZ', '/%00', '/..%5coutside']) expect((await handler(new Request(`http://localhost${url}`))).status).toBe(400);
    for (const url of ['/nested', '/missing.txt']) expect((await handler(new Request(`http://localhost${url}`))).status).toBe(404);
  });
});

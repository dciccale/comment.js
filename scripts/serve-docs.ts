import fs from 'node:fs/promises';
import path from 'node:path';
import { isWithin } from '../src/output.js';

const mimeTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
};

export function createHandler(directory: string): (request: Request) => Promise<Response> {
  const root = path.resolve(directory);
  return async (request) => {
    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(request.url).pathname);
    } catch {
      return new Response('Invalid URL', { status: 400 });
    }
    if (pathname.includes('\0') || pathname.includes('\\')) return new Response('Invalid URL', { status: 400 });
    const filepath = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!isWithin(root, filepath)) return new Response('Forbidden', { status: 403 });
    try {
      const [realRoot, realFile] = await Promise.all([fs.realpath(root), fs.realpath(filepath)]);
      if (!isWithin(realRoot, realFile)) return new Response('Forbidden', { status: 403 });
      if (!(await fs.stat(realFile)).isFile()) return new Response('Not found', { status: 404 });
      return new Response(await fs.readFile(realFile), {
        headers: { 'content-type': mimeTypes[path.extname(realFile)] ?? 'application/octet-stream' },
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) {
        return new Response('Not found', { status: 404 });
      }
      throw error;
    }
  };
}

if (import.meta.main) {
  const root = path.resolve(process.argv[2] || 'docs');
  const port = process.env.PORT === undefined ? 0 : Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be an integer from 0 to 65535');
  const server = Bun.serve({ hostname: '127.0.0.1', port, fetch: createHandler(root) });
  console.log(`Serving ${root} at ${server.url}`);
}

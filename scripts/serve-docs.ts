import net from 'node:net';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'docs');
const requestedPort = process.env.PORT ? Number(process.env.PORT) : undefined;

const mimeTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = decodeURIComponent(url.pathname);
  const requested = pathname === '/' ? '/index.html' : pathname;
  const filepath = path.normalize(path.join(root, requested));

  if (!filepath.startsWith(root)) {
    return new Response('Forbidden', { status: 403 });
  }

  const file = Bun.file(filepath);
  if (!(await file.exists())) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(file, {
    headers: {
      'content-type': mimeTypes[path.extname(filepath)] || 'application/octet-stream',
    },
  });
}

async function findOpenPort(): Promise<number> {
  if (requestedPort) {
    return requestedPort;
  }

  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, () => {
      const address = probe.address();
      probe.close(() => {
        if (address && typeof address === 'object') {
          resolve(address.port);
        } else {
          reject(new Error('Unable to reserve a preview port'));
        }
      });
    });
  });
}

const server = Bun.serve({ port: await findOpenPort(), fetch: handleRequest });
console.log(`Serving ${root} at ${server.url}`);

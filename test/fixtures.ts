import { afterEach } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});
export function tempDir(): string {
  const directory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'commentjs-test-')));
  directories.push(directory);
  return directory;
}
export function write(directory: string, filename: string, content = ''): string {
  const target = path.join(directory, filename);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return target;
}
export function block(name: string, content = ''): string {
  return `/*\\\n* ${name}\n[ method ]\n${content}\n\\*/\nexport const marker = true;\n`;
}

import { afterEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Scanner } from '../src/scanner.js';

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('Scanner', () => {
  test('scans TypeScript files and excludes dist by default', () => {
    const cwd = process.cwd();
    const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'commentjs-')));
    dirs.push(dir);
    fs.writeFileSync(path.join(dir, 'api.ts'), 'export const api = true;');
    fs.mkdirSync(path.join(dir, 'dist'));
    fs.writeFileSync(path.join(dir, 'dist', 'api.ts'), 'export const ignored = true;');

    process.chdir(dir);
    try {
      const scanner = new Scanner({ source: ['.'], extension: '.ts' });
      const filemap = scanner.scan();
      expect(Object.keys(filemap).map((file) => path.relative(dir, file))).toEqual(['api.ts']);
    } finally {
      process.chdir(cwd);
    }
  });
});

import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { Scanner } from '../src/scanner.js';
import { Commentjs } from '../src/comment.js';
import { tempDir, write, block } from './fixtures.js';

function relativeFiles(scanner: Scanner, root: string): string[] {
  return Object.keys(scanner.scan()).map((file) => path.relative(root, file)).sort();
}

describe('Scanner', () => {
  test('scans nested directories from an absolute path and filters extensions', () => {
    const root = tempDir();
    write(root, 'src/api.ts'); write(root, 'src/nested/other.tsx'); write(root, 'src/skip.txt');
    expect(relativeFiles(new Scanner({ source: path.join(root, 'src'), extension: '.ts,.tsx' }), root))
      .toEqual(['src/api.ts', 'src/nested/other.tsx']);
  });
  test('resolves relative directory entries against the directory being scanned', () => {
    const root = tempDir();
    write(root, 'src/api.ts'); write(root, 'src/nested/other.ts');
    const source = path.relative(process.cwd(), path.join(root, 'src'));
    expect(relativeFiles(new Scanner({ source, extension: '.ts' }), root)).toEqual(['src/api.ts', 'src/nested/other.ts']);
  });
  test('honors norecurse when scanning a directory', () => {
    const root = tempDir(); write(root, 'api.ts'); write(root, 'nested/api.ts');
    expect(relativeFiles(new Scanner({ source: root, recurse: false, extension: '.ts' }), root)).toEqual(['api.ts']);
  });
  test('applies default and custom exclusions to directories, globs, and explicit paths', () => {
    const root = tempDir();
    for (const name of ['src/api.ts', 'src/dist/skip.ts', 'dist/skip.ts', 'node_modules/skip.ts', 'build/skip.ts', '.hidden/skip.ts']) write(root, name);
    for (const source of [root, `${root}/**/*.ts`, path.join(root, 'dist/skip.ts')]) {
      expect(relativeFiles(new Scanner({ source, exclude: 'build/', extension: '.ts' }), root))
        .toEqual(source.endsWith('dist/skip.ts') ? [] : ['src/api.ts']);
    }
  });
  test('handles overlapping inputs, symlink cycles, and aliases without duplicates', () => {
    const root = tempDir(); const file = write(root, 'src/api.ts');
    fs.symlinkSync(path.join(root, 'src'), path.join(root, 'src/loop'), 'dir');
    fs.symlinkSync(file, path.join(root, 'alias.ts'));
    const scanner = new Scanner({ source: [root, file], extension: '.ts' });
    expect(relativeFiles(scanner, root)).toEqual(['src/api.ts']);
    expect(scanner.filecount).toBe(1);
  });
  test('resets files and counts after a source is deleted', () => {
    const root = tempDir(); const file = write(root, 'api.ts');
    const scanner = new Scanner({ source: root, extension: '.ts' });
    scanner.scan(); fs.unlinkSync(file);
    expect(scanner.scan()).toEqual({}); expect(scanner.filecount).toBe(0);
  });
  test('supports plain patterns, regex literals, and global regular expressions', () => {
    const root = tempDir(); write(root, 'c_a.ts'); write(root, 'c_b.ts'); write(root, 'other.ts');
    for (const regex of ['^c_', '/^c_/g', /^c_/g, /^c_/y]) {
      expect(relativeFiles(new Scanner({ source: root, extension: '.ts', regex }), root)).toEqual(['c_a.ts', 'c_b.ts']);
    }
    expect(() => new Scanner({ regex: '[' })).toThrow('Invalid regex');
  });
  test('repeated library runs do not retain a deleted source', () => {
    const root = tempDir(); const file = write(root, 'api.ts', block('api'));
    const generator = new Commentjs({ source: [file], muted: true });
    expect(generator.run()?.toc[0].name).toBe('api');
    fs.unlinkSync(file);
    expect(generator.run()).toBeNull();
  });
});

test('scans a project whose working directory has a hidden ancestor', () => {
  const root = tempDir(); const project = path.join(root, '.worktrees/project');
  write(project, 'src/api.ts');
  const previous = process.cwd();
  process.chdir(project);
  try {
    expect(relativeFiles(new Scanner({ source: 'src/', extension: '.ts' }), project)).toEqual(['src/api.ts']);
  } finally { process.chdir(previous); }
});

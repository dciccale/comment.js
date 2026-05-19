import fs from 'node:fs';
import path from 'node:path';
import util from 'node:util';
import { globSync } from 'glob';

export function isDir(dirpath: string | undefined): boolean {
  return Boolean(dirpath && exists(dirpath) && fs.statSync(dirpath).isDirectory());
}

export function isFile(filepath: string | undefined): boolean {
  return Boolean(filepath && exists(filepath) && fs.statSync(filepath).isFile());
}

export function mkdir(dirpath: string, mode?: number): void {
  fs.mkdirSync(dirpath, {
    recursive: true,
    mode: mode ?? (Number.parseInt('0777', 8) & ~process.umask()),
  });
}

export function write(filepath: string, content: string | Buffer): void {
  fs.writeFileSync(filepath, content);
}

export function read(filepath: string, encoding?: BufferEncoding | null): string | Buffer {
  if (encoding === null) {
    return fs.readFileSync(filepath);
  }
  return fs.readFileSync(filepath, encoding || 'utf-8');
}

export function readText(filepath: string): string {
  return read(filepath, 'utf-8') as string;
}

export function readJSON<T = unknown>(filepath: string): T {
  const src = readText(filepath);
  try {
    return JSON.parse(src) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(util.format('Unable to parse "%s" file (%s).', filepath, message));
  }
}

export function expand(pattern: string, options?: Parameters<typeof globSync>[1]): string[] {
  const results = options ? globSync(pattern, options) : globSync(pattern);
  return results.map(String);
}

export function exists(filepath: string | undefined): boolean {
  return Boolean(filepath && fs.existsSync(filepath));
}

export function copy(srcpath: string, destpath: string): void {
  const content = read(srcpath, null) as Buffer;
  const target = path.join(destpath, path.basename(srcpath));
  write(target, content);
}

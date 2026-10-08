import path from 'node:path';
import { createHash } from 'node:crypto';
import type { FileMap } from './types.js';

function sourceStem(filename: string): string {
  return path.basename(filename, path.extname(filename)).replace(/[^\w.$-]/g, '_').slice(0, 160) || 'source';
}

export function sourcePageNames(filemap: FileMap): Map<string, string> {
  const counts = new Map<string, number>();
  for (const filename of Object.keys(filemap)) {
    const stem = sourceStem(filename).toLowerCase();
    counts.set(stem, (counts.get(stem) ?? 0) + 1);
  }
  return new Map(Object.keys(filemap).map((filename) => {
    const stem = sourceStem(filename);
    const suffix = counts.get(stem.toLowerCase()) === 1 ? '' : `-${createHash('sha256').update(filename).digest('hex').slice(0, 12)}`;
    return [filename, `${stem}${suffix}`];
  }));
}

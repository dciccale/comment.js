import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function findPackageRoot(fromUrl: string): string {
  let current = path.dirname(fileURLToPath(fromUrl));

  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, 'package.json')) && fs.existsSync(path.join(current, 'themes'))) {
      return current;
    }
    current = path.dirname(current);
  }

  return process.cwd();
}

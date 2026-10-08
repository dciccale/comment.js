import path from 'node:path';
import { readJSON } from './utils/file.js';
import { findPackageRoot } from './package-root.js';

const info = readJSON(path.join(findPackageRoot(import.meta.url), 'package.json'));
if (!info || typeof info !== 'object' || !('version' in info) || typeof info.version !== 'string') {
  throw new Error('Package version is missing');
}
export const version = info.version;

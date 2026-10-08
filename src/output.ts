import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const MANIFEST = '.commentjs-manifest.json';
const hash = (content: string | Buffer): string => createHash('sha256').update(content).digest('hex');

export function isWithin(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
}

function realDestination(target: string): string {
  const absolute = path.resolve(target);
  if (fs.existsSync(absolute)) return fs.realpathSync(absolute);
  const parent = path.dirname(absolute);
  return path.join(realDestination(parent), path.basename(absolute));
}

function targetPath(output: string, filename: string): string {
  const target = path.resolve(output, filename);
  if (!filename || path.isAbsolute(filename) || target === output || !isWithin(output, target) || filename === MANIFEST) {
    throw new Error(`Invalid generated filename: ${filename}`);
  }
  return target;
}

function checkTarget(output: string, target: string): void {
  let current = output;
  for (const part of path.relative(output, target).split(path.sep)) {
    current = path.join(current, part);
    const stat = fs.lstatSync(current, { throwIfNoEntry: false });
    if (!stat) continue;
    if (stat.isSymbolicLink()) throw new Error(`Refusing to write through a symbolic link: ${current}`);
    if (current !== target && !stat.isDirectory()) throw new Error(`Output parent is not a directory: ${current}`);
    if (current === target && !stat.isFile()) throw new Error(`Output target is not a file: ${current}`);
  }
}

function readManifest(output: string): Map<string, string> {
  const manifestPath = path.join(output, MANIFEST);
  checkTarget(output, manifestPath);
  if (!fs.existsSync(manifestPath)) return new Map();
  const manifest: unknown = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!manifest || typeof manifest !== 'object' || !('generator' in manifest) || manifest.generator !== 'commentjs' ||
      !('files' in manifest) || !Array.isArray(manifest.files)) throw new Error('Invalid commentjs output manifest');
  const files = new Map<string, string>();
  for (const entry of manifest.files) {
    if (!entry || typeof entry !== 'object' || !('path' in entry) || typeof entry.path !== 'string' ||
        !('hash' in entry) || typeof entry.hash !== 'string' || !/^[a-f0-9]{64}$/.test(entry.hash)) {
      throw new Error('Invalid commentjs output manifest entry');
    }
    targetPath(output, entry.path);
    files.set(entry.path, entry.hash);
  }
  return files;
}

export function writeGeneratedFiles({ output, files, protectedPaths }: {
  output: string;
  files: Map<string, string | Buffer>;
  protectedPaths: string[];
}): void {
  const destination = realDestination(output);
  for (const protectedPath of [process.cwd(), ...protectedPaths]) {
    if (isWithin(destination, realDestination(protectedPath))) {
      throw new Error(`Unsafe output directory: ${output} contains ${protectedPath}`);
    }
  }
  if (fs.existsSync(destination) && !fs.statSync(destination).isDirectory()) throw new Error('Output must be a directory');
  const previous = readManifest(destination);
  for (const [filename, content] of files) {
    const target = targetPath(destination, filename);
    checkTarget(destination, target);
    if (fs.existsSync(target)) {
      const currentHash = hash(fs.readFileSync(target));
      if (currentHash !== previous.get(filename) && currentHash !== hash(content)) {
        throw new Error(`Refusing to overwrite an unowned or modified file: ${target}`);
      }
    }
  }
  for (const filename of previous.keys()) checkTarget(destination, targetPath(destination, filename));
  fs.mkdirSync(destination, { recursive: true });
  for (const [filename, expectedHash] of previous) {
    const target = targetPath(destination, filename);
    if (!files.has(filename) && fs.existsSync(target) && hash(fs.readFileSync(target)) === expectedHash) fs.unlinkSync(target);
  }
  for (const [filename, content] of files) {
    const target = targetPath(destination, filename);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  fs.writeFileSync(path.join(destination, MANIFEST), JSON.stringify({
    generator: 'commentjs', files: [...files].map(([filename, content]) => ({ path: filename, hash: hash(content) })),
  }, null, 2));
}

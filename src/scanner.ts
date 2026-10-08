import fs from 'node:fs';
import path from 'node:path';
import * as utils from './utils/index.js';
import type { CommentjsOptions, FileMap } from './types.js';

const DEFAULT_EXCLUDE = '.DS_Store,.svn,CVS,.git,build_rollup_tmp,build_tmp,node_modules,dist';

export function parseRegex(value: string | RegExp | null | undefined): RegExp | null {
  if (!value) return null;
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);
  const literal = value.match(/^\/(.*)\/([a-z]*)$/);
  try {
    return literal ? new RegExp(literal[1], literal[2]) : new RegExp(value);
  } catch (error) {
    throw new Error(`Invalid regex: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export class Scanner {
  options: CommentjsOptions & { extensions: string[]; excludes: Set<string>; regex: RegExp | null };
  filecount = 0;
  filemap: FileMap = Object.create(null);
  private visited = new Set<string>();

  constructor(options: CommentjsOptions = {}) {
    this.options = {
      recurse: true, ...options,
      extensions: (options.extension ?? '').split(',').map((item) => item.trim()),
      excludes: new Set(`${DEFAULT_EXCLUDE},${options.exclude ?? ''}`.split(',').map((item) => path.normalize(item.trim()).replace(/[\\/]+$/, '')).filter((item) => item && item !== '.')),
      regex: parseRegex(options.regex),
    };
  }

  scan(source: string | string[] = this.options.source ?? []): FileMap {
    this.filemap = Object.create(null);
    this.filecount = 0;
    this.visited.clear();
    for (const pattern of Array.isArray(source) ? source : [source]) this.parsepath(process.cwd(), true)(pattern);
    return this.filemap;
  }

  parsedir(dir: string): FileMap | undefined {
    if (!utils.file.isDir(dir)) return undefined;
    const real = fs.realpathSync(dir);
    if (this.visited.has(real)) return this.filemap;
    this.visited.add(real);
    for (const name of fs.readdirSync(dir).sort()) this.parsefilepath(dir, this.options.recurse ?? true)(name);
    return this.filemap;
  }

  parsefilepath(dir: string, recurse: boolean): (filename: string) => void {
    return (filename) => {
      const filepath = path.resolve(dir, filename);
      if (this.isExcluded(filepath) || !utils.file.exists(filepath)) return;
      const real = fs.realpathSync(filepath);
      if (this.isExcluded(real)) return;
      if (utils.file.isDir(real)) {
        if (recurse) this.parsedir(real);
      } else if (utils.file.isFile(real) && this.isValidExt(real) && this.matchesRegex(real) && !Object.hasOwn(this.filemap, real)) {
        this.filemap[real] = utils.file.readText(real);
        this.filecount += 1;
      }
    };
  }

  parsepath(dir: string, recurse: boolean): (filename: string) => void {
    return (pattern) => {
      const files = utils.file.expand(pattern, { cwd: dir }).sort();
      if (!files.length) utils.log.warn('The path', path.resolve(dir, pattern), 'does not exist');
      for (const filename of files) this.parsefilepath(dir, recurse)(filename);
    };
  }

  isValidExt(filepath: string): boolean {
    return !this.options.extension || this.options.extensions.includes(path.extname(filepath));
  }

  matchesRegex(filepath: string): boolean {
    if (!this.options.regex) return true;
    this.options.regex.lastIndex = 0;
    return this.options.regex.test(path.basename(filepath));
  }

  isExcluded(filename: string): boolean {
    const absolute = path.resolve(filename);
    const relative = path.relative(process.cwd(), absolute);
    const parts = relative.split(path.sep);
    if (parts.some((part) => part.startsWith('.') && part !== '.' && part !== '..')) return true;
    for (const excluded of this.options.excludes) {
      if (parts.includes(excluded)) return true;
      const excludedPath = path.resolve(excluded);
      if (absolute === excludedPath || absolute.startsWith(`${excludedPath}${path.sep}`)) return true;
      if (relative === excluded || relative.startsWith(`${excluded}${path.sep}`)) return true;
    }
    return false;
  }
}

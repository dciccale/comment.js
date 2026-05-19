import fs from 'node:fs';
import path from 'node:path';
import * as utils from './utils/index.js';
import type { CommentjsOptions, FileMap } from './types.js';

const DEFAULT_EXCLUDE = '.DS_Store,.svn,CVS,.git,build_rollup_tmp,build_tmp,node_modules,dist';

interface ScannerOptions extends CommentjsOptions {
  extensions: string[];
  excludes: Record<string, unknown>;
  regex: RegExp | null;
}

export class Scanner {
  options: ScannerOptions;
  filecount = 0;
  filemap: FileMap = {};

  constructor(options: CommentjsOptions = {}) {
    const defaults = {
      exclude: DEFAULT_EXCLUDE,
      extension: '',
      regex: null,
      recurse: true,
    };

    this.options = utils._.extend({}, defaults, options) as ScannerOptions;
    this.options.extensions = (this.options.extension || '').split(',');
    this.options.excludes = utils._.hash((this.options.exclude || '').split(','));

    if (this.options.exclude !== defaults.exclude) {
      utils._.forEach(defaults.exclude.split(','), (item) => {
        this.options.excludes[item] = true;
      });
    }

    if (this.options.regex && !(this.options.regex instanceof RegExp)) {
      this.options.regex = new RegExp(this.options.regex);
    }
  }

  scan(source: string | string[] = this.options.source || []): FileMap {
    const sources = Array.isArray(source) ? source : [source];
    utils._.forEach(sources, this.parsepath(process.cwd(), true), this);
    return this.filemap;
  }

  parsedir(dir: string): FileMap | undefined {
    if (!utils.file.isDir(dir)) {
      utils.log.error(`Can not find directory: ${dir}`);
      return undefined;
    }

    utils._.forEach(fs.readdirSync(dir).sort(), this.parsepath(dir, Boolean(this.options.recurse)), this);
    return this.filemap;
  }

  parsefilepath(dir: string, recurse: boolean): (filename: string) => void {
    return (filename) => {
      const filepath = path.normalize(path.resolve(dir, filename));

      if (this.isExcluded(filename)) {
        return;
      }

      if (utils.file.isDir(filepath) && recurse) {
        this.parsedir(filepath);
      } else if (utils.file.isFile(filepath) && this.isValidExt(filepath) && this.matchesRegex(filepath)) {
        this.filecount += 1;
        this.filemap[filepath] = utils.file.readText(filepath);
      }
    };
  }

  parsepath(dir: string, recurse: boolean): (filename: string) => void {
    return (filename) => {
      const files = utils.file.expand(filename);
      const filepath = path.normalize(path.resolve(dir, filename));
      if (files && files.length) {
        files.forEach(this.parsefilepath(dir, recurse));
      } else {
        utils.log.warn('The path', filepath, "doesn't exists");
      }
    };
  }

  isValidExt(filepath: string): boolean {
    return !(this.options.extension && !utils._.has(this.options.extensions, path.extname(filepath)));
  }

  matchesRegex(filepath: string): boolean {
    return !(this.options.regex && !this.options.regex.test(path.basename(filepath)));
  }

  isExcluded(filename: string): RegExpMatchArray | boolean | null {
    const normalized = path.normalize(filename);
    return normalized.match(/^\.[^.\/\\]/) || utils._.has(this.options.excludes, normalized);
  }
}

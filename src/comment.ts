import * as utils from './utils/index.js';
import { Parser } from './parser.js';
import { Scanner } from './scanner.js';
import type { CommentjsOptions, DocumentationData, FileMap } from './types.js';

const defaults: Required<Pick<CommentjsOptions, 'muted' | 'source' | 'extension' | 'exclude' | 'regex' | 'recurse'>> = {
  muted: false,
  source: [],
  extension: '.js,.ts,.tsx',
  exclude: '.DS_Store,.svn,CVS,.git,build_rollup_tmp,build_tmp,node_modules,dist',
  regex: null,
  recurse: true,
};

export class Commentjs {
  version = '0.1.0';
  options: CommentjsOptions;
  scanner: Scanner;
  filemap: FileMap = {};
  starttime?: number;
  endtime?: number;

  constructor(options: CommentjsOptions = {}) {
    this.options = utils._.extend({}, defaults, options);
    utils.log.setMuted(Boolean(this.options.muted));
    this.scanner = new Scanner(this.options);
  }

  run(): DocumentationData | null {
    this.starttime = Date.now();
    this.filemap = this.scanner.scan(this.options.source);

    if (utils._.isEmpty(this.filemap)) {
      utils.log.warn('No files found for', JSON.stringify(this.options.source));
      return null;
    }

    const docs = new Parser({ filemap: this.filemap });
    const data = docs.parse();
    this.endtime = Date.now();

    utils.log.ok(
      'Parsed',
      this.scanner.filecount,
      `file${this.scanner.filecount > 1 ? 's' : ''}`,
      'in',
      `${this.endtime - this.starttime}ms`,
    );

    return data;
  }
}

export default Commentjs;
export * from './types.js';

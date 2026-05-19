import path from 'node:path';
import * as utils from './utils/index.js';
import { findPackageRoot } from './package-root.js';
import type { CommentjsOptions } from './types.js';

interface PackageInfo {
  version: string;
}

const packageInfo = utils.file.readJSON<PackageInfo>(
  path.join(findPackageRoot(import.meta.url), 'package.json'),
);

export class Options {
  constructor(args: string[]) {
    const options: CommentjsOptions = {};

    if (!args.length) {
      Options.help();
      process.exit(1);
    }

    if (args.length === 1 && path.extname(args[0]) === '.json' && utils.file.isFile(args[0])) {
      return utils.file.readJSON<CommentjsOptions>(args[0]) as this;
    }

    while (args.length > 0) {
      const arg = args.shift();

      switch (arg) {
        case '--help':
        case '-h':
          Options.help();
          process.exit(1);
          break;
        case '--output':
        case '-o':
          options.output = args.shift();
          break;
        case '--norecurse':
        case '-n':
          options.recurse = false;
          break;
        case '--extension':
        case '-e':
          options.extension = args.shift();
          break;
        case '--exclude':
        case '-x':
          options.exclude = args.shift();
          break;
        case '--regex':
        case '-r':
          options.regex = args.shift();
          break;
        case '--muted':
        case '-m':
          options.muted = true;
          break;
        case '--version':
        case '-v':
          console.log(packageInfo.version);
          process.exit(0);
          break;
        default:
          if (!options.source) {
            options.source = [];
          }
          if (arg && arg.indexOf('-') === 0) {
            throw new Error(`Unknown option: ${arg}`);
          }
          (options.source as string[]).push(arg!);
      }
    }

    return options as this;
  }

  static help(): void {
    utils.log.writeln();
    utils.log.writeln('Usage: commentjs [options] <file1.ts *.ts dir/> or <.json config file>');
    utils.log.writeln();
    utils.log.writeln('   -h, --help       show this help');
    utils.log.writeln('   -o, --output     set the output directory for the doc files');
    utils.log.writeln('   -n, --norecurse  prevent recurse nested directories');
    utils.log.writeln('   -e, --extension  set file extensions to be scanned separated by comma');
    utils.log.writeln('   -x, --exclude    specify directories or files to exclude');
    utils.log.writeln('   -r, --regex      use a javascript /regex/ to filter paths to be scanned');
    utils.log.writeln('   -m, --muted      less log messages from commentjs');
    utils.log.writeln('   -v, --version    display the version number');
    utils.log.writeln();
    utils.log.writeln('Example usage:');
    utils.log.writeln('   commentjs file1.ts file2.ts');
    utils.log.writeln('   commentjs -o docs/index.html src/**/*.ts');
    utils.log.writeln('   commentjs -r /^c_/ js/');
    utils.log.writeln('   commentjs -x build/ -m src/ test/ main.ts');
    utils.log.writeln('   commentjs config.json');
    utils.log.writeln();
  }
}

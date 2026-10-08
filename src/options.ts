import path from 'node:path';
import { readJSON } from './utils/file.js';
import { parseRegex } from './scanner.js';
import type { CommentjsOptions } from './types.js';

function stringValue(value: unknown, key: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${key} must be a non-empty string`);
  return value;
}

function strings(value: unknown, key: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${key} must be an array of strings`);
  return value.map((item) => stringValue(item, key));
}

export function parseConfig(value: unknown, baseDir = process.cwd()): CommentjsOptions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Configuration must be a JSON object');
  const options: CommentjsOptions = {};
  for (const [key, raw] of Object.entries(value)) {
    switch (key) {
      case 'source':
        options.source = (typeof raw === 'string' ? [stringValue(raw, key)] : strings(raw, key)).map((item) => path.resolve(baseDir, item));
        break;
      case 'scripts': options.scripts = strings(raw, key).map((item) => path.resolve(baseDir, item)); break;
      case 'output': case 'logo': case 'themesdir': options[key] = path.resolve(baseDir, stringValue(raw, key)); break;
      case 'title': case 'homepage': case 'trackingID': case 'extension': case 'exclude': options[key] = stringValue(raw, key); break;
      case 'regex': options.regex = raw === null ? null : parseRegex(stringValue(raw, key)); break;
      case 'muted': case 'recurse': case 'prettify':
        if (typeof raw !== 'boolean') throw new Error(`${key} must be a boolean`);
        options[key] = raw;
        break;
      default: throw new Error(`Unknown configuration option: ${key}`);
    }
  }
  requireSource(options);
  return options;
}

function requireSource(options: CommentjsOptions): void {
  if (!options.source || options.source.length === 0) throw new Error('Specify at least one source file or directory');
}

export type Command = { kind: 'help' } | { kind: 'version' } | { kind: 'generate'; options: CommentjsOptions };

export function parseArgs(args: readonly string[]): Command {
  if (args.includes('--help') || args.includes('-h')) return { kind: 'help' };
  if (args.includes('--version') || args.includes('-v')) return { kind: 'version' };
  if (args.length === 1 && path.extname(args[0]) === '.json') {
    const configPath = path.resolve(args[0]);
    return { kind: 'generate', options: parseConfig(readJSON(configPath), path.dirname(configPath)) };
  }
  const source: string[] = [];
  const options: CommentjsOptions = { source };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const takeValue = (): string => {
      const next = args[i + 1];
      if (!next || next.startsWith('-')) throw new Error(`Missing value for ${arg}`);
      i += 1;
      return next;
    };
    switch (arg) {
      case '--': source.push(...args.slice(i + 1)); i = args.length; break;
      case '--output': case '-o': options.output = takeValue(); break;
      case '--norecurse': case '-n': options.recurse = false; break;
      case '--extension': case '-e': options.extension = takeValue(); break;
      case '--exclude': case '-x': options.exclude = takeValue(); break;
      case '--regex': case '-r': options.regex = parseRegex(takeValue()); break;
      case '--muted': case '-m': options.muted = true; break;
      default:
        if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
        source.push(arg);
    }
  }
  requireSource(options);
  return { kind: 'generate', options };
}

export function help(): string {
  return `Usage: commentjs [options] <files or directories> or <config.json>

  -h, --help       show this help
  -o, --output     set the output directory
  -n, --norecurse  scan only the first directory level
  -e, --extension  select file extensions, separated by commas
  -x, --exclude    exclude directory names or paths, separated by commas
  -r, --regex      filter filenames with a regex pattern or /pattern/flags
  -m, --muted      suppress progress messages
  -v, --version    display the package version

Examples:
  commentjs -o docs src/
  commentjs -r '^c_' js/
  commentjs -x build -m src/ test/ main.ts
  commentjs config.json
`;
}

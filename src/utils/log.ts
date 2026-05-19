import util from 'node:util';
import chalk from 'chalk';

interface LogType {
  msg: string;
  color: (value: string) => string;
}

const types: Record<'ok' | 'warn' | 'error', LogType> = {
  ok: {
    msg: 'OK',
    color: chalk.green,
  },
  warn: {
    msg: 'WARNING',
    color: chalk.yellow,
  },
  error: {
    msg: 'ERROR',
    color: chalk.red,
  },
};

export let muted = false;

export function setMuted(value: boolean): void {
  muted = value;
}

function formatArgs(args: IArguments): string {
  const values = Array.prototype.slice.call(args, 0);
  if (values.length > 0) {
    values[0] = String(values[0]);
  }
  return util.format.apply(util, values);
}

function writeRaw(msg = ''): void {
  if (!muted) {
    process.stdout.write(msg);
  }
}

function writelnRaw(msg = ''): void {
  writeRaw(`${msg}\n`);
}

function logWithType(type: LogType, args: IArguments): void {
  const msg = formatArgs(args);

  if (args.length > 0) {
    writelnRaw(type.color('>> ') + msg.trim().replace(/\n/g, '\n>> '));
  } else {
    writelnRaw(type.color(type.msg));
  }
}

export function write(...args: unknown[]): typeof import('./log.js') {
  writeRaw(util.format(...args));
  return logApi;
}

export function writeln(...args: unknown[]): typeof import('./log.js') {
  writelnRaw(util.format(...args));
  return logApi;
}

export function ok(...args: unknown[]): typeof import('./log.js') {
  logWithType(types.ok, arguments);
  return logApi;
}

export function warn(...args: unknown[]): typeof import('./log.js') {
  logWithType(types.warn, arguments);
  return logApi;
}

export function error(...args: unknown[]): typeof import('./log.js') {
  logWithType(types.error, arguments);
  return logApi;
}

export function debug(...args: unknown[]): typeof import('./log.js') {
  writelnRaw(chalk.magenta(util.format(...args)));
  return logApi;
}

const logApi = { write, writeln, ok, warn, error, debug, get muted() { return muted; }, setMuted };

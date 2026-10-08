import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import { parseArgs, parseConfig } from '../src/options.js';
import { Commentjs } from '../src/comment.js';
import { version } from '../src/package-info.js';

describe('options', () => {
  test('validates CLI values and preserves the caller argument array', () => {
    const args = ['-o', 'docs', '-n', '-e', '.ts', '-x', 'build', '-r', '/^c_/g', '-m', 'src'];
    const original = [...args]; const command = parseArgs(args);
    expect(args).toEqual(original);
    expect(command).toMatchObject({ kind: 'generate', options: { output: 'docs', recurse: false, extension: '.ts', exclude: 'build', muted: true, source: ['src'] } });
    for (const args of [[], ['-o'], ['api.ts', '-o', '-m'], ['-unknown'], ['-r', '[', 'src']]) expect(() => parseArgs(args)).toThrow();
    expect(parseArgs(['--', '-filename.ts'])).toMatchObject({ options: { source: ['-filename.ts'] } });
  });
  test('validates every JSON field and resolves paths relative to the config file', () => {
    const config = parseConfig({ source: ['src/*.ts'], output: 'docs', scripts: ['demo.js'], logo: 'logo.png', themesdir: 'theme', title: 'API', homepage: 'https://example.com', trackingID: 'UA-TEST', extension: '.ts', exclude: 'build', regex: '/^c_/i', recurse: false, muted: true, prettify: false }, '/project');
    expect(config).toMatchObject({ source: ['/project/src/*.ts'], output: '/project/docs', scripts: ['/project/demo.js'], logo: '/project/logo.png', themesdir: '/project/theme', prettify: false });
    expect(config.regex).toEqual(/^c_/i);
    expect(parseConfig({ source: 'api.ts', regex: null }, '/project').source).toEqual(['/project/api.ts']);
    for (const input of [null, [], 'config', {}, { source: [] }, { source: [1] }, { source: 'api.ts', output: null }, { source: 'api.ts', scripts: 'demo.js' }, { source: 'api.ts', prettify: 'false' }, { source: 'api.ts', unknown: true }, { source: 'api.ts', regex: '[' }]) {
      expect(() => parseConfig(input)).toThrow();
    }
  });
  test('shares the package version with the library', () => {
    expect(new Commentjs({ muted: true }).version).toBe(version);
    expect(version).toBe(JSON.parse(fs.readFileSync('package.json', 'utf8')).version);
  });
});

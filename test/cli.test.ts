import { beforeAll, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { runInContext } from 'node:vm';
import { spawnSync } from 'node:child_process';
import { Window } from 'happy-dom';
import { tempDir, write, block } from './fixtures.js';
import { version } from '../src/package-info.js';

const project = path.resolve(import.meta.dir, '..');
const cliPath = path.join(project, 'dist/src/cli.js');
const node = process.env.COMMENTJS_NODE_BIN ?? 'node';
beforeAll(() => {
  const result = spawnSync('bun', ['run', 'build'], { cwd: project, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
});
function cli(args: string[], cwd: string) {
  return spawnSync(node, [cliPath, ...args], { cwd, encoding: 'utf8' });
}

describe('built Node CLI', () => {
  test('prints the exact package version and exits successfully for help', () => {
    const root = tempDir();
    expect(cli(['--version'], root).stdout.trim()).toBe(version);
    const help = cli(['--help'], root);
    expect(help.status).toBe(0); expect(help.stdout).toContain('Usage: commentjs');
  });
  test('returns clear failures for missing sources and invalid arguments or JSON', () => {
    const root = tempDir(); write(root, 'api.ts', block('api'));
    write(root, 'invalid.json', '{'); write(root, 'wrong.json', '{"source":42}');
    for (const args of [[], ['missing.ts'], ['api.ts', '-o'], ['api.ts', '-o', '-m'], ['--unknown'], ['invalid.json'], ['wrong.json'], ['missing.json']]) {
      const result = cli(args, root);
      expect(result.status).toBe(1); expect(result.stderr).toStartWith('commentjs:');
      expect(result.stderr).not.toContain('at new');
    }
    expect(fs.existsSync(path.join(root, 'docs'))).toBe(false);
  });
  test('generates through CLI flags and protects source files from an overlapping output', () => {
    const root = tempDir(); write(root, 'src/c_api.ts', block('api')); write(root, 'src/skip.ts', block('skip'));
    const result = cli(['-m', '-r', '/^c_/', '-o', 'docs', 'src/'], root);
    expect(result.status).toBe(0); expect(result.stdout).toBe('');
    expect(fs.readFileSync(path.join(root, 'docs/index.html'), 'utf8')).toContain('id="api"');
    expect(fs.readdirSync(path.join(root, 'docs')).filter((name) => name.endsWith('-src.html'))).toEqual(['c_api-src.html']);
    const unsafe = cli(['-o', 'src', 'src/'], root);
    expect(unsafe.status).toBe(1); expect(unsafe.stderr).toContain('Unsafe output');
    expect(fs.existsSync(path.join(root, 'src/c_api.ts'))).toBe(true);
  });
  test('resolves a JSON config from a different working directory', () => {
    const root = tempDir(); write(root, 'config/api.ts', block('api'));
    write(root, 'config/docs.json', JSON.stringify({ source: ['api.ts'], output: 'out', title: 'Configured API', prettify: false }));
    expect(cli(['config/docs.json'], root).status).toBe(0);
    const html = fs.readFileSync(path.join(root, 'config/out/index.html'), 'utf8');
    expect(html).toContain('<title>Configured API</title>'); expect(html).not.toContain('-src.html');
  });
  test('generates every sample with complete local links and assets', async () => {
    const root = tempDir();
    const samples = [
      { name: 'example_simple', args: ['kimbo.ts'], output: 'docs', sources: 1 },
      { name: 'example_json_config', args: ['config.json'], output: 'apidocs', sources: 1 },
      { name: 'example_live_demos', args: ['demo.json'], output: 'docs', sources: 1 },
      { name: 'example_sub_dirs', args: ['c_greet.ts', 'sub_dir/'], output: 'docs', sources: 3 },
    ];
    for (const sample of samples) {
      const directory = path.join(root, sample.name);
      fs.cpSync(path.join(project, 'examples', sample.name), directory, {
        recursive: true, filter: (filename) => !['docs', 'apidocs'].includes(path.basename(filename)),
      });
      const result = cli(sample.args, directory);
      expect(result.status, result.stderr).toBe(0);
      const output = path.join(directory, sample.output);
      expect(fs.readdirSync(output).filter((name) => name.endsWith('-src.html')).length).toBe(sample.sources);
      // Only repository-owned sample scripts execute in this window.
      const window = new Window({ url: 'http://localhost/', settings: { enableJavaScriptEvaluation: true, suppressInsecureJavaScriptEnvironmentWarning: true, disableCSSFileLoading: true, disableJavaScriptFileLoading: true } });
      try {
        window.document.write(fs.readFileSync(path.join(output, 'index.html'), 'utf8'));
        for (const element of window.document.querySelectorAll('[href], [src]')) {
          const url = element.getAttribute('href') ?? element.getAttribute('src') ?? '';
          if (!url || /^https?:/.test(url)) continue;
          const [file, fragment] = url.split('#');
          if (file) expect(fs.existsSync(path.join(output, decodeURIComponent(file))), `${sample.name}: ${url}`).toBe(true);
          else if (fragment) expect(window.document.getElementById(fragment), `${sample.name}: ${url}`).not.toBeNull();
        }
        if (sample.name === 'example_json_config') expect(window.document.querySelector('img')?.getAttribute('src')).toBe('img/custom-logo.png');
        if (sample.name === 'example_live_demos') {
          for (const script of window.document.querySelectorAll('script[src^="demos/"]')) {
            runInContext(fs.readFileSync(path.join(output, script.getAttribute('src') ?? ''), 'utf8'), window);
          }
          const input = window.document.getElementById('c_name');
          if (!(input instanceof window.HTMLInputElement)) throw new Error('Missing demo input');
          const button = window.document.getElementById('btn');
          if (!(button instanceof window.HTMLButtonElement)) throw new Error('Missing demo button');
          input.value = 'Denis'; button.click();
          expect(window.document.getElementById('c_result')?.textContent).toBe('Hello Denis');
          input.value = '  '; button.click();
          expect(window.document.getElementById('c_result')?.textContent).toBe('Enter a name first.');
        }
      } finally { await window.happyDOM.close(); }
    }
  });
});

test('runs the packed npm package outside the repository', () => {
  const root = tempDir();
  const pack = spawnSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', root], { cwd: project, encoding: 'utf8' });
  expect(pack.status, pack.stderr).toBe(0);
  const archive = fs.readdirSync(root).find((name) => name.endsWith('.tgz'));
  if (!archive) throw new Error('Missing npm tarball');
  const unpack = spawnSync('tar', ['-xzf', path.join(root, archive), '-C', root], { encoding: 'utf8' });
  expect(unpack.status, unpack.stderr).toBe(0);
  // Reuse installed dependencies while loading all package files from the tarball.
  fs.symlinkSync(path.join(project, 'node_modules'), path.join(root, 'package/node_modules'), 'dir');
  const source = write(root, 'input/api.ts', block('packed.api'));
  const packedCli = path.join(root, 'package/dist/src/cli.js');
  const result = spawnSync(node, [packedCli, '-m', '-o', path.join(root, 'docs'), source], { cwd: root, encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
  expect(fs.readFileSync(path.join(root, 'docs/index.html'), 'utf8')).toContain('id="packed.api"');
  expect(fs.existsSync(path.join(root, 'docs/js/toc-filter.js'))).toBe(true);
  const imported = spawnSync(node, ['--input-type=module', '-e', 'import Commentjs from "./package/dist/src/comment.js"; console.log(new Commentjs({muted:true}).version);'], { cwd: root, encoding: 'utf8' });
  expect(imported.status, imported.stderr).toBe(0); expect(imported.stdout.trim()).toBe(version);
});

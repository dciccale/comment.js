import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';

describe('CLI', () => {
  test('prints the package version', () => {
    const result = spawnSync(process.execPath, ['src/cli.ts', '--version'], {
      encoding: 'utf-8',
    });

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });
});

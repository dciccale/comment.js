#!/usr/bin/env node
import { parseArgs, help } from './options.js';
import { Commentjs } from './comment.js';
import { View } from './view.js';
import { version } from './package-info.js';

try {
  const command = parseArgs(process.argv.slice(2));
  switch (command.kind) {
    case 'help': process.stdout.write(help()); break;
    case 'version': process.stdout.write(`${version}\n`); break;
    case 'generate': {
      const generator = new Commentjs(command.options);
      const data = generator.run();
      if (!data) throw new Error('No source files found');
      new View({ ...command.options, filemap: generator.filemap, data }).render();
      break;
    }
    default: { const exhaustive: never = command; throw new Error(String(exhaustive)); }
  }
} catch (error) {
  process.stderr.write(`commentjs: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}

#!/usr/bin/env node
import * as utils from './utils/index.js';
import { Options } from './options.js';
import { Commentjs } from './comment.js';
import { View } from './view.js';
import type { CommentjsOptions } from './types.js';

const args = process.argv.slice(2);
const options = new Options(args) as CommentjsOptions;
const commentjs = new Commentjs(options);
const data = commentjs.run();

if (data) {
  if (options.scripts && Array.isArray(options.scripts)) {
    data.scripts = options.scripts;
  }

  const viewOptions = utils._.extend(options, {
    filemap: commentjs.filemap,
    data,
  });

  const view = new View(viewOptions);
  view.render();
}

import path from 'node:path';
import { rimrafSync } from 'rimraf';
import * as utils from './utils/index.js';
import { findPackageRoot } from './package-root.js';
import { renderDocumentation, renderSource } from './templates.js';
import type { CommentjsOptions, DocumentationData, FileMap } from './types.js';

interface ViewOptions extends CommentjsOptions {
  filemap: FileMap;
  data: DocumentationData;
  output: string;
  themesdir: string;
  title: string;
  prettify: boolean;
}

export class View {
  options: ViewOptions;
  data: DocumentationData;

  constructor(options: CommentjsOptions) {
    const defaults = {
      filemap: {},
      data: { sections: [], toc: [] },
      output: path.join(process.cwd(), 'docs'),
      themesdir: path.join(findPackageRoot(import.meta.url), 'themes', 'default'),
      title: 'API Documentation',
      prettify: true,
    };

    this.options = utils._.extend({}, defaults, options) as ViewOptions;
    this.data = this.options.data;
    this.data.title = this.data.title || this.options.title;

    if (this.data.scripts && Array.isArray(this.data.scripts)) {
      this.data.scripts = this.data.scripts.map((scriptPath) => path.relative(this.options.output, scriptPath));
    }
  }

  render(): void {
    rimrafSync(this.options.output);
    utils.file.mkdir(this.options.output);
    this.copyAssets();
    this.writeDoc(this.data.docsname || 'index', renderDocumentation(this.data));

    if (this.options.prettify) {
      this.prettify(this.options.filemap);
    }
  }

  private getPath(filename: string): string {
    return path.join(this.options.output, path.basename(filename, path.extname(filename)));
  }

  writeDoc(filename: string, content: string): void {
    const outputFile = `${this.getPath('index')}.html`;
    utils.file.write(outputFile, content);
    utils.log.ok('Saved to', path.relative(process.cwd(), outputFile));
  }

  prettify(filemap: FileMap = this.options.filemap): void {
    for (const filename in filemap) {
      const content = filemap[filename].replace(/\r\n?/gm, '\n');
      const outputFile = `${this.getPath(filename)}-src.html`;
      utils.file.write(outputFile, renderSource(path.basename(filename), content));
      utils.log.ok('Generated source saved to', path.relative(process.cwd(), outputFile));
    }
  }

  copyAssets(): void {
    utils._.forEach(['css', 'js', 'img'], (dir) => {
      const destPath = path.join(this.options.output, dir);
      const assetPath = path.join(this.options.themesdir, dir, '*.*');
      const assets = utils.file.expand(assetPath);

      if (!utils.file.exists(destPath)) {
        utils.file.mkdir(destPath);
      }

      utils._.forEach(assets, (srcPath) => {
        utils.file.copy(srcPath, destPath);
      });
    });

    if (this.options.logo && utils.file.exists(this.options.logo)) {
      utils.file.copy(this.options.logo, path.join(this.options.output, 'img'));
    }
  }
}

import fs from 'node:fs';
import path from 'node:path';
import * as utils from './utils/index.js';
import { findPackageRoot } from './package-root.js';
import { sourcePageNames } from './source-pages.js';
import { writeGeneratedFiles } from './output.js';
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
    this.options = {
      filemap: {}, data: { sections: [], toc: [] }, output: path.join(process.cwd(), 'docs'),
      themesdir: path.join(findPackageRoot(import.meta.url), 'themes', 'default'),
      title: 'API Documentation', prettify: true, ...options,
    };
    this.data = {
      ...this.options.data,
      title: options.title ?? this.options.data.title ?? this.options.title,
      homepage: options.homepage ?? this.options.data.homepage,
      trackingID: options.trackingID ?? this.options.data.trackingID,
      sourceLinks: this.options.prettify,
    };
  }

  render(): void {
    const files = new Map<string, string | Buffer>();
    for (const dir of ['css', 'js', 'img']) {
      const assetDir = path.join(this.options.themesdir, dir);
      if (!utils.file.isDir(assetDir)) throw new Error(`Theme asset directory is missing: ${assetDir}`);
      for (const name of fs.readdirSync(assetDir).sort()) {
        const asset = path.join(assetDir, name);
        if (utils.file.isFile(asset)) files.set(`${dir}/${name}`, fs.readFileSync(asset));
      }
    }
    if (this.options.logo) {
      const name = path.basename(this.options.logo);
      files.set(`img/${name}`, fs.readFileSync(this.options.logo));
      this.data.logo = `img/${encodeURIComponent(name)}`;
    }
    const scripts = this.options.scripts ?? this.options.data.scripts ?? [];
    this.data.scripts = scripts.map((script, index) => {
      if (path.extname(script) !== '.js') throw new Error(`Demo scripts must be browser-ready .js files: ${script}`);
      const name = `${index + 1}-${path.basename(script)}`;
      files.set(`demos/${name}`, fs.readFileSync(script));
      return `demos/${encodeURIComponent(name)}`;
    });
    files.set('index.html', renderDocumentation(this.data));
    if (this.options.prettify) {
      for (const [filename, name] of sourcePageNames(this.options.filemap)) {
        files.set(`${name}-src.html`, renderSource(path.basename(filename), this.options.filemap[filename].replace(/\r\n?/g, '\n')));
      }
    }
    writeGeneratedFiles({
      output: this.options.output, files,
      protectedPaths: [
        ...Object.keys(this.options.filemap), ...scripts, this.options.themesdir,
        ...(this.options.logo ? [this.options.logo] : []),
      ],
    });
    utils.log.ok('Saved to', path.relative(process.cwd(), path.join(this.options.output, 'index.html')));
  }
}

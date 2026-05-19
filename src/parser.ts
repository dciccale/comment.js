import path from 'node:path';
import { tags, type Tag } from './tags/tags.js';
import type { CommentBlock, CommentMap, DocumentationData, FileMap, ParserSection, SectionData, SectionLine, TocItem } from './types.js';

const REGEX_START_COMMENT = /^\s*\/\*\\\s*$/;
const REGEX_END_COMMENT = /^\s*\\\*\/\s*$/;
const REGEX_ROW_DATA = /^\s*(\S)(?:(?!\n)\s(.*))?$/;
const REGEX_LINES = /\n/;

export interface ParserOptions {
  filemap: FileMap;
}

export class Parser {
  private tags = tags;
  private section: ParserSection = { data: {}, current: [], prev: [], mode: '' };
  private sections: SectionLine[][] = [];
  private commentmap: CommentMap = {};
  private toc: TocItem[] = [];
  private utoc: Record<string, number> = {};
  private tocData: Record<string, SectionData> = {};
  private blockData: Record<string, SectionLine[]> = {};
  private lvl: string[] = [];
  private root: Record<string, Record<string, unknown>> = {};
  private pointer: Record<string, Record<string, unknown>> | null = null;
  private docsname?: string;

  constructor(private options: ParserOptions) {}

  parse(filemap = this.options.filemap): DocumentationData {
    this.transform(this.extract(filemap));

    return {
      docsname: this.docsname,
      sections: this.sections,
      toc: this.toc,
    };
  }

  extract(filemap = this.options.filemap): CommentMap {
    let docsname: string | undefined;

    for (const filename in filemap) {
      docsname = docsname || filename;
      const content = filemap[filename].replace(/\r\n?/gm, '\n');
      const lines = content.split(REGEX_LINES);

      for (let i = 0; i < lines.length; i += 1) {
        let line = lines[i];

        if (REGEX_START_COMMENT.test(line)) {
          const commentlines: string[] = [];
          let linenum = i + 1;

          while (i < lines.length && !REGEX_END_COMMENT.test(line)) {
            commentlines.push(line);
            i += 1;
            line = lines[i];
            linenum = i + 2;
          }

          commentlines.shift();
          const comment = commentlines.join('\n');
          this.commentmap[filename] = this.commentmap[filename] || [];
          this.commentmap[filename].push({ comment, line: linenum, filename });
        }
      }
    }

    this.docsname = docsname ? path.basename(docsname) : undefined;
    return this.commentmap;
  }

  processBlock(block: CommentBlock): void {
    const blocklines = block.comment.split(REGEX_LINES);
    let firstline = false;

    for (let i = 0; i < blocklines.length; i += 1) {
      const line = blocklines[i];
      const data = line.match(REGEX_ROW_DATA);

      if (i === 0) {
        firstline = true;
        this.pointer = this.root;
      }

      if (!data) {
        continue;
      }

      const symbol = data[1];
      const value = data[2] || '';

      if (symbol === this.tags.get('text') && firstline) {
        firstline = false;
        const title = value.split('.');
        for (const titlePart of title) {
          this.pointer![titlePart] = (this.pointer![titlePart] || {}) as Record<string, unknown>;
          this.pointer = this.pointer![titlePart] as Record<string, Record<string, unknown>>;
        }

        this.section = {
          data: {
            name: value,
            title: value.replace(/\./g, '-'),
            line: block.line,
            filename: path.basename(block.filename),
            srclink: path.basename(block.filename, path.extname(block.filename)),
            level: title.length + 1,
          },
          current: [],
          prev: [],
          mode: '',
        };
        this.section.current = this.section.prev = [this.section.data as SectionData];
      } else {
        const tag = this.tags.get(symbol) as Tag | null;
        if (!tag) {
          continue;
        }

        if (this.section.mode !== tag.name) {
          this.section.current = this.section.prev;
        }

        tag.process(value, this.section);
        this.section.mode = tag.name;
      }
    }

    if (!this.section.data.name) {
      return;
    }

    this.tocData[this.section.data.name] = this.section.data as SectionData;
    this.blockData[this.section.data.name] = this.section.prev;
  }

  transform(commentmap = this.commentmap): void {
    for (const file in commentmap) {
      const blocks = commentmap[file];
      for (const block of blocks) {
        this.processBlock(block);
      }

      this.generateTOC(this.root);
    }
  }

  generateTOC(pointer: Record<string, unknown>): void {
    const levels = Object.keys(pointer).sort();

    for (const level of levels) {
      this.lvl.push(level);
      const name = this.lvl.join('.');
      const sectionData = this.tocData[name];
      if (!sectionData) {
        this.generateTOC(pointer[level] as Record<string, unknown>);
        this.lvl.pop();
        continue;
      }

      const isMethod = Boolean(sectionData.type && sectionData.type.indexOf('method') + 1);
      const indent = this.lvl.length - 1;
      let brackets = '';

      if (isMethod) {
        if (sectionData.params?.length) {
          brackets = sectionData.params.length === 1 ? `(${sectionData.params[0].join(', ')})` : '(…)';
        } else {
          brackets = '()';
        }
      }

      sectionData.brackets = brackets;

      if (!this.utoc[name]) {
        this.sections.push(this.blockData[name]);
        this.toc.push({
          indent,
          name,
          type: sectionData.type,
          brackets: isMethod ? '()' : '',
        });
        this.utoc[name] = 1;
      }

      this.generateTOC(pointer[level] as Record<string, unknown>);
      this.lvl.pop();
    }
  }
}

export type FileMap = Record<string, string>;

export interface CommentBlock {
  comment: string;
  line: number;
  filename: string;
}

export type CommentMap = Record<string, CommentBlock[]>;

export interface JsonItem {
  key?: string;
  types?: string[];
  optional?: boolean;
  desc?: string;
  start?: string;
  end?: string;
}

export interface ParamItem {
  name: string;
  types: string[];
  desc: string;
  optional?: boolean;
}

export interface ReturnItem {
  types?: string[];
  desc: string | string[];
}

export type SectionLine =
  | SectionData
  | { head: string }
  | { text: string }
  | { params: ParamItem[] }
  | { json: Array<JsonItem | string> }
  | { html: string }
  | { return: ReturnItem }
  | { code: string[] };

export interface SectionData {
  name: string;
  title: string;
  line: number;
  filename: string;
  srclink: string;
  level: number;
  type?: string;
  params?: string[][];
  brackets?: string;
}

export interface ParserSection {
  data: Partial<SectionData>;
  current: SectionLine[] | ParamItem[] | Array<JsonItem | string> | string[];
  prev: SectionLine[];
  mode: string;
}

export interface TocItem {
  indent: number;
  name: string;
  type?: string;
  brackets: string;
}

export interface DocumentationData {
  docsname?: string;
  title?: string;
  homepage?: string;
  logo?: string;
  sections: SectionLine[][];
  toc: TocItem[];
  scripts?: string[];
  trackingID?: string;
}

export interface CommentjsOptions {
  muted?: boolean;
  source?: string | string[];
  extension?: string;
  exclude?: string;
  regex?: string | RegExp | null;
  recurse?: boolean;
  output?: string;
  filemap?: FileMap;
  data?: DocumentationData;
  themesdir?: string;
  title?: string;
  prettify?: boolean;
  scripts?: string[];
  homepage?: string;
  logo?: string;
  trackingID?: string;
}

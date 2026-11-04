# comment.js

Simple API Documentation Generator.

The syntax for writing the comments was inspired by one of the firsts versions of dr.js by Dmitry Baranovskiy.

### Why?
There are some JavaScript and TypeScript documentation generators, but comment.js is different: it is not based on jsdoc syntax and adds a flexible way of writing your docs.

### Demo
Follow the [development steps](#development) to generate and serve the demo locally, or browse the [examples](examples).

## Installation

```bash
$ bun install -g commentjs
```

comment.js is built with TypeScript, Bun, and React server rendering. It targets Node.js 26 or newer. Building and testing require Bun 1.4.0 or newer.

## Usage

### CLI

Use the cli to see the options

```bash
$ commentjs -h
```

#### Basic example

```bash
$ commentjs file1.ts
```

This generates `docs/index.html` and source pages. Set `prettify` to `false` in a JSON configuration to omit source pages and their links.

#### Custom output

```bash
$ commentjs -o api/ file1.ts file2.ts
```

The generator records its files in `.commentjs-manifest.json`. It preserves unrelated files and removes only unchanged files from a previous generation. It refuses to overwrite unrelated or edited files at generated paths.

The output directory must not contain source files, demo scripts, theme assets, or the current working directory. For output from an older version without a manifest, use a new directory or move the old output aside first.

#### Configuration file

A `.json` file can provide configuration. Paths in the configuration are relative to the configuration file. The generator rejects unknown options and invalid values.

```bash
$ commentjs docs.json
```

#### Options

##### title

Type: `string`

The main title for the documentation page, will be rendered in an `<h1>` tag.

```
"title": "My API Documentation"
```

##### logo

Type: `string`

The path of an image to use as the logo displayed in the header of your docs.

```
"logo": "path/to/your/logo.png"
```

##### output

Type: `string`

The output directory for the docs files.

```
"output": "docs"
```

##### source

Type: `string | string[]`

The `.js`, `.ts`, and `.tsx` files to be parsed. This option can be set in several ways:

As a string: `"file1.ts"`.

As an array of files: `["file1.ts", "file2.ts"]`.

##### regex

Type: `string`

Specify a regex to filter the source files.

The regex filters source filenames, including files found in directories. Use a pattern such as `^c_` or a regex literal such as `/^c_/i`.

```
"regex": "^c_"
```

This will only match files starting with `c_`. So that if there is a list of files `["file1.ts", "c_file2.ts"]` inside the directory, the only file that will be parsed is `c_file2.ts`.

##### scripts

Type: `string[]`

The generator copies these browser-ready `.js` files into the output directory. It loads them in the listed order through `<script>` tags. Compile TypeScript scripts to JavaScript first.

```
"scripts": ["c_greet.js", "greet_demo.js"]
```

##### prettify

Type: `boolean`, default: `true`.

Generate source pages and links to implementation lines.

##### homepage

Type: `string`.

The destination of the header logo link.

##### trackingID

Type: `string`.

The ID passed to an existing `window.ga` function. The generator does not load an analytics library.

### Library

```js
import Commentjs from 'commentjs';

const generator = new Commentjs({ source: ['src/'], muted: true });
const data = generator.run();
console.log(data?.toc);
```

`run()` returns parsed documentation data. It returns `null` if no source files match. Each run scans the sources again.

## comment.js block example

```js
/*\
 * Name
 [ type ]
 * Description: use # to write raw html which be rendered as is
 # <ul>
 #  <li>list</li>
 # </ul>
 > Arguments
 - arg1 (string) The first argument (make a link to another section of the doc: @itemname2)
 - arg2 (object) The third argument is an object of `key/value` pairs
 o {
 o  key1 (string) The first key/value
 o  key2 (boolean) The second key/value
 o }
 - arg3 (boolean) #optional The second argument is optional and will be display as itemname(arg1, arg2, [arg3])
 - arg4 (string|function) The third argument can be either a string or a function
 = (object) the return value for the function
 > Usage
 | itemname('example', {
 |    key1: 'hello world',
 |    key2: true
 |  });
\*/
```

### Syntax reference

`/*\` Start a comment.js block.

`*` Renders a paragraph.

`[ type ]` Type of the object, could be one of `method` or `property`.

`#` Renders plain HTML.

`>` Renders a heading.

`-` Renders parameters `paramName` `(type)` `#optional` Param description. Link to other section `@section2`. Words between \`backticks` in the description will render inside a \<code> tag.

\`backticks` Use backticks to highlight code inside paragraphs.

`#optional` Adding `#optional` keyword after the param type will indicate an optional parameter.

`@section2` Use `@` like `@section-name` to create a link to a section named `section-name` inside the docs.

Define an object.
```
o {
o   key1 (string) Description for key1
o   key2 (boolean) Description for key2
o }
```

`=` (type) Description for the returned value.

Use the pipe `|` to render code examples inside a `<pre>` tag that will be highlighted with [google prettify](https://code.google.com/p/google-code-prettify/).
```
| example('example', {
|    key1: 'hello world',
|    key2: true
|  });
```

`\*/` End comment.js block.

Add as many paragraphs, plain html blocks, headings, parameters, objects, returns and code examples as you want.
The generator sorts sections by name. It places each parent before its child sections across all source files. Section names must be unique.

## Development

```bash
bun install
bun run check
bun run test
bun run coverage
bun run build
bun run docs:example
```

`bun run build` bundles the browser scripts and emits JavaScript and TypeScript declarations into `dist/`.
Edit `themes/default/css/docs.css` to change the default theme.
`bun run docs:example` generates a local preview at `docs/example-simple/index.html`.
`bun run serve:docs` starts a local HTTP server and prints its address.
The tests cover generation through the built Node CLI, all samples, and browser-script behavior.
GitHub Actions runs the checks with Node.js 26.

## Author
Denis Ciccale ([@tdecs](http://twitter.com/tdecs))

## License
See [LICENSE.txt](https://raw.github.com/dciccale/comment.js/master/LICENSE.txt)

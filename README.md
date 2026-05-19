# comment.js

Simple API Documentation Generator.

The syntax for writing the comments was inspired by one of the firsts versions of dr.js by Dmitry Baranovskiy.

### Why?
There are some JavaScript and TypeScript documentation generators, but comment.js is different: it is not based on jsdoc syntax and adds a flexible way of writing your docs.

### Demo
You can see a live example at http://api.kimbojs.com

Or browse the [examples](examples) directory

## Installation

```bash
$ bun install -g commentjs
```

comment.js is built with TypeScript, Bun, and React server rendering. It targets Node.js 26 or newer.

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

This will generate `docs/index.html` plus source-code pages when prettify is enabled.

#### Custom output

```bash
$ commentjs -o api/ file1.ts file2.ts
```

#### Configuration file

A `.json` file can be provided for configuration.

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

In the case that the `output` option is a directory, this regex will be used to filter the files inside this directory.

```
"regex": "^c_"
```

This will only match files starting with `c_`. So that if there is a list of files `["file1.ts", "c_file2.ts"]` inside the directory, the only file that will be parsed is `c_file2.ts`.

##### scripts

Type: `string[]`

All script files in the `scripts` option will be appended with a `<script>` tag at the bottom of the generated `html`. This allows having live demos.

```
"scripts": ["c_greet.ts", "greet_demo.ts"]
```

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
| function example('example', {
|    key1: 'hello world',
|    key2: true
|  });
```

`\*/` End comment.js block.

Add as many paragraphs, plain html blocks, headings, parameters, objects, returns and code examples as you want.
The documentation will be generated following the order of the comments.

## Development

```bash
bun install
bun run check
bun test
bun run build
bun run docs:example
```

`bun run build` replaces the old Grunt workflow: it compiles Stylus assets and emits TypeScript declarations and JavaScript into `dist/`.
`bun run docs:example` generates a local preview at `docs/example-simple/index.html`.

## Author
Denis Ciccale ([@tdecs](http://twitter.com/tdecs))

## License
See [LICENSE.txt](https://raw.github.com/dciccale/comment.js/master/LICENSE.txt)

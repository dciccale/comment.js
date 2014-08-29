# comment.js

Simple API Documentation Generator.

The syntax for writing the comments was inspired by one of the firsts versions of dr.js by Dmitry Baranovskiy.

### Why?
There are some javascript documentation generators, but comment.js is different, it is not based on jsdoc syntax (get over it) and adds a very flexible and creative way of writing your docs.

You can see a live example at http://api.kimbojs.com

## Installation

```bash
$ npm intall -g commentjs
```

## Usage

### CLI

Use the cli to see the options

```bash
$ commentjs -h
```

#### Basic example

```bash
$ commentjs file1.js
```

This will generate 1 html file in the default output directory `docs/`. `docs/file1.html`.

#### Custom output

```bash
$ commentjs -o api/ file1.js file2.js
```

#### Configuration file

A `.json` file can be provided for configuration.

```bash
$ commentjs docs.json
```

#### Options

##### title

Type: `String`

The main title for the documentation page, will be rendered in an `<h1>` tag.

```
"title": "My API Documentation"
```

##### logo

Type: `String`

The path of an image to use as the logo displayed in the header of your docs.

```
"logo": "path/to/your/logo.png"
```

##### output

Type: `String`

The output directory for the docs files.
If only a directory name is provided, the generated `html` file will be named the same as the directory.
But also a full path can be specified, for instance `docs/index.html`.

```
"output": "docs" // Will generate docs/docs.html
"output": "docs/index.html" // Will generate docs/index.html
```

##### source

Type: `String|Array`

The `.js` files to be parsed. This option can be setted in several ways:

As a string: `"file1.js"`.

As an array of files: `["file1.js", "file2.js"]`.

As an array with objects:

```
"source": [{
  "path": "file1.js"
}, {
  "path": "file2.js"
}]
```

Using an array of objects there is an extra option called `link` which tells comment.js to what source link the definitions.

If no link is provided `commentjs` will generate a beautiful view of the source code and will link definitions to this file using prettify.

```
"source": [{
  "path": "xxspubsub.js",
  "link": "https://github.com/dciccale/xxspubsub/blob/master/xxspubsub.js"
}]
```

##### regex

Type: `RegExp`

Specify a regex to filter the source files.

In the case that the `output` option is a directory, this regex will be used to filter the files inside this directory.

```
"regex": "^c_"
```

This will only match files starting with `c_`. So that if there is a list of files `["file1.js", "c_file2.js"]` inside the directory, the only file that will be parsed is `c_file2.js`.

##### scripts

Type: `Array`

All script files in the `scripts` option will be appended with a `<script>` tag at the bottom of the generated `html`. This allows having live demos.

```
"scripts": ["c_greet.js", "greet_demo.js"]
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

`[type]` Type of the object, could be one of `method` or `property`.

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

## Examples

See [examples](examples).

## Author
Denis Ciccale ([@tdecs](http://twitter.com/tdecs))

## License
See [LICENSE.txt](https://raw.github.com/dciccale/comment.js/master/LICENSE.txt)

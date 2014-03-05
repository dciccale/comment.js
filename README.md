# comment.js

Simple API Documentation Generator.

Inspired by one of the firsts versions of dr.js by Dmitry Baranovskiy.

At that moment dr.js was not as powerful or flexible enough for me and I made some PRs but there was little people concerned so I decided making this fork with the idea to keep improving it as a different library.
I hope no remorse for taking the awesome and fun syntax for writing the comments :)

## Installation

```bash
$ npm install -g commentjs
```

## Usage

#### Basic example

```bash
$ commentjs file1.js file2.js
```

This will generate 2 html files in the default output directory `docs/`. `docs/file1.html` and `docs/file2.html`.

#### Custom output

```bash
$ commentjs file1.js file2.js -o api/
```

#### Configuration file

A `.json` file can be provided for configuration.

#### Options

##### title

Type: `String`

The main title for the documentation page, will be rendered in an `<h1>` tag.

```
"title": "My API Documentation"
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

If no link is provided `commentjs` will generate a beautiful view of the source code and will link definitions to this file.

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


#### Configuration file examples

See the [examples](examples) directory and run `commentjs` passing one of the config files to see the results.

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
ex
`-` `param` `(type)` `#optional` Param description see `@section2`. Words between \`backticks` will be rendered inside a \<code> tag.

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

See in [examples](examples).

## Author
Denis Ciccale ([@tdecs](http://twitter.com/tdecs))

## License
See [LICENSE.txt](https://raw.github.com/dciccale/comment.js/master/LICENSE.txt)

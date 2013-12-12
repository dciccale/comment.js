/*!
 * comment.js
 * Copyright (c) 2012 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var path = require('path');
var eve = require('eve');
var utils = require('./utils');

// forEach helper
function forEach(arr, callback) {
  var i, l = arr.length, res;
  for (i = 0; i < l; i++) {
    res = callback.call(arr[i], arr[i], i, arr);
    if (res === false) {
      break;
    } else if (res === true) {
      continue;
    }
  }
  return arr;
}

/*\
 * commentjs
 [ method ]
 * Parses comments from the given string and generates two HTML sources.
 > Arguments
 - content (string) source code
 - filename (string) filename of the given source
 - sourceFileName (string) link to line in source code
 = (object)
 o {
 o   sections (number) Number of comment sections found
 o   loc (number) Number of lines of code in source file
 o   chunks (object) Object containing each section by name
 o   toc (string) HTML for the documentation file
 o   source (string) HTML for the highlighted source file, it will be linked from the doc as
 `basename + "-src.html"`, i.e. if filename is "comment.js", then it will be "comment-src.html"
 o   title (string) The title of your docs that will appear in the generated html file.
 o }
\*/
function docprocessor(content, filename, sourceFileName, generateSource) {
  var docsTitle = content.match(/^[^"]*"([^"]+)"/),
    rdoc = /\/\*\\[\s\S]+?\\\*\//g,
    rows = /^\s*(\S)(?:(?!\n)\s(.*))?$/,
    rcode = /`([^`]+)`/g,
    // external link
    rhref = /(https?:\/\/[^\s"]+[\d\w_\-\/])/g,
    // link documentation section using @section
    rlink = /(^|\s)@([\w\.\_\$\(\)…]*[\w\_\$\(\)])/g,
    ramp = /&(?!\w+;|#\d+;|#x[\da-f]+;)/gi,
    // /*\
    rbegin = /^\s*\/\*\\\s*$/,
    // \*/
    rend = /^\s*\\\*\/\s*$/,
    cjsblocks = content.match(rdoc),
    doclines,
    root = {},
    mode,
    html,
    src = [],
    TOC = [],
    utoc = {},
    chunks = {},
    out = {},
    itemData,
    lvl = [],
    res = '',
    regexOptionalParam = /#optional\s*/g,
    srcTemplate, compiledSrcTemplate;

  // No commentjs blocks
  if (!cjsblocks) {
    return {};
  }

  if (generateSource) {
    srcTemplate = utils.file.read(path.resolve(path.normalize(__dirname), 'template/src', 'template-src.html'));
    compiledSrcTemplate = utils.template.compile(srcTemplate);
  }

  // Formats text into html
  function format(text) {
    return String(text)
      .replace(/</g, '&lt;')
      .replace(ramp, '<em class="amp">&amp;</em>')
      .replace(rcode, '<code class="prettyprint">$1</code>')
      .replace(rlink, '$1<a href="#$2" class="cjs-link">$2</a>')
      .replace(rhref, '<a href="$1" rel="external">$1</a>');
  }

  function formatType(type) {
    return '<em class="cjs-type-' + type + '">' + type + '</em>';
  }

  function getParamDescTag(text, tag) {
    tag = tag || 'span';
    return '<' + tag + ' class="cjs-param-desc">' + (format(text) || '&#160;') + '</' + tag + '>';
  }

  function getOptionalParamTag() {
    return '<em class="cjs-param-optional">optional</em>';
  }

  function getTypes(txt) {
    var types = txt.split(/\s*\|\s*/);

    return types.map(formatType);
  }

  // Closing tags
  eve.on('doc.*.list', function (/* mod, text */) {
    if (this !== '-') {
      html += '</dl>';
    }
  });

  eve.on('doc.*.json', function (/* mod, text */) {
    if (this !== 'o') {
      html += '</ul>';
    }
  });

  eve.on('doc.*.text', function (/*mod, text*/) {
    if (this !== '*') {
      html += '</p>';
    }
  });

  eve.on('doc.*.head', function (/*mod, text*/) {
    if (this !== '*') {
      html += '</p>';
    }
  });

  eve.on('doc.*.code', function (/*mod, text*/) {
    if (this !== '|') {
      html += '</code></pre>';
    }
  });


  // Text
  eve.on('doc.s*.*', function (mod, text) {
    if (mode !== 'text') {
      html += '<p>';
    }
    if (text) {
      html += format(text);
    } else {
      html += '</p>\n<p>';
    }
    mode = 'text';
  });


  // Code
  eve.on('doc.s|.*', function (mod, text) {
    var txt = text === undefined ? '' : format(text);
    if (mode !== 'code') {
      html += '<pre class="prettyprint linenums"><code>';
    }
    html += txt + '\n';
    mode = 'code';
  });


  // Plain html
  eve.on('doc.s#.*', function (mod, text) {
    html += text + '\n';
    mode = 'html';
  });


  // Headers
  eve.on('doc.s>.*', function (mod, text) {
    if (mode !== 'head') {
      html += '<p class="cjs-header">';
    }
    html += format(text);
    mode = 'head';
  });


  // Object type [method], [property]
  eve.on('doc.s[.*', function (mod, text) {
    var type;

    text = format(text).replace(/\(([^\)]+)\)/, function (all, t) {
      type = t;
      return '';
    });

    itemData.type = text.replace(/\s*\]\s*$/, '').split(/\s*,\s*/);
    itemData.clas = 'cjs-' + itemData.type.join(' cjs-');

    if (type) {
      html += '<span class="cjs-type">' + formatType(type) + '</span>';
    }
    mode = '';
  });


  // Return
  eve.on('doc.s=.*', function (mod, text) {
    var split = text.split(/(\s*[\(\)]\s*)/),
      types;

    split.shift();
    split.shift();

    types = getTypes(split.shift());

    split.shift();

    html += '<p class="cjs-return">';
    html += '<strong class="cjs-header">Returns</strong> ';
    html += types.join(' ') + ' ' + getParamDescTag(split.join('')) + '</p>';
    mode = '';
  });


  // Arguments
  eve.on('doc.s-.*', function (mod, text) {
    itemData.params = itemData.params || [];

    if (mode !== 'list') {
      html += '<dl class="cjs-arguments">';
      itemData.params.push([]);
    }

    var optional,
      data = itemData.params[itemData.params.length - 1],
      types;

    // check if its optional parameter
    text = text.replace(regexOptionalParam, function () {
      optional = true;
      return '';
    });

    var split = text.split(/(\s*[\(\)]\s*)/);
    var paramName = split.shift();

    html += '<dt class="cjs-param' + (optional ? ' cjs-param-optional' : '') + '">' + paramName + '</dt>';

    if (optional) {
      paramName = '[' + paramName + ']';
    }
    data.push(paramName);

    split.shift();

    // param type
    types = getTypes(split.shift());

    split.shift();

    html += '<dd class="cjs-type">';

    if (optional) {
      types.push(getOptionalParamTag());
    }

    html += types.join(' ') + '</dd>';
    html += getParamDescTag(split.join(''), 'dd');
    mode = 'list';
  });


  // JSON object
  eve.on('doc.so.*', function (mod, text) {
    var desc = text.match(/^\s*([^\(\s]+)\s*\(([^\)]+)\)\s*(.*?)\s*$/),
      start = text.match(/\s*\{\s*$/),
      end = text.match(/\s*\}\s*,?\s*$/),
      types,
      optional;

    if (mode !== 'json') {
      html += '<ul class="cjs-json">';
    }

    if (!end) {
      html += '<li>';
    }


    if (desc) {
      desc.shift();
      html += '<span class="cjs-json-key">' + desc.shift() + '</span>';

      types = getTypes(desc.shift());

      html += '<span class="cjs-type">';

      // check if its optional parameter
      desc = desc.shift().replace(regexOptionalParam, function () {
        optional = true;
        return '';
      });

      if (optional) {
        types.push(getOptionalParamTag());
      }

      html += types.join(' ') + '</span>';
      html += getParamDescTag(desc);

    } else if (!end) {
      html += text;
    }
    if (start) {
      html += '<ul class="cjs-json">';
    }
    if (end) {
      html += '</ul></li>';
      html += '<li>' + text + '</li>';
    }
    mode = 'json';
  });


  // split document content by lines
  doclines = content.split('\n');

  var pointer,
    firstline = false,
    inside = false;

  // loop through each line on the document
  forEach(doclines, function (line, i) {

    // pritty output source code
    if (generateSource) {
      src[i] = utils.prettify(line);
    }

    if (line.match(rbegin)) {
      inside = firstline = true;
      pointer = root;
      itemData = {};
      html = '';
      mode = '';
      return true;
    }

    if (line.match(rend)) {
      inside = false;
      eve('doc.end.' + mode, null, mode, '');
      itemData.line = i + 1;

      (function (value, data, pointer) {
        eve.on('doc.item', function () {
          if (this === pointer) {
            html += value;
            itemData = data;
          }
        });
      }(html, itemData, pointer));

      return true;
    }

    if (inside) {
      var data = line.match(rows), symbol, text, title;

      if (data) {
        symbol = data[1];
        text = data[2];

        if (symbol === '*' && firstline) {
          firstline = false;
          title = text.split('.');
          forEach(title, function (tit) {
            pointer = pointer[tit] = pointer[tit] || {};
          });
        } else {
          eve('doc.s' + symbol + '.' + mode, symbol, mode, text);
        }
      }

    }
  });

  html = '';

  var runner = function (pointer, hx) {
    var level = [], node;

    for (node in pointer) {
      level.push(node);
    }

    // sort alphabetically and format data
    level.sort().forEach(function (_level) {
      lvl.push(_level);
      var name = lvl.join('.'),
        chunk = '';

      html = '';
      itemData = {};
      eve('doc.item', pointer[_level]);

      //--------------
      // section
      chunk += '<div class="cjs-section ' + name.replace(/\./g, '-') + '-section">';

      //--------------
      // open title
      chunk += '<h' + hx + ' id="' + name + '" class="cjs-title ' + itemData.clas + '">' + name;

      //--------------
      // function args
      var isMethod = itemData.type && itemData.type.indexOf('method') + 1;
      if (isMethod) {
        if (itemData.params) {
          if (itemData.params.length === 1) {
            chunk += '(' + itemData.params[0].join(', ') + ')';
          } else {
            chunk += '(\u2026)';
          }
        } else {
          chunk += '()';
        }
      }

      //--------------
      // hash link
      chunk += '<a href="#' + name + '" title="Link to this section" class="cjs-hash">#</a>';

      //--------------
      // source link
      var filenameIndicated = sourceFileName.match(/\-src\.html/) ? filename : sourceFileName;
      if (itemData.line) {
        chunk += '<span class="cjs-sourceline">Defined in: ' +
          '<a title="Go to line ' + itemData.line +
          ' in the source" href="' + sourceFileName + '#L' + itemData.line + '">' +
          path.basename(filenameIndicated) + ':' + itemData.line + '</a></span>';
      }

      chunk += '</h' + hx + '>';
      // close title
      //--------------

      //--------------
      // section content
      chunk += html;

      chunk += '</div>';
      // end section
      //--------------

      chunks[name] = chunks[name] || '';
      chunks[name] += chunk;
      res += chunk;

      //--------------
      // TOC

      var indent = 0;
      name.replace(/\./g, function () {
        indent++;
      });

      if (!utoc[name]) {
        TOC.push({
          indent: indent,
          name: name,
          clas: itemData.clas || '',
          brackets: isMethod ? '()' : ''
        });
        utoc[name] = 1;
      }

      runner(pointer[_level], hx + 1);
      lvl.pop();
    });
  };

  runner(root, 2);

  // Output
  out = {
    sections: cjsblocks.length,
    loc: doclines.length,
    chunks: chunks,
    toc: TOC,
    title: docsTitle ? docsTitle[1] : '',
    source: generateSource ? compiledSrcTemplate({title: path.basename(filename), src: src}) : null
  };

  eve.unbind('doc.*');
  return out;
}

module.exports = docprocessor;

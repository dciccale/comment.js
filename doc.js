/*!
 * comment.js 0.0.1 - API Documentation builder
 * Copyright (c) 2012 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */
var fs = require("fs"),
  path = require("path"),
  eve = require("eve");

// forEach helper
function forEach(arr, callback) {
  var i, l = arr.length;
  for (i = 0; i < l; i++) {
    var res = callback.call(arr[i], arr[i], i, arr);
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
- txt (string) source code
- filename (string) filename of the given source
= (object)
o {
o   sections (number) number of comment sections found
o   loc (number) number of lines of code in source file
o   doc (string) HTML for the documentation file
o   source (string) HTML for the highlighted source file, it will be linked from the doc as `basename + "-src.html"`, i.e. if filename is “comment.js”, then it will be “comment-src.html”
o }
\*/
module.exports = function (txt, filename, sourceFileName) {
  var Title = txt.match(/^[^"]*"([^"]+)"/),
    rdoc = /\/\*\\[\s\S]+?\\\*\//g,
    rows = /^\s*(\S)(?:(?!\n)\s(.*))?$/,
    rcode = /`([^`]+)`/g,
    rkeywords = /\b(abstract|boolean|break|byte|case|catch|char|class|const|continue|debugger|default|delete|do|double|else|enum|export|extends|false|final|finally|float|for|function|goto|if|implements|import|in|instanceof|int|interface|long|native|new|null|package|private|protected|public|return|short|static|super|switch|synchronized|this|throw|throws|transient|true|try|typeof|var|void|volatile|while|with|undefined)\b/g,
    rstrings = /("[^"]*?(?:\\"[^"]*?)*"|'[^']*?(?:\\'[^']*?)*')/g,
    roperators = /( \= | \- | \+ | % | \* | \&\& | \&amp;\&amp; | \& | \&amp; | \|\| | \| | \/ | == | === )/g,
    rdigits = /(\b(0[xX][\da-fA-F]+)|((\.\d+|\b\d+(\.\d+)?)(?:e[-+]?\d+)?))\b/g,
    rcomments = /(\/\/.*?(?:\n|$)|\/\*(?:.|\s)*?\*\/)$/g,
    rhref = /(https?:\/\/[^\s"]+[\d\w_\-\/])/g,
    rlink = /(^|\s)@([\w\.\_\$]*[\w\_\$])/g,
    ramp = /&(?!\w+;|#\d+;|#x[\da-f]+;)/gi,
    main = txt.match(rdoc),
    root = {},
    mode,
    html,
    jsonLevel = 0,
    src = "",
    list = [[]],
    curlist = list[0],
    srcfilename = sourceFileName || (path.basename(filename, path.extname(filename)) + "-src.html"),
    clas = "",
    TOC = [],
    utoc = {},
    chunks = {},
    out = {};

  if (!main) {
    return {};
  }

  function esc(text) {
    return String(text)
      .replace(/</g, "&lt;")
      .replace(ramp, '<em class="amp">&amp;</em>')
      .replace(rcode, "<code>$1</code>")
      .replace(rlink, '$1<a href="#$2" class="cjs-link">$2</a>')
      .replace(rhref, '<a href="$1" rel="external">$1</a>');
  }

  function syntax(text) {
    return text.replace(/</g, "&lt;")
      .replace(ramp, "&amp;")
      .replace(rkeywords, "<b>$1</b>")
      .replace(rstrings, "<i>$1</i>")
      .replace(roperators, '<span class="s">$1</span>')
      .replace(rdigits, '<span class="d">$1</span>')
      .replace(rcomments, '<span class="c">$1</span>') + "\n";
  }

  function syntaxSrc(text) {
    var isend = text.match(/\*\//);
    if (text.match(/\/\*/)) {
      syntaxSrc.inc = true;
    }

    var out = text.replace(/</g, "&lt;")
      .replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, "&amp;")
      .replace(rkeywords, "<b>$1</b>")
      .replace(rstrings, "<i>$1</i>")
      .replace(roperators, '<span class="s">$1</span>')
      .replace(rdigits, '<span class="d">$1</span>')
      .replace(/(\/\*(?:.(?!\*\/))+(?:\*\/)?)/g, '<span class="c">$1</span>')
      .replace(rcomments, '<span class="c">$1</span>') + "\n";

    if (syntaxSrc.inc) {
      out = out.replace(/(^.*\*\/)/, '<span class="c">$1</span>');
      if (!isend) {
        out = '<span class="c">' + out + '</span>';
      }
    }
    if (isend) {
      syntaxSrc.inc = false;
    }
    return out;
  }

  eve.on("doc.*.list", function (mod, text) {
    this != "-" && (html += "</dl>\n");
  });

  eve.on("doc.*.json", function (mod, text) {
    this != "o" && (html += "</ol>\n");
  });

  eve.on("doc.*.text", function (mod, text) {
    this != "*" && (html += "</p>\n");
  });

  eve.on("doc.*.head", function (mod, text) {
    this != "*" && (html += "</p>\n");
  });

  eve.on("doc.*.code", function (mod, text) {
    this != "|" && (html += "</code></pre>\n");
  });

  eve.on("doc.s*.*", function (mod, text) {
    mode != "text" && (html += "<p>");
    if (text) {
      html += esc(text) + "\n";
    } else {
      html += "</p>\n<p>";
    }
    mode = "text";
  });

  eve.on("doc.s|.*", function (mod, text) {
    mode != "code" && (html += '<pre class="javascript code"><code>');
    html += syntax(text);
    mode = "code";
  });

  eve.on("doc.s#.*", function (mod, text) {
    html += text + "\n";
    mode = "html";
  });

  eve.on("doc.s>.*", function (mod, text) {
    mode != "head" && (html += '<p class="header">');
    html += esc(text) + "\n";
    mode = "head";
  });

  eve.on("doc.s[.*", function (mod, text) {
    var type;

    text = esc(text)
      .replace(/\(([^\)]+)\)/, function (all, t) {
      type = t;
      return "";
    });

    itemData.type = esc(text)
      .replace(/\s*\]\s*$/, "")
      .split(/\s*,\s*/);
    clas = itemData.clas = "cjs-" + itemData.type.join(" cjs-");
    html += '<div class="' + clas + '">';
    type && (html += '<em class="cjs-type cjs-type-' + type + '">' + type + '</em>');
    mode = "";
  });

  eve.on("doc.end.*", function (mod, text) {
    clas && (html += "</div>");
  });

  eve.on("doc.s=.*", function (mod, text) {
    var split = text.split(/(\s*[\(\)]\s*)/);
    split.shift();
    split.shift();
    var types = split.shift()
      .split(/\s*\|\s*/);
    split.shift();
    html += '<p class="cjs-returns"><strong class="cjs-title">Returns:</strong> ';

    forEach(types, function (_type, i) {
      types[i] = '<em class="cjs-type-' + _type + '">' + _type + '</em>';
    });

    html += types.join(" ") + ' <span class="cjs-description">' + esc(split.join("")) + "</span></p>\n";
    mode = "";
  });

  eve.on("doc.s-.*", function (mod, text) {
    itemData.params = itemData.params || [];

    if (mode != "list") {
      html += '<dl class="cjs-parameters">';
      itemData.params.push([]);
    }

    var optional,
    data = itemData.params[itemData.params.length - 1];

    text = text.replace(/#optional\s*/g, function () {
      optional = true;
      return "";
    });

    split = text.split(/(\s*[\(\)]\s*)/);
    data.push((optional ? "[" : "") + split[0] + (optional ? "]" : ""));
    html += '<dt class="cjs-param' + (optional ? " optional" : "") + '">' + split.shift() + '</dt>\n';
    split.shift();

    if (optional) {
      html += '<dd class="cjs-optional">optional</dd>\n';
    }

    var types = split.shift().split(/\s*\|\s*/);
    split.shift();
    html += '<dd class="cjs-type">';

    forEach(types, function (_type, i) {
      types[i] = '<em class="cjs-type-' + _type + '">' + _type + '</em>';
    });

    html += types.join(" ") + '</dd>\n<dd class="cjs-description">' + (esc(split.join("")) || "&#160;") + '</dd>\n';
    mode = "list";
  });

  eve.on("doc.so.*", function (mod, text) {
    if (mode != "json") {
      html += '<ol class="cjs-json">';
    }
    var desc = text.match(/^\s*([^\(\s]+)\s*\(([^\)]+)\)\s*(.*?)\s*$/),
      start = text.match(/\s*\{\s*$/),
      end = text.match(/\s*\}\s*,?\s*$/);

    !end && (html += "<li>");

    if (desc) {
      html += '<span class="cjs-json-key">' + desc[1] + '</span>';
      var types = desc[2].split(/\s*\|\s*/);
      html += '<span class="cjs-type">';

      forEach(types, function (_type, i) {
        types[i] = '<em class="cjs-type-' + _type + '">' + _type + '</em>';
      });

      html += types.join(" ") + '</span><span class="cjs-json-description">' + (esc(desc[3]) || "&#160;") + '</span>\n';
    } else {
      !end && (html += text);
    }
    if (start) {
      html += '<ol class="cjs-json">';
    }
    if (end) {
      html += '</ol></li><li>' + text + '</li>';
    }
    mode = "json";
  });

  // total commentjs blocks
  out.sections = main.length;
  // split document content by lines
  main = txt.split("\n");
  // lines of code
  out.loc = main.length;

  var rbegin = /^\s*\/\*\\\s*$/,
    rend = /^\s*\\\*\/\s*$/,
    line = 0,
    pointer,
    firstline = false,
    inside = false;

  // loop through each line on the document
  forEach(main, function (doc) {
    line++;
    // pritty output source code
    src += '<code id="L' + line + '"><span class="ln">' + line + '</span>' + syntaxSrc(doc) + '</code>';

    if (doc.match(rbegin)) {
      inside = firstline = true;
      pointer = root;
      itemData = {};
      html = "";
      mode = "";
      return true;
    }

    if (doc.match(rend)) {
      inside = false;
      eve("doc.end." + mode, null, mode, "");
      itemData.line = line + 1;

      (function (value, data, pointer) {
        eve.on("doc.item", function () {
          if (this == pointer) {
            html += value;
            itemData = data;
          }
        });
      })(html, itemData, pointer);

      clas = "";
      return true;
    }

    if (inside) {
      var title,
      data = doc.match(rows);
      if (data) {
        var symbol = data[1],
          text = data[2];
        if (symbol == "*" && firstline) {
          firstline = false;
          title = text.split(".");
          forEach(title, function (tit) {
            pointer = pointer[tit] = pointer[tit] || {};
          });
        } else {
          eve("doc.s" + symbol + "." + mode, symbol, mode, text);
        }
      }
    }
  });


  html = "";
  var lvl = [],
    toc = "",
    itemData,
    res = "";

  var runner = function (pointer, hx) {
    var level = [];

    for (var node in pointer) {
      level.push(node);
    }

    // sort alphabetically
    level.sort();

    forEach(level, function (_level) {
      lvl.push(_level);
      var name = lvl.join("."),
        chunk = '';

      html = "";
      itemData = {};
      eve("doc.item", pointer[_level]);

      chunk += '<div class="' + name.replace(/\./g, "-") + '-section"><h' + hx + ' id="' + name + '" class="' + itemData.clas + '"><i class="cjs-trixie">&#160;</i>' + name;

      var isMethod = itemData.type && itemData.type.indexOf("method") + 1;

      if (isMethod) {
        if (itemData.params) {
          if (itemData.params.length == 1) {
            chunk += "(" + itemData.params[0].join(", ") + ")";
          } else {
            chunk += "(\u2026)";
          }
        } else {
          chunk += "()";
        }
      }

      chunk += '<a href="#' + name + '" title="Link to this section" class="cjs-hash">✰</a>';
      if (itemData.line) {
        chunk += '<a class="cjs-sourceline" title="Go to line ' + itemData.line + ' in the source" href="' + srcfilename + '#L' + itemData.line + '">&#x27ad;</a>'
      }
      chunk += '</h' + hx + '>\n';
      chunk += '<div class="extra" id="' + name + '-extra"></div></div>';
      chunk += html;
      chunks[name] = chunks[name] || "";
      chunks[name] += chunk;
      res += chunk;
      var indent = 0;
      name.replace(/\./g, function () {
        indent++;
      });

      var brackets = isMethod ? '()' : '';
      toc += '<li class="cjs-lvl' + indent + '"><a href="#' + name + '" class="' + itemData.clas + '"><span>' + name + brackets + '</span></a></li>';

      if (!utoc[name]) {
        TOC.push({
          indent: indent,
          name: name,
          clas: itemData.clas,
          brackets: brackets
        });
        utoc[name] = 1;
      }
      runner(pointer[_level], hx + 1);
      lvl.pop();
    });
  };

  runner(root, 2);
  out.chunks = chunks;
  out.toc = TOC;
  out.title = Title ? Title[1] : "";
  out.source = '<!DOCTYPE html>'
             + '\n<!-- Generated with comment.js -->'
             + '\n<html lang="en">'
             + '<head><meta charset="utf-8">'
             + '<title>' + path.basename(filename) + '</title>'
             + '<link rel="stylesheet" href="../comment.css">'
             + '</head>'
             + '<body id="src-cjs-js">' + src + '</body>'
             + '</html>';

  eve.unbind("doc.*");
  return out;
};
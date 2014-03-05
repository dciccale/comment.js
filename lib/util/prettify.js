/*!
 * comment.js
 * Copyright (c) 2014 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var REGEX_KEYWORDS = /\b(abstract|boolean|break|byte|case|catch|char|class|const|continue|debugger|default|delete|do|double|else|enum|export|extends|false|final|finally|float|for|function|goto|if|implements|import|in|instanceof|int|interface|long|native|new|null|package|private|protected|public|return|short|static|super|switch|synchronized|this|throw|throws|transient|true|try|typeof|var|void|volatile|while|with|undefined)\b/g;
var REGEX_STRINGS = /("[^"]*?(?:\\"[^"]*?)*"|'[^']*?(?:\\'[^']*?)*')/g;
var REGEX_OPERATORS = /( \= | \- | \+ | % | \* | \&\& | \&amp;\&amp; | \& | \&amp; | \|\| | \| | \/ | == | === )/g;
var REGEX_DIGITS = /(\b(0[xX][\da-fA-F]+)|((\.\d+|\b\d+(\.\d+)?)(?:e[\-+]?\d+)?))\b/g;
var REGEX_COMMENTS = /(\/\/.*?(?:\n|$)|\/\*(?:.|\s)*?\*\/)$/g;
var REGEX_AMP = /&(?!\w+;|#\d+;|#x[\da-f]+;)/gi;

exports.prettify = function (text) {
  var isend = text.match(/\*\//);
  var output;

  if (text.match(/\/\*/)) {
    this.inc = true;
  }

  output = text.replace(/</g, '&lt;')
    .replace(REGEX_AMP, '&amp;')
    .replace(REGEX_KEYWORDS, '<span class="kwd">$1</span>')
    .replace(REGEX_STRINGS, '<span class="str">$1</span>')
    .replace(REGEX_OPERATORS, '<span class="op">$1</span>')
    .replace(REGEX_DIGITS, '<span class="lit">$1</span>')
    .replace(/(\/\*(?:.(?!\*\/))+(?:\*\/)?)/g, '<span class="com">$1</span>')
    .replace(REGEX_COMMENTS, '<span class="com">$1</span>') + '\n';

  if (this.inc) {
    output = output.replace(/(^.*\*\/)/, '<span class="com">$1</span>');

    if (!isend) {
      output = '<span class="com">' + output + '</span>';
    }
  }

  if (isend) {
    this.inc = false;
  }

  return output;
};

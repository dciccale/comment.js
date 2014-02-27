/*!
 * comment.js
 * Copyright (c) 2012 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var rkeywords = /\b(abstract|boolean|break|byte|case|catch|char|class|const|continue|debugger|default|delete|do|double|else|enum|export|extends|false|final|finally|float|for|function|goto|if|implements|import|in|instanceof|int|interface|long|native|new|null|package|private|protected|public|return|short|static|super|switch|synchronized|this|throw|throws|transient|true|try|typeof|var|void|volatile|while|with|undefined)\b/g,
  rstrings = /("[^"]*?(?:\\"[^"]*?)*"|'[^']*?(?:\\'[^']*?)*')/g,
  roperators = /( \= | \- | \+ | % | \* | \&\& | \&amp;\&amp; | \& | \&amp; | \|\| | \| | \/ | == | === )/g,
  rdigits = /(\b(0[xX][\da-fA-F]+)|((\.\d+|\b\d+(\.\d+)?)(?:e[\-+]?\d+)?))\b/g,
  rcomments = /(\/\/.*?(?:\n|$)|\/\*(?:.|\s)*?\*\/)$/g,
  ramp = /&(?!\w+;|#\d+;|#x[\da-f]+;)/gi;

exports.prettify = function (text) {
  var isend = text.match(/\*\//), out;

  if (text.match(/\/\*/)) {
    this.inc = true;
  }

  out = text.replace(/</g, '&lt;')
    .replace(ramp, '&amp;')
    .replace(rkeywords, '<span class=kwd>$1</span>')
    .replace(rstrings, '<span class="str">$1</span>')
    .replace(roperators, '<span class="op">$1</span>')
    .replace(rdigits, '<span class="lit">$1</span>')
    .replace(/(\/\*(?:.(?!\*\/))+(?:\*\/)?)/g, '<span class="com">$1</span>')
    .replace(rcomments, '<span class="com">$1</span>') + '\n';

  if (this.inc) {
    out = out.replace(/(^.*\*\/)/, '<span class="com">$1</span>');
    if (!isend) {
      out = '<span class="com">' + out + '</span>';
    }
  }
  if (isend) {
    this.inc = false;
  }
  return out;
};

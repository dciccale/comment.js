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
    .replace(rkeywords, '<b>$1</b>')
    .replace(rstrings, '<i>$1</i>')
    .replace(roperators, '<span class="s">$1</span>')
    .replace(rdigits, '<span class="d">$1</span>')
    .replace(/(\/\*(?:.(?!\*\/))+(?:\*\/)?)/g, '<span class="c">$1</span>')
    .replace(rcomments, '<span class="c">$1</span>') + '\n';

  if (this.inc) {
    out = out.replace(/(^.*\*\/)/, '<span class="c">$1</span>');
    if (!isend) {
      out = '<span class="c">' + out + '</span>';
    }
  }
  if (isend) {
    this.inc = false;
  }
  return out;
};

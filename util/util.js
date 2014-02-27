/*!
 * comment.js
 * Copyright (c) 2012 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var _ = module.exports = {};

var REGEX_AMP = /&(?!\w+;|#\d+;|#x[\da-f]+;)/gi;
var REGEX_CODE = /`([^`]+)`/g;
var REGEX_LINK = /(^|\s)@([\w\.\_\$\(\)…]*[\w\_\$](\(\))?)/g;
var REGEX_HREF = /(https?:\/\/[^\s"]+[\d\w_\-\/])/g;
var REGEX_OPTIONAL_PARAM = /#optional\s*/g;
var REGEX_TYPES = /\s*\|\s*/;

var slice = Array.prototype.slice;

_.extend = function(obj) {
  var objs = slice.call(arguments, 1);
  objs.forEach(function(source) {
    if (source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    }
  });
  return obj;
};

// Formats value into html
_.format = function (value) {
  return String(value)
    .replace(/</g, '&lt;')
    .replace(REGEX_AMP, '<em class="amp">&amp;</em>')
    .replace(REGEX_CODE, '<code class="prettyprint">$1</code>')
    .replace(REGEX_LINK, '$1<a href="#$2" class="cjs-link">$2</a>')
    .replace(REGEX_HREF, '<a href="$1" rel="external">$1</a>');
};

_.REGEX_OPTIONAL_PARAM = REGEX_OPTIONAL_PARAM;
_.REGEX_TYPES = REGEX_TYPES;

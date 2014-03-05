/*!
 * comment.js
 * Copyright (c) 2014 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var _ = module.exports = {};

var slice = Array.prototype.slice;

var REGEX_AMP = /&(?!\w+;|#\d+;|#x[\da-f]+;)/gi;
var REGEX_CODE = /`([^`]+)`/g;
var REGEX_LINK = /(^|\s)@([\w\.\_\$\(\)…]*[\w\_\$](\(\))?)/g;
var REGEX_HREF = /(https?:\/\/[^\s"]+[\d\w_\-\/])/g;

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

_.in = function (obj, value) {
  return Array.isArray(obj) ? obj.indexOf(value) > -1 : value in obj;
};

_.hash = function (keys, values) {
  var hash = {};
  var vlen = (values && values.length) || 0;
  var len = keys.length;
  var i;

  for (i = 0; i < len; ++i) {
    if (i in keys) {
      hash[keys[i]] = vlen > i && i in values ? values[i] : true;
    }
  }

  return hash;
};

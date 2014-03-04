/*!
 * comment.js
 * Copyright (c) 2014 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var Tag = function (name, definition) {
  this.name = name;

  Object.keys(definition).forEach(function (key) {
    this[key] = definition[key];
  }, this);
};

var _tags = {};
var tags = {
  define: function (name, definition) {
    var tag = new Tag(name, definition);
    _tags[tag.symbol] = tag;
    return tag;
  },

  get: function (symbol) {
    if (_tags.hasOwnProperty(symbol)) {
      return _tags[symbol];
    }
  }
};

require('./definitions').defineTags(tags);

module.exports = tags;

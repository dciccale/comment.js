
'use strict';

var utils = require('../utils');

module.exports['='] = {
  name: 'return',
  template: 'return.html',
  callback: function (tag, value, target, block) {
    var split = value.split(/(\s*[\(\)]\s*)/);
    var types;

    split.shift();
    split.shift();

    types = split.shift().split(utils._.REGEX_TYPES);
    split.shift();

    target.return = {
      types: types,
      desc: utils._.format(split.join(''))
    };

    return target;
  }
};

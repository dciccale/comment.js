
'use strict';

var utils = require('../utils');

module.exports['-'] = {
  name: 'params',
  template: 'params.html',
  callback: function (tag, value, target, block) {
    var optional, split, types;
    var param = {};

    target.params = target.params || [];

    value = value.replace(utils._.REGEX_OPTIONAL_PARAM, function () {
      optional = true;
      return '';
    });

    split = value.split(/(\s*[\(\)]\s*)/);

    param.name = split[0];

    split.shift();
    split.shift();

    if (optional) {
      param.optional = true;
    }

    types = split.shift().split(utils._.REGEX_TYPES);

    split.shift();

    param.types = types;
    param.desc = (utils._.format(split.join('')) || '&#160;');

    target.params.push(param);

    return target;
  }
};

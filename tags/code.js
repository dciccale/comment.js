
'use strict';

var utils = require('../utils');

module.exports['|'] = {
  name: 'code',
  template: 'code.html',
  callback: function (tag, value, target, block) {
    target.code = target.code || '';

    value = value ? utils._.format(value) : '';

    target.code += value + '\n';

    return target;
  }
};


'use strict';

var utils = require('../utils');

module.exports['*'] = {
  name: 'text',
  template: 'text.html',
  callback: function (tag, value, target, block) {
    target.text = utils._.format(value);

    return target;
  }
};


'use strict';

module.exports['#'] = {
  name: 'html',
  template: 'html.html',
  callback: function (tag, value, target, block) {
    target.html = target.html || '';

    target.html += value + '\n';

    return target;
  }
};

/*!
 * comment.js
 * Copyright (c) 2014 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var utils = require('../utils');

var REGEX_OPTIONAL_PARAM = /#optional\s*/g;
var REGEX_PARAM_INFO = /(\s*[\(\)]\s*)/;
var REGEX_TYPES = /\s*\|\s*/;
var REGEX_JSON_PARAM_INFO = /^\s*([^\(\s]+)\s*\(([^\)]+)\)\s*(.*?)\s*$/;
var REGEX_JSON_START = /\s*\{\s*$/;
var REGEX_JSON_END = /\s*\}\s*,?\s*$/;
var REGEX_OBJECT_TYPES = /\(([^\)]+)\)/;

exports.defineTags = function (tags) {
  // Describes the object type
  // and in the case of a property member its type/s can be specified
  // [ method ] or [ property (number|boolean) ]
  tags.define('type', {
    symbol: '[',
    process: function (value, section) {
      var type = {};
      var types;

      value = utils._.format(value).replace(REGEX_OBJECT_TYPES, function (all, t) {
        types = t;
        return '';
      });

      value = value.replace(/\s*\]\s*$/, '');

      section.data.type = value;

      // if (types) {
      //   types = types.split(REGEX_TYPES);
      //   type.types = types;
      // }
      // type.name = value;
      // section.current.push({
      //   type: type
      // });
    }
  });

  tags.define('head', {
    symbol: '>',
    process: function (value, section) {
      section.current.push({
        head: utils._.format(value)
      });
    }
  });

  tags.define('text', {
    symbol: '*',
    single: true,
    process: function (value, section) {
      section.current.push({
        text: utils._.format(value)
      });
    }
  });

  tags.define('params', {
    symbol: '-',
    process: function (value, section) {
      var optional, desc, types;
      var param = {};
      var host, sectionData;

      section.data.params = section.data.params || [];

      if (section.mode !== this.name) {
        host = [];
        section.data.params.push([]);
        section.current.push({params: host});
        section.current = host;
      }

      sectionData = section.data.params[section.data.params.length - 1];

      value = value.replace(REGEX_OPTIONAL_PARAM, function () {
        optional = true;
        return '';
      });

      if (optional) {
        param.optional = true;
      }

      desc = value.split(REGEX_PARAM_INFO);

      param.name = desc.shift(); // desc[0]

      // Push to section data
      sectionData.push((optional ? '[' : '') + param.name + (optional ? ']' : ''));

      desc.shift(); // desc[1] (

      types = desc.shift().split(REGEX_TYPES); // desc[2] types

      desc.shift(); // desc[3] )

      param.types = types;
      param.desc = (utils._.format(desc.join('')) || '&#160;'); // desc[...]

      section.current.push(param);
    }
  });

  tags.define('json', {
    symbol: 'o',
    process: function (value, section) {
      var desc = value.match(REGEX_JSON_PARAM_INFO);
      var start = value.match(REGEX_JSON_START);
      var end = value.match(REGEX_JSON_END);
      var item = {};
      var types, optional, key, host;

      if (section.mode !== this.name) {
        host = [];
        section.current.push({json: host});
        section.current = host;
      }

      if (desc) {
        desc.shift();

        key = desc.shift();

        item.key = key;

        types = desc.shift().split(REGEX_TYPES);
        item.types = types;

        desc = desc.shift().replace(REGEX_OPTIONAL_PARAM, function () {
          optional = true;
          return '';
        });

        if (optional) {
          item.optional = true;
        }

        item.desc = utils._.format(desc);

      } else if (!end) {
        item = value;
      }

      if (start) {
        item = {
          start: value
        };
      }
      if (end) {
        item = {
          end: value
        };
      }

      section.current.push(item);
    }
  });

  tags.define('html', {
    symbol: '#',
    process: function (value, section) {
      section.current.push({
        html: value + '\n'
      });
    }
  });

  tags.define('return', {
    symbol: '=',
    process: function (value, section) {
      var desc = value.split(REGEX_PARAM_INFO);
      var returns = {};

      if (desc.length > 1) {
        desc.shift();
        desc.shift();

        returns.types = desc.shift().split(REGEX_TYPES);

        desc.shift();
      }

      returns.desc = desc;

      section.current.push({
        return: returns
      });
    }
  });

  tags.define('code', {
    symbol: '|',
    process: function (value, section) {
      var host;

      if (section.mode !== this.name) {
        host = [];
        section.current.push({code: host});
        section.current = host;
      }

      section.current.push(value);
    }
  });
};

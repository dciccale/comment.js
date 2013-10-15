'use strict';

var template = module.exports = {};

var utils = require('../utils');
var handlebars = require('handlebars');

template.compile = function (tmpl, data) {
  try {
    var template = handlebars.compile(tmpl);
    return template;
  } catch (e) {
    utils.log.warn('Unable to process the template (' + e.message + ').');
  }
};

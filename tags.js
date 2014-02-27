
'use strict';

var utils = require('./utils');
var templatesDir = 'templates/';

var tags = {};
var code = require('./tags/code');
var params = require('./tags/params');
var text = require('./tags/text');
var json = require('./tags/json');
var html = require('./tags/html');
var returns = require('./tags/return');
var classtype = require('./tags/classtype');
var head = require('./tags/head');
var section = require('./tags/section');

utils._.extend(tags, code, params, text, json, html, returns, classtype, head, section);

exports.precompile = function () {
  var tag, tagObj, html;

  for (var tag in tags) {
    tagObj = tags[tag];

    if (tagObj.template) {
      html = utils.file.read(templatesDir + tagObj.template);
      tagObj.template = utils.template.compile(html);
    }
  }

  return tags;
};

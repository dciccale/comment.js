/*!
 * comment.js
 * Copyright (c) 2012 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');

var file = module.exports = {};

file.glob = require('glob');

file.isDir = function(path) {
  return path && file.exists(path) && fs.statSync(path).isDirectory();
};

file.isFile = function (filepath) {
  return filepath && file.exists(filepath) && fs.statSync(filepath).isFile();
}

// cortesy of grunt
file.mkdir = function(dirpath, mode) {
  // Set directory mode in a strict-mode-friendly way.
  if (mode == null) {
    mode = parseInt('0777', 8) & (~process.umask());
  }
  dirpath.split(/[\/\\]/g).reduce(function(parts, part) {
    parts += part + '/';
    var subpath = path.resolve(parts);
    if (!file.exists(subpath)) {
      try {
        fs.mkdirSync(subpath, mode);
      } catch(e) {
        throw util.error('Unable to create directory "' + subpath + '" (Error code: ' + e.code + ').', e);
      }
    }
    return parts;
  }, '');
};

file.write = function (filepath, content) {
  fs.writeFileSync(filepath, content);
};

file.read = function (filepath, encoding) {
  var contents;
  if (encoding === null) {
    contents = fs.readFileSync(filepath);
  } else {
    contents = fs.readFileSync(filepath, 'utf-8');
  }
  return contents;
};

file.readJSON = function (filepath) {
  var src = file.read(filepath);
  var result;
  try {
    result = JSON.parse(src);
    return result;
  } catch (e) {
    throw util.error('Unable to parse "' + filepath + '" file (' + e.message + ').', e);
  }
}

file.expand = function (pattern) {
  return file.glob.sync(pattern);
}

file.exists = function (filepath) {
  return filepath && fs.existsSync(filepath);
};

file.copy = function (srcpath, destpath) {
  var destBase = destpath;
  destpath = path.join(destBase, path.basename(srcpath));
  var content = file.read(srcpath, null);
  file.write(destpath, content);
};

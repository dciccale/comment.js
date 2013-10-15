'use strict';

var fs = require('fs');
var path = require('path');


var file = module.exports = {};
var pathSeparatorRe = /[\/\\]/g;

file.glob = require('glob');

file.isDir = function(path) {
  return path && file.exists(path) && fs.statSync(path).isDirectory();
};

// cortesy of grunt
file.mkdir = function(dirpath, mode) {
  // Set directory mode in a strict-mode-friendly way.
  if (mode == null) {
    mode = parseInt('0777', 8) & (~process.umask());
  }
  dirpath.split(pathSeparatorRe).reduce(function(parts, part) {
    parts += part + '/';
    var subpath = path.resolve(parts);
    if (!file.exists(subpath)) {
      try {
        fs.mkdirSync(subpath, mode);
      } catch(e) {
        throw 'Unable to create directory "' + subpath + '" (Error code: ' + e.code + ').';
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

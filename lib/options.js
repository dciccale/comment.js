/*!
 * comment.js
 * Copyright (c) 2014 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var path = require('path');

var utils = require('../lib/utils');

var packageInfo = utils.file.readJSON(path.join(__dirname, '../', 'package.json'));

function Options(args) {
  var options = {};

  if (!args.length) {
    this.help();
    process.exit(1);
  }

  if (args.length === 1 && path.extname(args[0]) === '.json' && utils.file.isFile(args[0])) {
    options = utils.file.readJSON(args[0]);
    return options;
  }


  // parse options
  while (args.length > 0) {
    var arg = args.shift();

    switch (arg) {
    case '--help':
    case '-h':
      this.help();
      process.exit(1);
      break;
    case '--output':
    case '-o':
      options.output = args.shift();
      break;
    case '--norecurse':
    case '-n':
      options.recurse = false;
      break;
    case '--extension':
    case '-e':
      options.extension = args.shift();
      break;
    case '--exclude':
    case '-x':
      options.exclude = args.shift();
      break;
    case '--regex':
    case '-r':
      options.regex = args.shift();
      break;
    case '--muted':
    case '-m':
      options.muted = true;
      break;
    case '--version':
    case '-v':
      console.log(packageInfo.version);
      process.exit(1);
      break;
    default:
      if (!options.source) {
        options.source = [];
      }
      if (arg && arg.indexOf('-') === 0) {
        throw 'Unknown option: ' + arg;
      }
      options.source.push(arg);
    }
  }

  return options;
}

Options.prototype.help = function () {
  utils.log.writeln();
  utils.log.writeln('Usage: commentjs [options] <file1.js *.js dir/> or <.json config file>');
  utils.log.writeln();
  utils.log.writeln('   -h, --help       show this help');
  utils.log.writeln('   -o, --output     set the output directory for the doc files');
  utils.log.writeln('   -n, --norecurse  prevent recurse nested directories');
  utils.log.writeln('   -e, --extension  set file extensions to be scanned separated by comma');
  utils.log.writeln('   -x, --exclude    specify directories or files to exclude');
  utils.log.writeln('   -r, --regex      use a javascript /regex/ to filter paths to be scanned');
  utils.log.writeln('   -m, --muted      less log messages from commentjs');
  utils.log.writeln('   -v, --version    display the version number');
  utils.log.writeln();
  utils.log.writeln('Example usage:');
  utils.log.writeln('   commentjs file1.js file2.js');
  utils.log.writeln('   commentjs -o docs/index.html js/**/*.js');
  utils.log.writeln('   commentjs -r /^c_/ js/');
  utils.log.writeln('   commentjs -x build/ -m js/ lib/ test/ main.js');
  utils.log.writeln('   commentjs config.json');
  utils.log.writeln();
};

module.exports = Options;

/*!
 * comment.js
 * Copyright (c) 2012 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */

'use strict';

var path = require('path');
var utils = require('./utils');
var docprocessor = require('./docprocessor.js');

// windows support
var isWindows = /win32/.test(process.platform),

  // template files
  templateDir = 'template',
  templateFile = 'template.html',

  // path to assets
  cssDir = 'css',
  jsDir = 'js',
  imgDir = 'img',

  // where generated code source files goes
  srcFolder = 'src',
  dirname = path.normalize(__dirname);

// normalized __dirname path (may have quotes on windows)
function getRootPath(file) {
  var dirpath = path.resolve(dirname, templateDir, file);
  return isWindows ? '\'' + dirpath + '\'' : dirpath;
}

function getOptions(options) {
  var defaults = {
    output: 'docs',
    sourceLinks: [],
    title: '',
    source: '',
    verbose: true,
    scripts: [],
    trackingID: null
  };

  return utils._.extend({}, defaults, options);
}

function commentjs(files, options) {

  options = getOptions(options);

  var filesSource = [];
  var outputPath = options.output;
  var toc = [];
  var currentDir = process.cwd() + path.sep;
  var outputFile, fileRegex, json;

  // no files, exit
  if (!files || !files.length || /''/.test(files[0]) || !files[0]) {
    utils.log.writeln('Usage: commentjs <file1.js file2.js or a .json file> [options]');
    utils.log.writeln('   -o    set the output directory for the docs files');
    process.exit(1);
  }

  function expandFiles(dir) {
    return utils.file.expand(dir + '*.js');
  }

  // if a directory is passed, expand files to all .js inside
  if (files.length === 1 && utils.file.isDir(files[0])) {
    files = expandFiles(files[0]);
  }

  function changeFileExt(file, ext) {
    return path.basename(file, path.extname(file)) + ext;
  }

  function pushFiles(file) {
    // set full file path
    var filePath = path.join(currentDir, (file.path || file));
    // get only filename
    var filename = path.basename(file);

    // normalize file path
    filePath = path.normalize(filePath);

    if ((!fileRegex || fileRegex.test(filename)) && utils.file.isFile(filePath)) {
      if (typeof file.link === 'string') {
        options.sourceLinks.push(file.link);
      }
      files.push(filePath);
    }
  }

  function getOutputPath() {
    var output = outputPath;
    // strip extension from path if any
    if (path.extname(output)) {
      output = path.dirname(output);
    }
    // get absolute path
    output = path.resolve(output) + path.sep;
    return output;
  }

  function getOutputFile() {
    var output = outputFile;
    // if no output, set default output filename
    // to be the same as the first filename
    if (!output) {
      output = path.basename(files[0]);
    }

    // normalize output file extension to be .html
    if (path.extname(output) !== '.html') {
      output = changeFileExt(output, '.html');
    }
    return outputPath + output;
  }

  // check for json config file
  if (files.length === 1 && path.extname(files[0]) === '.json' && utils.file.isFile(files[0])) {
    // parse json file
    json = utils.file.readJSON(files[0]);
    // user options
    options = getOptions(json);
    // set the current directory to look for, the same where the json file is
    currentDir = path.dirname(files[0]);
    // empty array
    files.shift();

    // source is required
    if (!options || !options.source || !options.source.length) {
      utils.log.error('Specify a source on your json config file');
      process.exit(1);
    }

    if (options.regex) {
      fileRegex = new RegExp(options.regex);
    }

    // check if source is a directory
    if (typeof options.source === 'string' && utils.file.isDir(options.source)) {
      // set correct source directory to look for files
      // currentDir += path.basename(options.source) + path.sep;
      currentDir = path.normalize(options.source + path.sep);
      // get all files in directory
      filesSource = expandFiles(currentDir).map(path.basename);

    // is an array
    } else if (Array.isArray(options.source)) {
      filesSource = options.source;

    // is one file, push to stack
    } else if (typeof options.source === 'string') {
      filesSource.push(options.source);
    }

    // create array of files to be parsed
    filesSource.forEach(pushFiles);

    // get output dir
    outputPath = options.output;
    outputFile = options.output;
  }

  if (path.extname(outputPath) === '.html') {
    outputFile = path.basename(outputPath);
  }

  // no files to parse, exit
  if (!files.length) {
    utils.log.warn('comment.js ended without parsing any file');
    process.exit(1);
  }

  // normalize output
  outputPath = getOutputPath();
  outputFile = getOutputFile();

  function getRelativeSrcFileName(file) {
    return path.join(srcFolder, changeFileExt(file, '-src.html'));
  }

  // processing function
  function generateDocs() {
    var html = utils.file.read(getRootPath(templateFile));
    var template = utils.template.compile(html);
    var startTime = Date.now();
    var content = '', chunks = {}, data, endTime;

    files.forEach(function (file, i) {
      utils.log.writeln('\nProcessing ' + file + '...');

      // read file and normalize EOL
      var code = utils.file.read(file).replace(/\r\n|\r/g, '\n');
      var sourceLink = options.sourceLinks[i];
      // link to source file
      var sourceFileName = sourceLink || getRelativeSrcFileName(file);
      // process file content
      var res = docprocessor(code, file, sourceFileName, !sourceLink), key;

      if (res.sections) {
        toc = toc.concat(res.toc);

        for (key in res.chunks) {
          if (res.chunks.hasOwnProperty(key)) {
            chunks[key] = res.chunks[key];
          }
        }

        options.title = options.title || res.title;

        if (options.verbose === true) {
          utils.log.writeln('Found', String(res.sections).green, 'sections.');
          utils.log.writeln('Processing', String(res.loc).green, 'lines of code...');
        }

        // if no source link create local src file
        if (!sourceLink) {
          utils.file.write(path.join(outputPath, sourceFileName), res.source);
        }

      // no commentjs format? warn but continue to next file
      } else if (options.verbose) {
        utils.log.warn('No commentjs format found in ' + file + ' ...continue');
      }
    });

    // ensure no toc.name duplication
    toc.forEach(function (currentToc, i) {
      if (!i || currentToc.name !== toc[i - 1].name) {
        content += chunks[currentToc.name] || '';
      }
    });

    // in case I want to add the object type as a class in the nav links
    // {{#if clas}} class='{{clas}}'{{/if}}

    // extend template data with options
    data = utils._.extend({
      title: options.title,
      toc: toc,
      content: content
    }, options);

    // render
    html = template(data);

    // write output
    utils.file.write(outputFile, html);

    endTime = String(Date.now() - startTime);
    utils.log.writeln('Processed in', endTime.green + 'ms.');
    utils.log.ok('Output:', path.relative(process.cwd(), outputFile));
  }

  function copyTemplateAssets() {
    function getResourcePath(dir) {
      return getRootPath(path.join(dir, '*.*'));
    }

    [cssDir, jsDir, imgDir].forEach(function (folder) {
      var destpath = outputPath + folder;
      var assets = utils.file.expand(getResourcePath(folder));
      if (!utils.file.exists(destpath)) {
        utils.file.mkdir(destpath);
      }
      assets.forEach(function (srcpath) {
        utils.file.copy(srcpath, destpath);
      });
    });
  }

  // create output directories
  utils.file.mkdir(outputPath + (!options.sourceLinks.length ? srcFolder : ''));

  // process files
  generateDocs();

  // bring template assets
  copyTemplateAssets();
}

module.exports = commentjs;

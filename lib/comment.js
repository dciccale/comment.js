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

// Windows support
var isWindows = /win32/.test(process.platform);

// Template files
var templateDir = 'template';
var templateFile = 'src/template.html';

// Path to assets
var cssDir = 'css';
var jsDir = 'js';
var imgDir = 'img';

// Generated source code output files directory
var srcFolder = 'src';

// Current directory
var dirname = path.normalize(__dirname);

// Normalized __dirname path (may have quotes on windows)
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

  // If no files provided, exit
  if (!files || !files.length || /''/.test(files[0]) || !files[0]) {
    utils.log.writeln('Usage: commentjs <file1.js file2.js or a .json file> [options]');
    utils.log.writeln('   -o    set the output directory for the docs files');
    process.exit(1);
  }

  function expandFiles(dir) {
    return utils.file.expand(dir + '*.js');
  }

  // If a directory is passed, expand files to all .js inside
  if (files.length === 1 && utils.file.isDir(files[0])) {
    files = expandFiles(files[0]);
  }

  function changeFileExt(file, ext) {
    return path.basename(file, path.extname(file)) + ext;
  }

  function pushFiles(file) {
    // Set full file path
    var filePath = path.join(currentDir, (file.path || file));
    // Get only filename
    var filename = path.basename(file);

    // Normalize file path
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
    // Strip extension from path if any
    if (path.extname(output)) {
      output = path.dirname(output);
    }
    // Get absolute path
    output = path.resolve(output) + path.sep;
    return output;
  }

  function getOutputFile() {
    var output = outputFile;
    // If no output, set default output filename
    // To be the same as the first filename
    if (!output) {
      output = path.basename(files[0]);
    }

    // Normalize output file extension to be .html
    if (path.extname(output) !== '.html') {
      output = changeFileExt(output, '.html');
    }
    return outputPath + output;
  }

  // Check for json config file
  if (files.length === 1 && path.extname(files[0]) === '.json' && utils.file.isFile(files[0])) {

    // Parse json file
    json = utils.file.readJSON(files[0]);

    // User options
    options = getOptions(json);

    // Set the current directory to look for, the same where the json file is
    currentDir = path.dirname(files[0]);

    // Empty array
    files.shift();

    // Source is required
    if (!options || !options.source || !options.source.length) {
      utils.log.error('Specify a source on your json config file');
      process.exit(1);
    }

    if (options.regex) {
      fileRegex = new RegExp(options.regex);
    }

    // Check if source is a directory
    if (typeof options.source === 'string' && utils.file.isDir(options.source)) {

      // Set correct source directory to look for files
      currentDir = path.normalize(options.source + path.sep);

      // Get all files in directory
      filesSource = expandFiles(currentDir).map(path.basename);

    // Is an array
    } else if (Array.isArray(options.source)) {
      filesSource = options.source;

    // Is one file, push to stack
    } else if (typeof options.source === 'string') {
      filesSource.push(options.source);
    }

    // Create array of files to be parsed
    filesSource.forEach(pushFiles);

    // Get output dir
    outputPath = options.output;
    outputFile = options.output;
  }

  if (path.extname(outputPath) === '.html') {
    outputFile = path.basename(outputPath);
  }

  // No files to parse, exit
  if (!files.length) {
    utils.log.warn('comment.js ended without parsing any file');
    process.exit(1);
  }

  // Normalize output
  outputPath = getOutputPath();
  outputFile = getOutputFile();

  function getRelativeSrcFileName(file) {
    return path.join(srcFolder, changeFileExt(file, '-src.html'));
  }

  // Processing function
  function generateDocs() {
    var html = utils.file.read(getRootPath(templateFile));
    var template = utils.template.compile(html);
    var startTime = Date.now();
    var content = '', chunks = {}, data, endTime;

    files.forEach(function (file, i) {
      utils.log.writeln('\nProcessing ' + file + '...');

      // Read file and normalize EOL
      var code = utils.file.read(file).replace(/\r\n|\r/g, '\n');

      // Source links provided
      var sourceLink = options.sourceLinks[i];

      // Link to source file
      var sourceFileName = sourceLink || getRelativeSrcFileName(file);

      // Process file content
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

        // If no source link create local src file
        if (!sourceLink) {
          utils.file.write(path.join(outputPath, sourceFileName), res.source);
        }

      // No commentjs format? warn but continue to next file
      } else if (options.verbose) {
        utils.log.warn('No commentjs format found in ' + file + ' ...continue');
      }
    });

    // Ensure no toc.name duplication
    toc.forEach(function (currentToc, i) {
      if (!i || currentToc.name !== toc[i - 1].name) {
        content += chunks[currentToc.name] || '';
      }
    });

    // In case I want to add the object type as a class in the nav links
    // {{#if clas}} class='{{clas}}'{{/if}}

    // Extend template data with options
    data = utils._.extend({
      title: options.title,
      toc: toc,
      content: content
    }, options);

    // Fix scripts path added to the docs
    data.scripts = data.scripts.map(function (scriptPath) {
      return path.relative(outputPath, scriptPath);
    });

    // Render
    html = template(data);

    // Write output
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

  // Create output directories
  utils.file.mkdir(outputPath + (!options.sourceLinks.length ? srcFolder : ''));

  // Process files
  generateDocs();

  // Bring template assets
  copyTemplateAssets();
}

module.exports = commentjs;

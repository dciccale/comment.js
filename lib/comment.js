/*!
 * comment.js 0.0.1 - API Documentation builder
 * Copyright (c) 2012 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/comment.js/blob/master/LICENSE.txt
 */
// required modules
var fs = require("fs"),
  path = require("path"),
  docit = require("./doc.js"),
  exec = require("child_process").exec,
  handlebars = require('handlebars'),

  // windows support
  isWindows = /win/.test(process.platform),
  mkdir = isWindows ? "mkdir " : "mkdir -p ",
  cp = isWindows ? "copy " : "cp ",

  // template files
  templateSrc = 'template' + path.sep,
  templateFile = 'template.html',

  // path to assets
  cssDir = 'css' + path.sep,
  jsDir = 'js' + path.sep,
  imgDir = 'img' + path.sep,

  // where generated source files goes
  srcFolder = 'src';


// normalized __dirname path (must have quotes on windows)
function getRootPath(file) {
  var dirpath = path.normalize(__dirname) + path.sep + templateSrc + file;
  return (isWindows) ? '\"' + dirpath + '\"' : dirpath;
}

function writeFile(file, content, callback) {
  fs.writeFile(file, content, function (error) {
    if (error) {
      throw error;
    }

    if (typeof callback === 'function') {
      callback();
    }
  });
}

function readFileSync(file) {
  // remove any quotes from path (windows)
  file = file.replace(/"/g, '');
  return fs.readFileSync(file, "utf-8");
}

function main(files) {
  var sourceLinks = [],
    chunks = {},
    title = "",
    outputFile,
    outputPath = "docs",
    scripts = [],
    toc = [],
    // the current directory
    sourceDir = process.cwd() + path.sep,
    filesSource = [],
    options,
    fileRegex,
    configFileName,
    json,
    indexOfConfigFile;

  // remove first two args
  files.splice(0, 2);

  // no files, exit
  if (!files.length || /''/.test(files[0]) || !files[0]) {
    console.log("Usage: " + (module.parent ? "comment-js " : "node comment.js ") + "<file1.js file2.js or a .json file>");
    process.exit(1);
  }

  function changeFileExt(file, ext) {
    return path.basename(file, path.extname(file)) + ext;
  }

  function normalizeOutputPath() {
    // strip extension from path if any
    if (path.extname(outputPath)) {
      outputPath = path.dirname(outputPath);
    }
    // get absolute path
    outputPath = path.resolve(outputPath) + path.sep;
    return outputPath;
  }

  function normalizeOutputFile() {
    // if no output, set default output filename
    // to be the same as the first filename
    if (!outputFile) {
      outputFile = files[0];
    }
    // normalize output file extension to be .html
    if (path.extname(outputFile) !== '.html') {
      outputFile = outputPath + changeFileExt(outputFile, '.html');
    }
    return outputFile;
  }

  // generate src file name
  function createSrcFileName(file) {
    return path.resolve(outputPath, srcFolder, changeFileExt(file, '-src.html'));
  }

  function isDirectory(folder) {
    if (typeof folder !== 'string') {
      return false;
    }
    return fs.lstatSync(folder).isDirectory();
  }

  function dirExists(dir, callback) {
    fs.stat(dir, function (error, stat) {
      callback(!error && stat.isDirectory());
    });
  }

  function pushFiles(file) {
    // external source file (e.g. github)
    var link = file.link,
      // set full file path
      filePath = sourceDir + (file.path || file),
      // get only filename
      filename = path.basename(file);

    // normalize file path
    file = path.normalize(filePath);

    if ((!fileRegex || fileRegex.test(filename)) && !isDirectory(file)) {
      files.push(file);
      if (link && typeof link === 'string') {
        sourceLinks.push(link);
      }
    }
  }

  // check for json config file
  if (files.length === 1 && path.extname(files[0]) === ".json") {
    configFileName = files[0];
    // parse json file
    json = JSON.parse(readFileSync(files[0]));
    // get docs title
    title = json.title;
    // empty array
    files.shift();
    // user options
    options = json.options;
    filesSource = [];

    // source is required
    if (!options || !options.source || !options.source.length) {
      console.log("Specify a source on your json config file");
      process.exit(1);
    }

    if (options.regex) {
      fileRegex = new RegExp(options.regex);
    }

    // check if source is a directory
    if (isDirectory(options.source)) {
      // set correct source directory to look for files
      // sourceDir += path.basename(options.source) + path.sep;
      sourceDir = options.source + path.sep;
      // get all files in directory
      filesSource = fs.readdirSync(sourceDir);

    // is an array
    } else if (Array.isArray(options.source)) {
      filesSource = options.source;

    // is one file, push to stack
    } else if (typeof options.source === 'string') {
      filesSource.push(options.source);
    }

    // remove config file from list if exists
    indexOfConfigFile = filesSource.indexOf(configFileName);
    if (indexOfConfigFile !== -1) {
      filesSource.splice(indexOfConfigFile, 1);
    }

    // create array of files to be parsed
    filesSource.forEach(pushFiles);

    // get output dir
    outputFile = options.output;
    outputPath = options.output || outputPath;
    // any scripts to include in doc file? (e.g for code demos)
    scripts = options.scripts || scripts;
  }

  // no files to parse, exit
  if (!files.length) {
    console.log('comment.js ended without parsing any file');
    process.exit(1);
  }

  // normalize output
  outputPath = normalizeOutputPath();
  outputFile = normalizeOutputFile();

  // processing function
  function generateDocs() {
    console.log('\nGenerating output...');
    var content = "",
      html,
      template,
      data;

    files.forEach(function (file, i) {
      console.log("Processing " + file);
      // read file and normalize EOL
      var code = readFileSync(file).replace(/\r\n|\r/g, '\n'),
        // link to source file
        sourceFileName = sourceLinks[i] || createSrcFileName(file),
        // parse file content
        res = docit(code, file, sourceFileName),
        key;

      if (res.sections && res.source) {
        toc = toc.concat(res.toc);

        for (key in res.chunks) {
          if (res.chunks.hasOwnProperty(key)) {
            chunks[key] = res.chunks[key];
          }
        }

        title = title || res.title;

        console.log("Found \u001b[32m" + res.sections + "\u001b[0m sections.");
        console.log("Processing \u001b[32m" + res.loc + "\u001b[0m lines of code...");

        // if no source link create local src file
        if (!sourceLinks[i]) {
          writeFile(sourceFileName, res.source);
        }

      // no comment-js format? warn but continue to next file
      } else {
        console.log("\u001b[31mNo comment-js format found in\u001b[0m " + file);
      }
    });

    // ensure no toc.name duplication
    toc.forEach(function (currentToc, i) {
      if (!i || currentToc.name !== toc[i - 1].name) {
        content += chunks[currentToc.name] || "";
      }
    });

    // in case I want to add the object type as a class in the nav links
    // {{#if clas}} class="{{clas}}"{{/if}}

    // get base template
    html = readFileSync(getRootPath(templateFile));
    template = handlebars.compile(html);
    data = {
      "title": title,
      "toc": toc,
      "content": content,
      "scripts": scripts
    };

    // render
    html = template(data);

    // write output
    writeFile(outputFile, html, function () {
      console.log('\n\nFinished!\n---------\nOutput: \u001b[32m' + outputFile + '\u001b[0m');
    });
  }

  // create output directories
  exec(mkdir + outputPath + (!sourceLinks.length ? srcFolder : ''), function () {
    // generate docs after output folder cause may not be created yet
    generateDocs();
  });

  function getResourcePath(dir) {
    return getRootPath(dir + '*.*');
  }

  // bring required files if needed
  [cssDir, jsDir, imgDir].forEach(function (folder) {
    var outputDir = outputPath + folder;
    dirExists(outputDir, function (exists) {
      if (!exists) {
        // create directory tree
        exec(mkdir + outputDir, function () {
          // copy resources
          exec(cp + getResourcePath(folder) + ' ' + outputDir);
        });
      }
    });
  });
}


// if comment-js has been required return the main function
if (module.parent) {
  module.exports = main;

// if not, execute the scriptf
} else {
  main(process.ARGV.slice(0));
}
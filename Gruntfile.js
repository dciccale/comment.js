module.exports = function (grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    LIB_DIR: 'lib/',
    ASSETS_DIR: '<%= LIB_DIR %>assets/',
    JS_DIR: '<%= ASSETS_DIR %>js/',
    STYL_DIR: '<%= ASSETS_DIR %>styl/',
    DEFAULT_THEME_DIR: 'themes/default/',
    CSS_DEBUG_FILE: '<%= DEFAULT_THEME_DIR %>css/docs.css',
    CSS_MIN_FILE: '<%= DEFAULT_THEME_DIR %>css/docs.min.css',
    JS_DEST: '<%= DEFAULT_THEME_DIR %>js/',

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      lib: {
        src: ['<%= LIB_DIR %>**/*.js', '!<%= JS_DIR %>prettify.js']
      }
    },

    stylus: {
      compile: {
        options: {
          compress: false
        },
        files: {
          '<%= CSS_DEBUG_FILE %>': ['<%= ASSETS_DIR %>styl/docs.styl']
        }
      }
    },

    uglify: {
      target: {
        files: [{
          expand: true,
          cwd: '<%= JS_DIR %>',
          src: ['*.js'],
          dest: '<%= JS_DEST %>',
          ext: '.min.js'
        }]
      }
    },

    cssmin: {
      compress: {
        files: {
          '<%= CSS_MIN_FILE %>': ['<%= CSS_DEBUG_FILE %>']
        }
      }
    },

    watch: {
      jshint: {
        files: ['<%= jshint.lib.src %>'],
        tasks: ['jshint', 'uglify']
      },
      stylus: {
        files: ['<%= STYL_DIR %>*.styl'],
        tasks: ['stylus', 'cssmin']
      }
    }
  });

  grunt.registerTask('default', ['jshint', 'stylus', 'uglify', 'cssmin']);
};

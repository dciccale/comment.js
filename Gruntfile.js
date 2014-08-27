module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    LIB_DIR: 'lib/',
    ASSETS_DIR: '<%= LIB_DIR %>assets/',
    JS_DIR: '<%= ASSETS_DIR %>js/',
    STYL_DIR: '<%= ASSETS_DIR %>styl/',
    DEFAULT_THEME_DIR: 'themes/default/',
    CSS_DEST: '<%= DEFAULT_THEME_DIR %>css/docs.css',

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
          '<%= CSS_DEST %>': ['<%= ASSETS_DIR %>styl/docs.styl']
        }
      }
    },

    watch: {
      jshint: {
        files: ['<%= jshint.lib.src %>'],
        tasks: ['jshint']
      },

      stylus: {
        files: ['<%= STYL_DIR %>*.styl'],
        tasks: ['stylus']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jshint', 'stylus']);
};

module.exports = function (grunt) {

  grunt.initConfig({
    pkg: '<json:package.json>',
    lint: {
      files: ['grunt.js', 'lib/comment.js', 'lib/template/js/*.js']
    },
    stylus: {
      compile: {
        files: {
          'lib/template/css/*.css': ['lib/template/css/styl/comment.styl', 'lib/template/css/styl/src.styl']
        }
      }
    },
    watch: {
      files: ['<config:lint.files>', 'lib/template/css/styl/comment.styl', 'lib/template/css/styl/src.styl'],
      tasks: 'lint stylus'
    },
    jshint: {
      options: {
        curly: true,
        immed: true,
        latedef: true,
        noarg: true,
        sub: true,
        undef: true,
        eqnull: true,
        node: true
      },
      globals: {
        window: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-stylus');

  grunt.registerTask('default', 'lint stylus');

};
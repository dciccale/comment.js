module.exports = ->

  @initConfig
    DEFAULT_THEME_DIR: 'themes/default/',
    TEMPLATE_DIR: 'lib/template/',
    CSS_DEBUG_FILE: '<%= CSS_DIR %>css/docs.css',
    CSS_MIN_FILE: '<%= DEFAULT_THEME_DIR %>css/docs.min.css',
    JS_DIR: '<%= TEMPLATE_DIR %>src/js/',
    JS_FILE: '<%= DEFAULT_THEME_DIR %>js/docs.min.js'

    jshint:
      options:
        jshintrc: '.jshintrc'

      lib:
        src: [
          'lib/comment.js',
          'lib/parser.js',
          'lib/view.js',
          'lib/scanner.js',
          'lib/tags/*.js',
          'lib/util/*.js',
          'lib/utils.js',
          '<%= JS_DIR %>tocfilter.js'
        ]

    stylus:
      compile:
        files:
          '<%= CSS_DEBUG_FILE %>': ['<%= TEMPLATE_DIR %>src/styl/docs.styl']

    uglify:
      target:
        files:
          '<%= JS_FILE %>': ['<%= JS_DIR %>prettify.js', '<%= JS_DIR %>tocfilter.js']

    cssmin:
      compress:
        files:
          '<%= CSS_MIN_FILE %>': ['<%= CSS_DEBUG_FILE %>']

    watch:
      link:
        files: ['lib/**/*.js']
        tasks: ['link', 'jshint']

      jshint:
        files: ['<%= jshint.lib.src %>']
        tasks: ['jshint', 'uglify']

      stylus:
        files: ['<%= CSS_DIR %>styl/comment.styl', '<%= CSS_DIR %>styl/src.styl'],
        tasks: ['stylus', 'cssmin']

  @loadNpmTasks 'grunt-contrib-jshint'
  @loadNpmTasks 'grunt-contrib-stylus'
  @loadNpmTasks 'grunt-contrib-cssmin'
  @loadNpmTasks 'grunt-contrib-uglify'
  @loadNpmTasks 'grunt-contrib-watch'

  @registerTask 'default', ['jshint', 'stylus', 'uglify', 'cssmin']

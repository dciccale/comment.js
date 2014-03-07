module.exports = ->

  @initConfig
    DEFAULT_THEME_DIR: 'themes/default/'
    ASSETS_DIR: 'lib/assets/'
    CSS_DEBUG_FILE: '<%= DEFAULT_THEME_DIR %>css/docs.css'
    CSS_MIN_FILE: '<%= DEFAULT_THEME_DIR %>css/docs.min.css'
    JS_DIR: '<%= ASSETS_DIR %>js/'
    STYL_DIR: '<%= ASSETS_DIR %>styl/'
    JS_DEST: '<%= DEFAULT_THEME_DIR %>js/'

    jshint:
      options:
        jshintrc: '.jshintrc'

      lib:
        src: [
          'lib/comment.js'
          'lib/parser.js'
          'lib/view.js'
          'lib/scanner.js'
          'lib/tags/*.js'
          'lib/util/*.js'
          'lib/utils.js'
          '<%= JS_DIR %>tocfilter.js'
          '<%= JS_DIR %>src.js'
        ]

    stylus:
      compile:
        files:
          '<%= CSS_DEBUG_FILE %>': ['<%= ASSETS_DIR %>styl/docs.styl']

    uglify:
      target:
        files: [
          expand: true
          cwd: '<%= JS_DIR %>'
          src: ['*.js']
          dest: '<%= JS_DEST %>'
          ext: '.min.js'
        ]

    cssmin:
      compress:
        files:
          '<%= CSS_MIN_FILE %>': ['<%= CSS_DEBUG_FILE %>']

    watch:
      link:
        files: ['lib/**/*.js']
        tasks: ['jshint']

      jshint:
        files: ['<%= jshint.lib.src %>']
        tasks: ['jshint', 'uglify']

      stylus:
        files: ['<%= STYL_DIR %>*.styl']
        tasks: ['stylus', 'cssmin']

  @loadNpmTasks 'grunt-contrib-jshint'
  @loadNpmTasks 'grunt-contrib-stylus'
  @loadNpmTasks 'grunt-contrib-cssmin'
  @loadNpmTasks 'grunt-contrib-uglify'
  @loadNpmTasks 'grunt-contrib-watch'

  @registerTask 'default', ['jshint', 'stylus', 'uglify', 'cssmin']

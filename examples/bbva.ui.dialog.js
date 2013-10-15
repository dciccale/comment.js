/*\
 * $B
 * Global namespace for BBVA
\*/
/*\
 * $B.ui
 * Global namespace for BBVA UI components
\*/

// "$B.ui.dialog"
/*\
 * $B.ui.dialog
 * Object to perform any operations related to dialogs
\*/
(function ($, window) {

  $B.provide($B, 'ui.dialog');

  // we need to disable resize on overlay
  // original overlay create function
  var overlayCreate = $.ui.dialog.overlay.create,
    document = window.document;

  // prevent jQuery ui from changing the overlay size (we use css)
  $.ui.dialog.overlay.resize = function () {};

  // overlay create function wrapper
  $.extend($.ui.dialog.overlay, {
    create: function (dialog) {
      // save reference to return
      var $el = overlayCreate.call(this, dialog);

      // unbind resize event
      $(window).off('resize.dialog-overlay');

      // restore size
      $el.css({
        width: '100%',
        height: '100%'
      });

      // allow scrolling by dragging the scrollbar
      // remove (as now we are disabling the entire page scrollbar)
      setTimeout(function () {
        $(document).off('mousedown.dialog-overlay');
      }, 1);

      // return original element
      return $el;
    }
  });

  // evento para redimensionar y posicionar ventanas modales
  $(window).resize(function (ev) {
    $B.ui.dialogCenter();
  });

  // funcion que se encarga de centrar, redimensionar y aplicar scroll a ventanas modales


  /*\
   * $B.ui.dialogSecureHeight
   [ property ]
   * Secure and nice separation from top and bottom of the window
  \*/
  $B.ui.dialogSecureHeight = 100;


  $B.ui.dialogCenter = function ($uiDialog) {
    $uiDialog = $('.contenidoModal:visible:last').closest('.ui-dialog');

    // dont do anything if no modal found
    if (!$uiDialog.length) {
      return;
    }

    var $window = $(window),
      windowHeightSecure = $window.height() - $B.ui.dialogSecureHeight, // 100 is the secure margin
      $buttonsLayer,
      $cuerpoModal,
      $contentScroll,
      $divViewport,
      $divOverview,
      $divScrollbar,
      $divScrollable,
      $elementToScroll,
      stepsButtonsHeight,
      contentMarginTop,
      $contenidoModal,
      $buttonsMirrored,
      needsToInitScroll = true,
      // if fixed height, do not resize
      needsResize = $uiDialog.find('[data-fixed-height]').length ? false : true,
      buttonAreaCopied = false,
      buttonAreaClasses,
      divScrollableHeight,
      // flag to know if its "modalDetalle" type
      isModalDetalle = $uiDialog.hasClass('c-contenedores-modalDetalle'),
      altoCalculado,

      // centers the modal on the window
      centerModal = function () {
        var top = ($window.height() - $uiDialog.outerHeight()) / 2;
        $uiDialog.css({
          position: 'fixed',
          left: ($window.width() - $uiDialog.width()) / 2 + $window.scrollLeft(),
          top: (top < 0) ? 0 : top
        });
      },

      // initializes the custom scroll on the corresponding container
      initCustomScroll = function () {
        // fix some style problems if modal is modalDetalle
        if (isModalDetalle) {
          // change scrollbar position
          $divScrollbar.css({
            right: -16
          });
          // add padding to viewport
          $divViewport.css({
            paddingRight: 16
          });
        }

        // get the element to make it scrollable
        $elementToScroll = $contentScroll.children(':first').hasClass('scrollbar') ? $contentScroll.find('.scrollable').first() : $contentScroll.children(':first');
        // destroy any previous reference tu customscroll plugin
        $elementToScroll.parent().customScrollbar('destroy');

        // init plugin if the scrollable content is higher than its container
        if ($elementToScroll.height() + 10 > $elementToScroll.parent().height()) {
          // show scrollbar (initially is hidden)
          $divScrollbar.show();
          $elementToScroll.parent().customScrollbar({ resizeContent : false });
          $divScrollable.css('margin-top', contentMarginTop);
        }

        //set contentScroll margin-top on init
        if ($contentScroll.data('tsb')) {
          $contentScroll.data('tsb').thumbSetPos();
        }
      },

      // removes the scroll and reset styles of the elements
      removeCustomScroll = function () {
        var defaultStyles = { height: 'auto' };
        $divScrollbar.hide();
        $cuerpoModal.find('.contenedorScroll').css(defaultStyles).customScrollbar('destroy');
        $cuerpoModal.css(defaultStyles);
        $contenidoModal.css(defaultStyles);
        $uiDialog.css(defaultStyles);
        $divOverview.css($.extend({}, defaultStyles, { position: 'static' }));
        $divViewport.css($.extend({}, defaultStyles, { overflow: 'visible' }));
        // do not need scrollbars, mark to false
        needsToInitScroll = false;
      },

      getCalculatedHeight = function () {
        var maxHeight, resultHeight;

        // reset overview position because if not, as its absolute
        // doesnt stretches to the width of the content and makes the content div be too tall
        $divOverview.css('position', 'static');

        _.find($('.scrollable'), function (item) {
          if (!$(item).closest('.scrollable').length && $(item).height() > 0) {
            maxHeight = $(item).height();
          }
        });

        if (maxHeight < $contentScroll.height() || maxHeight > $divOverview.height()) {
          resultHeight = maxHeight;
        } else {
          resultHeight = Math.max($contentScroll.height(), $divOverview.height());
        }

        // restore overview position
        $divOverview.css('position', 'absolute');

        return resultHeight;
      },

      recalculateContainersHeight = function (altoContenido) {
        var variationContenidoModal = isModalDetalle ? 0 : 39,
          variationCuerpoModal = isModalDetalle ? 47 : 0,
          uiDialogHeight = $uiDialog.height();

        // si la modal no necesita scroll se lo quitamos
        if ((altoContenido < uiDialogHeight && uiDialogHeight <= windowHeightSecure) || $uiDialog.find('[data-modal-no-scroll]').length) {
          removeCustomScroll();

        // caso en que la ventana modal es mas grande que la ventana
        } else if ($cuerpoModal.height() < $divScrollable.height() ||
            uiDialogHeight > windowHeightSecure ||
            ($cuerpoModal.outerHeight() > uiDialogHeight && $uiDialog.find('.scrollable').length < 2)) {

          $divOverview.css('position', 'absolute');
          $divViewport.css('overflow', 'hidden');
          $uiDialog.css('height', windowHeightSecure);
          $contenidoModal.css('height', $uiDialog.height() - variationContenidoModal);
          $cuerpoModal.css('height', $contenidoModal.height() - $B.ui.dialogCenterGetHeaderModalHeight($contenidoModal) - stepsButtonsHeight - $B.ui.dialogCenterGetContentScrollHeight($contentScroll) - variationCuerpoModal);

          if (needsToInitScroll) {
            $contentScroll.css('height', $cuerpoModal.height());
          }

        } else {
          needsToInitScroll = false;
        }
      },

      // get containers
      getContainers = function () {
        $contenidoModal = $uiDialog.find('.contenidoModal').first().css('height', 'auto');
        $contentScroll = $cuerpoModal.find('.contenedorScrollModal').removeAttr('style');
        $divViewport = $contentScroll.find('.viewportModal').removeAttr('style');
        $divOverview = $contentScroll.find('.overviewModal').removeAttr('style');
        $divScrollable = $contentScroll.find('.scrollableModal').removeAttr('style');
        $divScrollbar = $contentScroll.find('.scrollbarModal').removeAttr('style').css('display', 'none');
      },

      checkIframe = function () {
        // if there is only an iframe in the modal deactivate custom scroll
        if ($cuerpoModal.children().length === 1 && $cuerpoModal.find('iframe').length) {
          needsToInitScroll = false;
          // resize the iframe to occupy the whole content
          if (needsResize) {
            $cuerpoModal.find('iframe').css({ height: '100%', width: '100%' });
          } else {
            $uiDialog.find('.overviewModal').css({ position: 'static' });
          }
        }
      };

    $cuerpoModal = $uiDialog.find('.cuerpoModal').first();
    $B.ui.dialogCenterAddWrapperScroll($cuerpoModal);

    // check if there is an iframe and disabled needsToInitScroll
    checkIframe();

    if (needsToInitScroll) {
      getContainers();
      contentMarginTop = $divScrollable.css('margin-top'); //guardamos margin-top para al iniciar el scroll dejarlo en la misma posicion

      // height of the bottom menu if any
      stepsButtonsHeight = ($buttonsMirrored) ? $buttonsMirrored.outerHeight(true) : 0;

      altoCalculado = getCalculatedHeight();

      // set sizes for both viewport and overview containers
      $divViewport.add($divOverview).css({
        height: altoCalculado,
        width: $contentScroll.width()
      });

      // resize or reset modal dimensions
      recalculateContainersHeight(altoCalculado);

      // init scroll if needed
      if (needsToInitScroll) {
        initCustomScroll();
      }
    }

    // center the modal now that al dimensions are "properly" set
    setTimeout(function () {
      centerModal();
    }, 0);

    // init timer to check modal content changes
    $B.checkContentHeightDialogs.init();
  };

  // if scrollable wrappers are not present, add them (e.g. modalDetalle)
  $B.ui.dialogCenterAddWrapperScroll = function ($cuerpoModal) {
    if (!$cuerpoModal.children('.contenedorScroll').length) {
      $cuerpoModal.children().wrapAll('<div class="contenedorScroll contenedorScrollModal"><div class="viewport viewportModal"><div class="overview overviewModal"><div class="scrollable scrollableModal"></div></div></div></div>');
      $cuerpoModal.find('.scrollableModal').before('<div class="scrollbar scrollbarModal" style="display:none;"><div class="boxScroll"><div class="track"><div class="thumb"><div class="end"></div></div></div><span class="jspArrow jspArrowUp jspDisabled"></span><span class="jspArrow jspArrowDown"></span></div></div>');
    }
  };

  $B.ui.dialogCenterGetHeaderModalHeight = function ($contenidoModal) {
    return ($contenidoModal.find('.headerModal').length > 0) ? $contenidoModal.find('.headerModal').outerHeight(true) : 0;
  };

  $B.ui.dialogCenterGetContentScrollHeight = function ($contentScroll) {
    return ($contentScroll.length) ? parseInt($contentScroll.css('paddingTop'), 10) : 0;
  };

  $B.ui.dialogHasSecureHeight = function () {
    var $uiDialog = $('.contenidoModal:visible:last').closest('.ui-dialog');
    return ($uiDialog.find('[data-modal-no-scroll]').length === 1 || $uiDialog.find('[data-fixed-height]').length ||
      $uiDialog.height() <= $(window).height() - $B.ui.dialogSecureHeight);
  };

  $B.ui.dialog = (function () {
    var self = {},
      privates = {},
      helpers = {},
      coreDialogs = {},
      dialogs = {},
      toString = Object.prototype.toString;

    // Helper methods

    // Check if obj is an object
    helpers.isFunction = function (obj) {
      return toString.call(obj) === '[object Function]';
    };

    helpers.isObject = function (obj) {
      return toString.call(obj) === '[object Object]';
    };

    // Check if obj is a string
    helpers.isString = function (obj) {
      return toString.call(obj) === '[object String]';
    };


    // Private methods

    // add dialog to dialogs array
    privates.add = function (id, $dialog, isCore) {
      if (isCore) {
        coreDialogs[id] = $dialog;
      } else {
        dialogs[id] = $dialog;
      }
    };

    // delete dialog from dialogs array
    privates.del = function (id, isCore) {
      if (isCore) {
        delete coreDialogs[id];
      } else {
        delete dialogs[id];
      }
    };

    privates.undelegateEvent = function (id, isCore) {
      var button,
        $dialog = isCore ? coreDialogs[id] : dialogs[id];

      button = $dialog.dialog('option', 'trigger');
      if (button) {
        $(document).off('click.b-dialog-open', button.selector);
      }
    };

    // make the dialog always tabbable when open
    privates.fixDialogTabbing = function ($dialog, $uiDialog) {
      var firstTabbable = $('body').find(':tabbable:first'),
        lastTabbable = $('body').find(':tabbable:last'),
        dialogFirstTabbable,
        focusDialogFirstTabbable = function () {
          dialogFirstTabbable.focus();
        },
        focusEvent = 'focus.fixTabToDialog',
        dialogTrigger = $dialog.dialog('trigger');

      $dialog
        .on('dialogopen', function () {
          dialogFirstTabbable = $uiDialog.find(':tabbable:first');
          firstTabbable.on(focusEvent, focusDialogFirstTabbable);
          lastTabbable.on(focusEvent, focusDialogFirstTabbable);
        })
        .on('dialogclose', function (event) {
          firstTabbable.off(focusEvent);
          lastTabbable.off(focusEvent);
          // return focus to the trigger
          if (dialogTrigger) {
            dialogTrigger.focus();
          }
        });
    };

    privates.reset = function ($dialog) {
      var form = $dialog.find('form')[0];
      if (form) {
        $dialog.on('dialogclose', function (ev) {
          form.reset();
        });
      }
    };

    privates.setWidth = function ($dialog, $uiDialog) {
      var widthClass = $dialog.data('dialog-width');
      if (widthClass) {
        $uiDialog.addClass(widthClass);
      }
    };


    /*\
     * $B.ui.dialog.get
     [ method ]
     * Get an existing dialog with the given id or any of its ui dialog options
     > Arguments
     - id (string) id of the dialog
     - option (string) #optional get the value of ui dialog option (for setting a value see @$B.ui.dialog.set)
     = (object) jQuery object of the dialog content if only the id is pass
     * or if an option is passed
     = (any) Value of the specified option
     > Usage
     | $B.ui.dialog.get('id')
     | $B.ui.dialog.get('id', 'zIndex')
    \*/
    self.get = function (id, option) {
      if (!id || !dialogs[id]) {
        return false;
      } else if (!option) {
        return dialogs[id];
      } else if (option && helpers.isString(option)) { // assume options is a string containing 1 option to get
        return dialogs[id].dialog('option', option);
      }
    };


    /*\
     * $B.ui.dialog.exists
     [ method ]
     * Tells if a specific dialog exists on the stack
     > Arguments
     - id (string) id of the dialog
     = (boolean) True if the dialog exists
     > Usage
     | $B.ui.dialog.exists('myDialogID')
    \*/
    self.exists = function (id) {
      return (id && dialogs[id]);
    };


    /*\
     * $B.ui.dialog.set
     [ method ]
     * Set an option to an existing dialog
     > Arguments
     - id (string) id of the dialog
     - options (object) object setting the ui dialog options
     = (object) jQuery object of the dialog content
     > Usage
     | $B.ui.dialog('id', {zIndex: 0, modal: false});
    \*/
    self.set = function (id, options) {
      // assume options is an object to set multiple options
      if (options && helpers.isObject(options)) {
        return self.get(id).dialog(options);
      } else if (options && helpers.isString(options)) { // if is a string return 1 option
        return self.get(id, options);
      }
    };


    /*\
     * $B.ui.dialog.isOpen
     [ method ]
     * Return a boolean indicating wether the specified dialog is open
     > Arguments
     - id (string) id of the dialog
     = (boolean) Returns true or false
     > Usage
     | $B.ui.dialog.isOpen('id');
    \*/
    self.isOpen = function (id) {
      var $dialog = self.get(id);
      if ($dialog) {
        return $dialog.dialog('isOpen');
      }
    };


    /*\
     * $B.ui.dialog.moveToTop
     [ method ]
     * Move a dialog to the top of the stack
     > Arguments
     - id (string) id of the dialog
     = (object) jQuery object of the dialog content
     > Usage
     | $B.ui.dialog.moveToTop('id');
    \*/
    self.moveToTop = function (id) {
      return self.get(id).dialog('moveToTop');
    };


    /*\
     * $B.ui.dialog.destroy
     [ method ]
     * Destroy an existing dialog with the given id (to destroy all dialogs see @$B.ui.dialog.destroyAll)
     > Arguments
     - id (string) id of the dialog to destroy
     = (boolean) returns true if success, false if no dialog to delete
     > Usage
     | $B.ui.dialog.destroy('id');
    \*/
    self.destroy = function (id) {
      var dialogToDestroy = dialogs[id],
        isCore = false;

      if (!dialogs[id]) {
        dialogToDestroy = coreDialogs[id];
        if (dialogToDestroy) {
          isCore = true;
        }
      }


      /*
      Esta condicion anula el metodo. Asi sirve solo para destruir la modal de loading.
      Si lo comento, no funcionan modales en varios sitios. Me imagino que se esta llamando el metodo de
      destrotAll en demasiados sitios. Metodo que por cierto no va hacer nada mas que quitar la modal del loading
      -----------------------------------------------------------------------------------
      */
      if ((self.isOpen(id)) && (id !== 'loading-app')) {
        return;
      }

      if (dialogToDestroy) {
        // undelegate click event that opens the dialog
        privates.undelegateEvent(id, isCore);
        // destroy ui dialog
        dialogToDestroy.dialog('destroy').remove();
        // delete from dialogs stack
        privates.del(id, isCore);

        self.disableBodyScroll(false);
        return true;
      }
      return false;
    };


    /*\
     * $B.ui.dialog.destroyAll
     [ method ]
     * Destroy all dialogs that were created (to destroy a specific dialog see @$B.ui.dialog.destroy)
     = (boolean) returns true if success, false if no dialogs to delete
     > Usage
     | $B.ui.dialog.destroyAll();
    \*/
    self.destroyAll = function () {
      var id;
      // return if there are no dialogs
      if ($.isEmptyObject(dialogs)) {
        return false;
      }

      // delete all dialogs from stack
      for (id in dialogs) {
        if (dialogs.hasOwnProperty(id)) {
          self.destroy(id);
        }
      }
      return true;
    };


    /*\
     * $B.ui.dialog.open
     [ method ]
     * Open an existing dialog with the given id
     > Arguments
     - id (string) id of the dialog to open
     - options (object) #optional object containing options to create a dialog
     = (object) jQuery object of the dialog content
     > Usage
     | $B.ui.dialog.open('id');
     | // if an options object is passed it will be created and opened
     | $B.ui.dialog.open('MyID', {
     |   modal: true,
     |   width: 500,
     |   height: 300
     | });
    \*/
    self.open = function (id, options) {
      if (!self.get(id) && !options) {
        throw new Error($B.app.literals.coreLiterals.no_dialog_with_id + id + $B.app.literals.coreLiterals.no_options_for_dialog);

      // if there is a dialog with that id open it
      } else if (self.get(id)) {
        // call jQuery ui open
        self.get(id).dialog('open');

        // return dialog itself to allow chain
        return self.get(id);

      // if options are provided the dialog will be created and opened
      } else if (options && helpers.isObject(options)) {
        if (id) {
          options.id = id;
        }
        // create the dialog
        return self.create(options).dialog('open');
      }
    };


    /*\
     * $B.ui.dialog.close
     [ method ]
     * Close an existing dialog with the given id
     > Arguments
     - id (string) id of the dialog to open
     = (object) jQuery object of the dialog content
     > Usage
     | $B.ui.dialog.close('id');
    \*/
    self.close = function (id) {
      if (!self.get(id)) {
        throw new Error($B.app.literals.coreLiterals.no_dialog_with_id  + id + "'");
      } else { // if there is a dialog with that id close it
        return self.get(id).dialog('close'); // allow chain returning jQuery obj
      }
    };

    self.closeActive = function () {
      var id;
      // return if there are no dialogs
      if ($.isEmptyObject(dialogs)) {
        return false;
      }

      // delete all dialogs from stack
      for (id in dialogs) {
        if (dialogs.hasOwnProperty(id)) {
          if (self.isOpen(id)) {
            self.close(id);
          }
        }
      }
      return true;
    };

    self.showLoading = function ($dialog, autofit) {
      // show loading for closing
      var text = $dialog.find('.contenidoModal').attr('data-loading-text'),
        modalAutoFit = (autofit === true) ? true : false,
        closingMsg = _.c_v06_mensajes_cargando({ text: text || $B.app.literals.cargando }),
        $closeButton = $dialog.find('.cerrarModal').hide(),
        $cuerpoModal = $dialog.find('.contenedorPaso')[0] ? $dialog.find('.contenedorPaso') : $dialog.find('.contenidoModal'),
        cuerpoModalHeight = $cuerpoModal.outerHeight() - 3,
        cuerpoModalWidth = $cuerpoModal.outerWidth() - 3,
        $closingMsg,
        idLoading;
     /* if ($dialog.hasClass('c-contenedores-modalDetalle')) {
        modalAutoFit = true;
      }*/
      modalAutoFit = true;
      $dialog.find('.scrollbarModal').hide();

      $cuerpoModal.css({
        position: 'relative'
      });

      $cuerpoModal.append(closingMsg).css({position: 'relative'});
      $closingMsg = $dialog.find('.c-mensajes-cargando').wrap('<div class="jsLoadingDiv">').parent().css({
        position: 'absolute',
        //width: $dialog.width() - 2,
        width: cuerpoModalWidth,
        //height: cuerpoModalHeight,
        height: modalAutoFit ? cuerpoModalHeight : 'auto',
        backgroundColor: '#fff',
        //left: -9,
        left: 1,
        /*top: (function () {
          if (modalAutoFit) {
            return 1;
          } else {
            return Math.floor((cuerpoModalHeight - $dialog.find('.c-mensajes-cargando').parent().height()) / 2);
          }
        }())*/
        top: 1
      })
        .end()
        .css({
          /*position: 'relative',
          top: '50%'*/
          paddingTop: Math.floor(($dialog.find('.jsLoadingDiv').height() - $dialog.find('.c-mensajes-cargando').height()) / 2)
        });

      idLoading = $B.utils.aria.loading($cuerpoModal, 'active');
      $cuerpoModal.find('.c-mensajes-cargando').first().attr('id', idLoading);

      // separate so we can get its actual height
      $closingMsg.css({
        //marginTop: -$closingMsg.height()
      });
    };

    self.removeLoading = function ($dialog) {
      var $cuerpoModal = $dialog.find('.contenedorPaso')[0] ? $dialog.find('.contenedorPaso') : $dialog.find('.cuerpoModal');
      $cuerpoModal.css({
        position: ''
      });
      $dialog.find('.c-mensajes-cargando').parent().remove();
      $dialog.find('.jsLoadingDiv').remove();
      $dialog.find('.cerrarModal').show();
      $B.utils.aria.loading($cuerpoModal, 'inactive');
    };

    self.disableBodyScroll = function (disable) {
      $('html').css('overflow', disable ? 'hidden' : 'visible');
      $('body').css('overflow', disable ? 'scroll' : 'auto');
    };

    self.focusOutsideDialog = function (link) {
      if (link) {
        if (link.is('[tabindex]')) {
          link.focus();
        } else {
          link.closest('[tabindex]').focus();
        }
      }
    };


    /*\
     * $B.ui.dialog.create
     [ method ]
     * Creates a ui dialog with given options
     > Arguments
     - options (object) object of name/value pairs
     o {
     o    el (string) #optional selector for the element to act as a dialog
     o    id (string) unique id for the dialog
     o    content (string) string content for de dialog (could be the inner html of a div `$('#myDiv').html())`
     o    afterLoad (callback) callback function to execute after loading dialog content via ajax
     o    button (object|string) jQuery object or selector for the button that triggers the dialog
     o    url (string, function) url string or function that returns a url string
     o    urlParams (object, function) object or function that returns an object with params for the url
     o    tagName (string) the tagName for creating the dialog if no element was provided (div by default)
     o    dialogOptions (object) Any jQuery ui option (see jquery ui documentation)
     o    onCreate (function) callback that fires only once when the dialog is created
     o }
     = (object) jQuery object of the dialog content
     > Usage
     | $B.ui.dialog.create({
     |   id: 'MyDialog',
     |   el: '#DialogElement',
     |   button: '#button',
     |   dialogOptions: {
     |     draggable: true,
     |     width: 640
     |   }
     |  });
    \*/
    self.create = function (options) {
          // default dialog class
      var settings,
        $dialog, // jQuery dialog content obj
        $uiDialog, // placeholder for ui dialog element
        LOADING_IMG,
        onClick,

        // default $B.ui.dialog options
        defaults = {
          el: null,
          id: "",
          content: "",
          afterLoad: null,
          button: null,
          url: null,
          urlParams: null, // must return an object
          tagName: 'div',
          resetOnClose: true,
          onCreate: null,
          dialogClass: 'c-contenedores-ventanaModal',
          small: false,
          closeOnClick: true,
          // defaults for the jQuery UI dialog
          dialogOptions: {
            zIndex: 99999,
            autoOpen: false,
            modal: true,
            show: 'fade',
            resizable: false,
            draggable: false,
            // custom option, save button (init on false)
            trigger: false
          },
          link: false
        },
        _open,
        _close;

      // extend dialogOptions
      settings = $.extend(true, {}, defaults, options);

      // not used for now
      if (settings.small) {
        settings.dialogClass += ' w640';
      }

      // check mandatory params
      if (!settings.id) {
        throw new Error($B.app.literals.coreLiterals.provide_an_id);
      }
      if (dialogs[settings.id]) {
        throw new Error($B.app.literals.coreLiterals.create_the_id + settings.id + ' ' + $B.app.literals.coreLiterals.exists_choose_another);
      }

      // dialog element could be a string selector or jQuery object
      $dialog = (settings.el instanceof jQuery) ? settings.el : $(settings.el);

      // the dialog is not on the dom and there is content provided, create the element and set its content
      if (!$dialog[0] && settings.content) {
        $dialog = $(document.createElement(settings.tagName));

        // insert provided content to the dialog must be string
        if (settings.content && helpers.isString(settings.content)) {
          $dialog.html(settings.content);
        } else {
          throw new Error($B.app.literals.coreLiterals.content_must_be_string);
        }
      } else if (!$dialog[0] && !settings.content) {
        throw new Error($B.app.literals.coreLiterals.the_element + settings.el + $B.app.literals.coreLiterals.not_found_on_dom);
      }

      _open = settings.dialogOptions.open;
      _close = settings.dialogOptions.close;

      settings.dialogOptions.close = function () {
        self.disableBodyScroll(false);
        if (helpers.isFunction(_close)) {
          _close.apply($dialog[0], arguments);
        }
        self.focusOutsideDialog(settings.link);
      };
      settings.dialogOptions.destroy = function () {
        self.focusOutsideDialog(settings.link);
      };

      settings.dialogOptions.open = function () {
        self.disableBodyScroll(true);
        $B.ui.dialogCenter();
        if (helpers.isFunction(_open)) {
          _open.apply($dialog[0], arguments);
        }
      };


      // initialize jquery ui dialog with options provided
      $dialog
        .dialog(settings.dialogOptions)
        .on('click.dialog-accept', '[data-dialog-accept]', function (event) {
          if ($(event.currentTarget).hasClass('inactivo') || $(event.currentTarget).hasClass('inactivoValidacion')) {
            return false;
          }

          $dialog.dialog('close');
          // if there is an accept function defined on the options, call it
          if (settings.accept && helpers.isFunction(settings.accept)) {
            settings.accept.call($dialog, event);
          }
        })
        .on('click.dialog-close-error', '[data-cidview-associated]', function (event) {
          // call the same function of appView that closes error msg
          $B.router.appView.reloadView(event);
        });

      if (settings.closeOnClick) {
        $dialog.on('click.dialog-close', '[data-dialog-close], [data-dialog-cancel]', function () {
          $dialog.dialog('close');
        });
      }

      // External stuff
      $B.ui.initFormComponents($dialog);
      $B.ui.c_buscadores_predictivoLiquido($dialog.find('.c-buscadores-predictivo-liquido'));
      // end External stuff

      // get ui dialog element
      $uiDialog = $($dialog.data('dialog').uiDialog).attr('id', 'ui-dialog-' + settings.id).addClass(settings.dialogClass);

      if (settings.dialogOptions.height && _.isNumber(settings.dialogOptions.height)) {
        $uiDialog.attr('data-fixed-height', settings.dialogOptions.height);
      }

      if (settings.dialogClass !== 'c-contenedores-modalDetalle') {
        if (settings.dialogOptions.width < 700) {
          // pequenyo
          $uiDialog.addClass('w640');
          $dialog.find('.cuerpoModal').addClass('container_8');
        } else {
          // grande
          $dialog.find('.cuerpoModal').addClass('container_12');
        }
      }

      // set dialog width from its data-dialog-width attribute
      // must be a class e.i. data-dialog-width="w640"
      privates.setWidth($dialog, $uiDialog);

      // attach event handler to fix tab to the dialog when opened
      privates.fixDialogTabbing($dialog, $uiDialog);

      // add to dialogs stack
      privates.add(settings.id, $dialog, settings.isCore);

      // if resetOnClose is true (by default it is), resets the form inside the dialog
      if (settings.resetOnClose) {
        privates.reset($dialog);
      }

      // call onCreate callback (run once when modal is created)
      if (settings.onCreate && helpers.isFunction(settings.onCreate)) {
        settings.onCreate.call($dialog);
      }

      // TODO:
      // loading image/element
      LOADING_IMG = '';// $('<div class="ui-helper-hidden">Cargando...</div>').insertBefore($dialog);

      // if there is an element defined to open the dialog, attach click event
      if (settings.button) {
        // if is not a jQuery obj but a string selector wrap it with jQuery

        if (!helpers.isString(settings.button)) {
          throw new Error($B.app.literals.coreLiterals.button_must_be_string);
        }

        // default click function for opening the dialog
        onClick = function (ev) {
          ev.preventDefault();

          var $trigger = $(this);

          // open the dialog
          // save a referece of the element that triggered this dialog
          $dialog
            .dialog({trigger: { btn: $trigger, selector: settings.button }})
            .dialog('open');

          // if there is a url provided load the dialog content from there
          if (settings.url) {
            // allow the url be a function
            if (helpers.isFunction(settings.url)) {
              settings.url = settings.url.call(this);
              if (!helpers.isString(settings.url)) {
                throw new Error($B.app.literals.coreLiterals.url_must_be_string);
              }
            }
            self.load.call($dialog, settings);
          } else if (settings.ajax) { // if ajax is true get the url from the href attribute or from data-dialog-url
            settings.url = $trigger.attr("href") || $trigger.data("dialog-url");
            // if we couldn't get the url from href
            if (!settings.url) {
              throw new Error($B.app.literals.coreLiterals.specify_a_url);
            }
            self.load.call($dialog, settings);
          }
        };

        // save a referece of the element that triggered this dialog (as a string if not opened yet)
        $dialog.dialog({trigger: { btn: $(settings.button), selector: settings.button }});

        // delegate click event from document
        $(document).on('click.b-dialog-open', settings.button, onClick);

      // no button provided
      } else if (settings.ajax || settings.url) {
        // load content on open
        $dialog.dialog({
          open: function (ev, ui) {
            self.load.call($dialog, settings);
          }
        });

      // no ajax or url
      } else {
        $dialog.dialog();
      }

      $B.ui.dialogCenter();

      return $dialog;
    };


    self.load = function (settings) {
      var $dialog = this,
        loadingImg = $dialog.prev().show(), // show loading img
        // allow params to be a function
        _dataToSend = (settings.urlParams) ? helpers.isFunction(settings.urlParams) ? settings.urlParams() : settings.urlParams : {};

      if (_dataToSend && !helpers.isObject(_dataToSend)) {
        throw new Error($B.app.literals.coreLiterals.urlParams_must_be_object);
      }

      // prevent url caching adding a timestamp
      if (!settings.cache) {
        _dataToSend.t = new Date().getTime();
      }

      // empty any dialog content and load the new one
      $dialog.empty().load(settings.url, _dataToSend, function (response, status, xhr) {
        // hide loading img
        loadingImg.hide();

        // if status 401 redirect to login
        if (xhr.status === 401) {
          location.reload();
          return false;
        } else if (xhr.status === 500) { // show error on 500
          $dialog.html('<p>' + $B.app.literals.error_msg + '</p>');
          return false;
        } else if (settings.afterLoad && helpers.isFunction(settings.afterLoad)) { // all ok call afterLoad fn if defined
          // pass the dialog elem as context
          settings.afterLoad.apply($dialog, arguments);
        }
      });
    };

    return self;
  }());
}(jQuery, window));

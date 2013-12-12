/*!
 * JavaScript Library Boilerplate
 * Copyright (c) 2013 Denis Ciccale (@tdecs)
 * Released under MIT license (https://raw.github.com/dciccale/jslibraryboilerplate/master/LICENSE.txt)
 */
(function (window) {

  /*\
   * $
   [ object ]
   * Global namespace for using JSLB functions.
   *
   * For working with DOM elements see @$(…)
  \*/

  var document = window.document,

    // Helper methods
    push = [].push,
    slice = [].slice,
    splice = [].splice,
    forEach = [].forEach;

  /*\
   * $(…)
   * JSLB object collection.
   * All methods called from a JSLB collection affects all elements in it.
  \*/
  function JSLB(selector) {

    // Auto-create new instance without the 'new' keyword
    if (!(this instanceof JSLB)) {
      return new JSLB(selector);
    }

    // No selector, return empty JSLB object
    if (!selector) {
      return this;
    }

    // Already a JSLB object
    if (selector instanceof JSLB) {
      return selector;
    }

    // Already a dom element?
    if (selector.nodeType) {
      this[0] = selector;
      this.length = 1;
      return this;
    }

    // Is css selector, query the dom
    if (typeof selector === 'string') {
      // Find elements, turn NodeList to array and push them to JSLB
      return push.apply(this, slice.call(document.querySelectorAll(selector)));
    }

    // It's a function, call it when DOM is ready
    if (typeof selector === 'function') {
      return JSLB(document).ready(selector);
    }
  };

  JSLB.prototype = {
    /*\
     * $(…).length
     [ property ]
     * The length of the current collection.
     = (number) Integer representing the length of the current collection.
     > Usage
     * Having these paragraphs:
     | <p>one</p>
     | <p>two</p>
     | <p>three</p>
     * Grab them and check for the length property:
     | $('p').length; // 3
    \*/
    length: 0,

    /*\
     * $(…).ready
     [ method ]
     * Execute a callback after de DOM is completely loaded
     > Parameters
     - callback (function) A function to call after de DOM is ready
     = (object) The original element
     > Usage
     | $(document).ready(function () {
     |   console.log('the DOM is loaded!');
     | });
     * Or using the shortcut (recommended)
     | $(function () {
     |   console.log('the DOM is loaded!);
     | });
    \*/
    ready: function (callback) {
      // First check if already loaded
      if (/t/.test(document.readyState)) {
        callback(JSLB);

      // Listen when it loads
      } else {
        document.addEventListener('DOMContentLoaded', function () {
          callback(JSLB);
        }, false);
      }
    },

    /*\
     * $(…).each
     [ method ]
     * Iterate over a JSLB objct, executing a function for each element.
     > Parameters
     - callback (function) A function to call for each element in the collection.
     = (object) JSLB object
     > Usage
     * Here we have an unordered list:
     | <ul>
     |   <li>Item 1</li>
     |   <li>Item 2</li>
     |   <li>Item 3</li>
     | </ul>
     * You can iterate over all the list items and execute a function
     | $('li').each(function (el, index, collection) {
     |   console.log('index of ' + $(this).text() + ' is: ' + index);
     | });
     * This will log the following message
     *
     * index of Item 1 is: 0
     *
     * index of Item 2 is: 1
     *
     * index of Item 3 is: 2
    \*/
    each: function (callback) {
      forEach.call(this, function (el, i) {
        callback.call(el, i, el);
      });
    },

    /*\
     * $(…).text
     [ method ]
     * Get the text of the first element in the set or set the text of all the matched elements.
     > Parameters
     - value (string) #optional A string of text to set as the text content of all matched elements.
     = (string) string value of the text content of the element if no parameter passed.
     = (object) current JSLB object.
     > Usage
     * Get the text content of an element
     | <p>Demo text</p>
     * without passing any parameter to the function:
     | $('p').text(); // 'Demo text'
     * To replace the text of the paragraph pass a string parameter to the function:
     | $('p').text('Another text');
     * Now the text content was replaced:
     | <p>Another text</p>
    \*/
    text: function (value) {
      // No element
      if (!this[0]) {
        return this;
      }

      // Get value
      if (!value) {
        return this[0].textContent;

      // Set value to all elements on the collection
      } else {
        return this.each(function () {
          this.textContent = value;
        });
      }
    }
  };

  // Abbreviate "prototype" to "fn"
  JSLB.fn = JSLB.prototype;

  // Just to have an array like instanceof JSLB object
  JSLB.prototype.splice = splice;

  // Expose to global object
  window.JSLB = window.$ = JSLB;
}(window));

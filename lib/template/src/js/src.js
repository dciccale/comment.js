/* global window:true */
(function (window) {
  'use strict';

  // prettyfy code
  window.prettyPrint();

  var document = window.document;

  // add links to each line
  var lis = [].slice.call(document.querySelectorAll('ol.linenums li'));
  var a = document.createElement('a');
  lis.forEach(function (li, i) {
    var a2 = a.cloneNode();
    a2.id = 'L' + (i + 1);
    a2.href = '#' + a2.id;
    li.insertBefore(a2, li.firstChild);
  });
}(window));

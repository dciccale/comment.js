/* global window:true */
(function (window) {
  'use strict';

  var document = window.document;
  var toc = document.getElementById('cjs-toc');
  var input = document.getElementById('cjs-filter');
  var resetButton = document.getElementById('cjs-search-reset');
  var nodes = [].slice.call(toc.getElementsByTagName('a'));
  var filter, resetFilter;

  nodes = nodes.map(function (a) {
    var text = a.textContent ? a.textContent : a.innerText;
    return {
      text: text.toLowerCase(),
      li: a.parentNode
    };
  });

  filter = function () {
    nodes.forEach(function (node) {
      var value = input.value.toLowerCase().trim();
      node.li.style.display = !value || node.text.indexOf(value) > -1 ? 'block' : 'none';
    });
  };

  resetFilter = function () {
    if (input.value) {
      input.value = '';
      filter();
    }
  };

  input.onkeyup = filter;
  resetButton.onclick = resetFilter;

  // prettyfy code
  window.prettyPrint();
}(window));

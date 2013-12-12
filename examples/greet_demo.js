// This script is used to make live demos in your docs
(function () {

  'use strict';

  var input = document.getElementById('name');

  document.getElementById('btn').addEventListener('click', function () {
    var name = input.value;

    if (!name) {
      input.style.borderColor = '#FF1F00'
    } else {
      input.style.borderColor = '';
      greet(name);
    }
  });
}());

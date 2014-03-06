// This script is used to make live demos in your docs
(function () {

  'use strict';

  var input = document.getElementById('name');

  document.getElementById('btn').addEventListener('click', function () {
    var name = input.value;

    if (name) {
      greet(name);
    }
  });
}());

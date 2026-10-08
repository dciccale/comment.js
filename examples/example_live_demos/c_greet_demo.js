// This script connects the live demo controls to the documented function.
(function () {
  'use strict';
  var input = document.getElementById('c_name');
  var result = document.getElementById('c_result');
  document.getElementById('btn').addEventListener('click', function () {
    var name = input.value.trim();
    result.textContent = name ? greet(name) : 'Enter a name first.';
  });
}());

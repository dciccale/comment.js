(function (toc) {
  var document = window.document;

  // prettyfy code
  window.prettyPrint();

  // script for filtering api item
  toc = document.getElementById('cjs-toc');

  if (!toc) {
    return;
  }

  var cjs, commentjsTocFilter;

  cjs = commentjsTocFilter = {
    toc: toc,
    lis: toc.getElementsByTagName('a'),
    names: [],
    r_name: /[^\.\(]*(?=(\(\))?$)/,
    input: document.getElementById('cjs-filter'),
    resetButton:  document.getElementById('cjs-search-reset'),

    // initialize filtering functionality
    init: function () {
      // populate names array with li items
      // and its searchable text
      cjs.forEach(cjs.lis, function (elem) {
        cjs.names.push({
          li: elem.parentNode,
          text: elem.innerText.match(cjs.r_name)[0]
        });
      });

      cjs.input.onclick = cjs.input.onchange = cjs.input.onkeydown = cjs.input.onkeyup = cjs.filter;
      cjs.resetButton.onclick = cjs.resetFilter;
    },

    // helper function to iterate arrays
    forEach: function (arr, callback) {
      var i, l = arr.length;
      for (i = 0; i < l; i += 1) {
        if (callback.call(arr[i], arr[i], i, arr) === false) {
          break;
        }
      }
      return arr;
    },

    // make sure to work with strings
    toString: String,

    // check if is an abbreviated search
    isABBR: function (str, abbr) {
      var letters = abbr.toUpperCase().split(''),
        first = letters.shift(),
        r_abbr = new RegExp('^[' + first.toLowerCase() + first + '][a-z]*' + letters.join('[a-z]*') + '[a-z]*$');

      return r_abbr.test(cjs.toString(str));
    },

    // calculate weight
    calcWeight: function (txt, search) {
      txt = cjs.toString(txt);
      search = cjs.toString(search);

      var i, j, l, score = 0, chunk = txt.toLowerCase();

      if (txt === search) {
        return 1;
      }

      if (!txt || !search) {
        return 0;
      }

      if (cjs.isABBR(txt, search)) {
        return 0.9;
      }

      for (i = 0, l = search.length; i < l; i += 1) {
        j = chunk.indexOf(search.charAt(i));
        if (j !== -1) {
          chunk = chunk.substring(j + 1);
          score += 1 / (j + 1);
        }
      }

      score = Math.max(score / l - Math.abs(txt.length - l) / txt.length / 2, 0);
      return score;
    },

    // optimize saving last search
    lastSearchText: '',

    // filters toc items
    filter: function () {
      var searchTxt = cjs.input.value,
        res = [];

      if (cjs.lastSearchText === searchTxt) {
        return;
      }

      if (searchTxt.length > 1) {
        cjs.forEach(cjs.names, function (name) {
          res.push({
            li: name.li,
            weight: cjs.calcWeight(name.text, searchTxt)
          });
        });

        // sort by matching weight
        res.sort(function (a, b) {
          return b.weight - a.weight;
        });

        cjs.forEach(res, function (obj) {
          toc.appendChild(obj.li);
        });

      // only reset when no search text at all
      } else if (!searchTxt) {
        cjs.forEach(cjs.names, function (name) {
          toc.appendChild(name.li);
        });
      }

      // save last search
      cjs.lastSearchText = searchTxt;
    },

    // resets filter
    resetFilter: function () {
      // reset only if there is a filter text
      if (cjs.input.value) {
        cjs.input.value = '';
        cjs.filter();
      }
    }
  };

  // init filterable toc
  commentjsTocFilter.init();
}());
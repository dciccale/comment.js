module.exports = (function () {
  var tokenRegex = /\{([^\}]+)\}/g,
    // regex to match dot notation .xxxxx or ["xxxxx"] to get object properties
    objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g,
    replacer = function (all, key, obj) {
      var res = obj;
      key.replace(objNotationRegex, function (all, name, quote, quotedName, isFunc) {
        name = name || quotedName;
        if (res) {
          if (name in res) {
            res = res[name];
          }
          if (typeof res == "function" && isFunc) {
            res = res();
          }
        }
      });
      res = (res == null || res == obj ? all : res) + "";
      return res;
    };
  return function (str, obj) {
    return String(str).replace(tokenRegex, function (all, key) {
      return replacer(all, key, obj);
    });
  };
}());
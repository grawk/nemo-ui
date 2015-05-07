'use strict';

var glob = require('glob');
var fs = require('fs');
var path = require('path');

function Util() {
  this.suitePath = null;
}


Util.prototype.getViews = function getViews(suitePath, cb) {
  glob(suitePath + "/locator/*", function (er, files) {
    files.forEach(function (file, index, arr) {
      arr[index] = file.split(suitePath + "/locator/")[1].split(".json")[0];
    });
    console.log('views are', files);
    cb(files);
  });
}
module.exports = new Util();
'use strict';

var glob = require('glob');
var fs = require('fs');
var path = require('path');

function Util() {
  this.suitePath = null;
}

Util.prototype.syncNemoConfig = function (suitePath, cb) {
  //read locator JSON files and sync with <suitePath>/config/nemo.json (setup.view.['view1', 'view2', 'view3']
  this.getViews(suitePath, processViews);

  function processViews(views) {
    var config = require(path.join(suitePath, 'config', 'nemo'));
    //console.log('config', config);
    if (!config.setup) {
      config.setup = {}
    }
    config.setup.view = views;
    if (views.length === 0) {
      delete config.setup.view;
    }
    //console.log('config', JSON.stringify(config, null, 2));
    fs.writeFile(path.join(suitePath, 'config', 'nemo.json'), JSON.stringify(config, null, 2), function (err) {
      if (err) {
        cb(err);
      } else {
        cb(null, true);
      }
    });
  }


};

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
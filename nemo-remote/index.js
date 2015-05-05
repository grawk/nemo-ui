'use strict';

var Nemo = require('nemo');
var path = require('path');
function NemoRemote() {
  this.nemo = {};
}

NemoRemote.prototype.start = function (cb) {
  var nemoBaseDir = __dirname;
  this.nemo = Nemo(nemoBaseDir, function nemoSetup(err) {
    if (err) {
      return cb(err);
    }
    cb(null);
  });
  //).setup().then(function (_nemo) {
  //  self.nemo = _nemo;
  //  return self.nemo.wd.promise.fulfilled();
  //}).then(function () {
  //  return self.nemo.driver.get(self.nemo.props.targetBaseUrl);
  //});
};

NemoRemote.prototype.injectUI = function () {
  return this.nemo.driver.executeScript(function () {
    var iframe = document.createElement("iframe");

    iframe.setAttribute("src", "http://localhost:2330/remote.html");
    iframe.setAttribute('id', 'nemoUI_iframe');
    iframe.setAttribute("style", "position: absolute; top:0; right: 0; width: 400px; height: 400px; border: 1px solid #00A000");
    document.querySelector("body").appendChild(iframe);
  }, function (err) {
    console.log('injectUI err', err);
  });
};
NemoRemote.prototype.injectWalkerStyle = function () {
  return this.nemo.driver.executeScript(function () {
    if (document.querySelector('#__nemo__walker__stylesheet')) {
      return;
    }
    var walkerStyle = document.createElement("style");
    walkerStyle.setAttribute('id', '__nemo__walker__stylesheet');
    walkerStyle.innerText = '.__nemo__walker__ {border:2px solid red}';

    document.querySelector("head").appendChild(walkerStyle);
  }, function (err) {
    console.log('injectWalkerStyle err', err);
  });
};
NemoRemote.prototype.reinjectUI = function () {
  var self = this;
  return this.nemo.driver.executeScript(function () {
    var present = document.querySelector("#nemoUI_iframe");
    if (present === null) {
      return false;
    } else {
      return true;
    }
  }).then(function (returned) {
    if (returned === false) {
      console.log('reinject NemoUI');
      self.injectUI();
    }
  }, function (err) {
    console.log('checkUI error', err);
  });
};
module.exports = new NemoRemote();
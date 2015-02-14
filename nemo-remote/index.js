'use strict';

var Nemo = require('nemo');

function NemoRemote() {
  this.nemo = {};
}

NemoRemote.prototype.start = function (config) {
  var self = this;
  return (Nemo(config)).setup().then(function (_nemo) {
    self.nemo = _nemo;
    return self.nemo.wd.promise.fulfilled();
  }).then(function () {
    return self.nemo.driver.get(self.nemo.props.targetBaseUrl);
  });
};

NemoRemote.prototype.injectUI = function () {
  return this.nemo.driver.executeScript(function () {
    var iframe = document.createElement("iframe");

    iframe.setAttribute("src", "http://localhost:2330/remote.html");
    iframe.setAttribute("style", "position: absolute; top:0; right: 0; width: 400px; height: 400px; border: 1px solid black");
    document.querySelector("body").appendChild(iframe);
  }, function (err) {
    console.log('injectUI err', err);
  });
};
NemoRemote.prototype.reinjectUI = function () {
  var self = this;
  return this.nemo.driver.executeScript(function () {
    var present = document.querySelector("#nemo-ui-script");
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
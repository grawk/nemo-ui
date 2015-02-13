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
    var scr = document.createElement("script");
    var link = document.createElement("link");
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.media = 'screen';
    link.href = 'http://localhost:2330/remote.css';

    scr.setAttribute("src", "http://localhost:2330/remote.js");
    scr.setAttribute("data-baseurl", "http://localhost:2330");
    scr.setAttribute("id", "nemo-ui-script");
    document.querySelector("head").appendChild(scr);
    document.querySelector("head").appendChild(link);
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
#!/usr/bin/env node

var program = require('commander');
var path = require('path');
var serv = require(path.resolve(__dirname, '../server'));
var nemoRemote = require(path.resolve(__dirname, '../nemo-remote'));
var watcher = null;

program
  .version('0.0.1')
  .option('-u, --url [type]', 'URL to launch')
  .option('-b, --browser [type]', 'Browser to use')
  .option('-p, --path [value]', 'Path to Nemo test directory');


program.parse(process.argv);

var url = program.url;
var browser = program.browser;
var suitePath = program.path;
console.log('suitePath', suitePath);
console.log('url %s, browser %s', program.url, program.browser);
//launch browser
var config = {
  plugins: {
    "drivex": {
      "module": "nemo-drivex",
      "register": true
    },
    "locatex": {
      "module": "nemo-locatex",
      "register": true
    },
    "view": {
      "module": "nemo-view"
    }
  },
  nemoData: {
    targetBrowser: browser || "chrome",
    targetServer: "localhost",
    localServer: true,
    seleniumJar: "/usr/bin/selenium-server-standalone.jar",
    targetBaseUrl: url
  }
};
//start express
serv(suitePath);

//start Nemo
nemoRemote.start(config).then(function() {
  nemoRemote.injectUI();
});

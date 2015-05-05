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

process.env.BASE_URL = program.url;
process.env.BROWSER = program.browser;
var suitePath = program.path;
console.log('suitePath', suitePath);
console.log('url %s, browser %s', process.env.BASE_URL, process.env.BROWSER);
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
nemoRemote.start(function _uiInjector(err) {
  if (err) {
    throw err;
  }
  nemoRemote.injectUI();
});

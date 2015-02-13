var express = require('express');
var app = express();
var path = require('path');
var nemoRemote = require(path.resolve(__dirname, '../nemo-remote'));
var glob = require('glob');
var suitePath = null;
var options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm', 'html'],
  index: false,
  maxAge: '1d',
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now())
  }
};

app.use(express.static(path.resolve(__dirname, '../public'), options));
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  console.log('handling request', req.path);
  return next();
});
app.get('/', function (req, res) {
  res.send('Hello World!')
});
app.get('/views', function (req, res) {
  console.log('locator path', suitePath + "/locator/*");
  //read JSON files in directory
  glob(suitePath + "/locator/*", function (er, files) {
    files.forEach(function(file, index, arr) {
      arr[index] = file.split(suitePath + "/locator/")[1].split(".json")[0];
    });
    console.log('views are', files);
    res.json({
      "views": files
    });
  });
});

app.get('/view/:name', function (req, res) {
  var viewName = req.params.name;
  var view = require(suitePath+'/locator/'+viewName+'.json');
  res.json({
    'viewName': viewName,
    'viewJSON': view
  });
});

app.get('/view/:name/:locator/edit', function (req, res) {
  var viewName = req.params.name;
  var locatorName = req.params.locator;
  var view = require(suitePath+'/locator/'+viewName+'.json');
  res.json({
    'viewName': viewName,
    'locatorName': locatorName,
    'locatorJSON': view.locatorName
  });
});

app.get('/view/:name/:locator/delete', function (req, res) {
  var viewName = req.params.name;
  var locatorName = req.params.locator;
  var view = require(suitePath+'/locator/'+viewName+'.json');
  res.json({
    'uimsg': 'Deleted Locator ' + locatorName,
    'viewName': viewName,
    'viewJSON': view
  });
});

app.get('/reinject', function (req, res) {
  nemoRemote.reinjectUI().then(function () {
    res.send('OK');
  });
});
module.exports = function (_suitePath) {
  suitePath = _suitePath;
  var server = app.listen(2330, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Server app listening at http://%s:%s', host, port);

  });
};
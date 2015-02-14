var express = require('express');
var app = express();
var path = require('path');
var nemoRemote = require(path.resolve(__dirname, '../nemo-remote'));
var glob = require('glob');
var fs = require('fs');
var tmpView = null;
var suitePath = null;
var bodyParser = require('body-parser');

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
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.get('/', function (req, res) {
  res.send('Hello World!')
});
app.get('/views', function (req, res) {
  console.log('locator path', suitePath + "/locator/*");
  //read JSON files in directory
  getViews(function(files) {
    res.json({
      "uiView": "viewList",
      "views": files
    });
  });

});

app.get('/views/new', function (req, res) {
  //new view
  res.json({
    'uiView': 'viewEdit',
    'mode': 'new'
  });
});

app.post('/views/new', function (req, res) {
  //new view
  //get view name off of request
  var viewName = req.body.name;
  //save new JSON file
  fs.writeFile(suitePath+'/locator/'+viewName+'.json', '{}', function (err) {
    if (err) throw err;
    console.log('Saved ' + viewName + '.json');
    res.json({
      'uiView': 'viewEdit',
      'uiMsg': 'Added View ' + viewName,
      'viewName': viewName
    });
  });

});

app.get('/view/:name', function (req, res) {
  var viewName = req.params.name;
  var view = require(suitePath+'/locator/'+viewName+'.json');
  res.json({
    'uiView': 'viewEdit',
    'viewName': viewName,
    'viewJSON': view
  });
});


app.get('/view/:name/delete', function (req, res) {
  var viewName = req.params.name;
  fs.unlink(suitePath+'/locator/'+viewName+'.json', function(err) {
    if (err) {
      throw err;
    }
    getViews(function(files) {
      res.json({
        'uiMsg': 'Deleted View ' + viewName,
        'uiView': 'viewList',
        'views': files
      });
    });
  });
});

app.get('/view/:name/:locator/edit', function (req, res) {
  var viewName = req.params.name;
  var locatorName = req.params.locator;
  var locatorJson = require(suitePath+'/locator/'+viewName+'.json')[locatorName];
  var viewJson = {};
  viewJson[locatorName] = locatorJson;
  //tmpView = nemoRemote.nemo.view.addView({'name': 'tmpView', 'locator': viewJson}, false);
  //viewMethods = [];
  //Object.keys(tmpView).forEach(function(val, ind, arr) {
  //  console.log('val', val, 'constructor', val.constructor);
  //  if (val.indexOf(locatorName) === 0) {
  //    console.log('push');
  //    viewMethods.push(val);
  //  }
  //});
    res.json({
      'uiView': 'locatorEdit',
      'viewName': viewName,
      'locatorName': locatorName,
      'locatorJson': locatorJson,
      'locatorType': locatorJson.type,
      'locatorString': locatorJson.locator
    });
});

app.post('/view/:name/:locator/edit', function (req, res) {
  var viewName = req.params.name;
  var locatorName = req.params.locator;
  var locatorType = req.body.type;
  var locatorString = req.body.string;
  var viewJson = require(suitePath+'/locator/'+viewName+'.json');
  viewJson[locatorName] = {
    'type': locatorType,
    'locator': locatorString
  };
  fs.writeFile(suitePath+'/locator/'+viewName+'.json', JSON.toString(viewJson), function (err) {
    if (err) throw err;
    console.log('Saved ' + viewName + '.json');
    res.json({
      'uiView': 'viewEdit',
      'viewName': viewName,
      'uiMsg': 'Saved Locator ' + locatorName,
      'viewJSON': viewJson
    });
  });

});
app.get('/view/:name/locator/new', function (req, res) {
  var viewName = req.params.name;
  res.json({
    'uiView': 'locatorEdit',
    'mode': 'new',
    'viewName': viewName
  });
});

app.post('/view/:name/locator/new', function (req, res) {
  var viewName = req.params.name;
  var locatorName = req.body.name;
  var locatorType = req.body.type;
  var locatorString = req.body.string;
  var viewJson = require(suitePath+'/locator/'+viewName+'.json');
  viewJson[locatorName] = {
    'type': locatorType,
    'locator': locatorString
  };
  fs.writeFile(suitePath+'/locator/'+viewName+'.json', JSON.toString(viewJson), function (err) {
    if (err) throw err;
    console.log('Saved ' + viewName + '.json');
    res.json({
      'uiMsg': 'Added Locator ' + locatorName,
      'uiView': 'viewEdit',
      'viewName': viewName,
      'viewJSON': viewJson
    });
  });

});

app.get('/view/:name/:locator/delete', function (req, res) {
  var viewName = req.params.name;
  var locatorName = req.params.locator;
  var view = require(suitePath+'/locator/'+viewName+'.json');
  res.json({
    'uiMsg': 'Deleted Locator ' + locatorName,
    'uiView': 'viewEdit',
    'viewName': viewName,
    'viewJSON': view
  });
});

app.all('/view/:name/:locator/test', function (req, res) {
  var viewName = req.params.name;
  var locatorName = req.params.locator;
  var locatorJson = {};
  if (req.body && req.body.type) {
    locatorJson = {
      'type': req.body.type,
      'locator': req.body.string
    }
  } else {
    locatorJson = require(suitePath+'/locator/'+viewName+'.json')[locatorName];
  }

  var viewJson = {};
  viewJson[locatorName] = locatorJson;
  tmpView = nemoRemote.nemo.view.addView({'name': 'tmpView', 'locator': viewJson}, false);
  tmpView[locatorName]().getOuterHtml().then(function(outerHtml) {
    res.json({
      'uiView': 'locatorTest',
      'viewName': viewName,
      'html': outerHtml
    });
  }, function(err) {
    console.log('err from webdriver', err);
    res.json({
      'uiView': 'error',
      'uiMsg': 'error message:'  + err.message
    })
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

function getViews(cb) {
  glob(suitePath + "/locator/*", function (er, files) {
    files.forEach(function(file, index, arr) {
      arr[index] = file.split(suitePath + "/locator/")[1].split(".json")[0];
    });
    console.log('views are', files);
    cb(files);
  });
}
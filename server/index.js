var express = require('express');
var app = express();
var path = require('path');
var nemoRemote = require(path.resolve(__dirname, '../nemo-remote'));
var util = require(path.resolve(__dirname, '../util'));
var fs = require('fs');
var tmpView = null;
var suitePath = null;
var walkers = null;
var currentWalker = null;

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
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.get('/', function (req, res) {
  res.send('Hello World!')
});
app.get('/views', function (req, res) {
  console.log('locator path', suitePath + "/locator/*");
  //read JSON files in directory
  util.getViews(suitePath, function (files) {
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
  fs.writeFile(suitePath + '/locator/' + viewName + '.json', '{}', function (err) {
    if (err) {
      res.json({
        'uiView': 'error',
        'uiMsg': 'error message:' + err.message
      });
      return;
    }
    console.log('Saved ' + viewName + '.json');
    util.syncNemoConfig(suitePath, function (err, ok) {
      if (err) {
        res.json({
          'uiView': 'error',
          'uiMsg': 'error message:' + err.message
        });
        return;
      }
      res.json({
        'uiView': 'viewEdit',
        'uiMsg': 'Added View ' + viewName,
        'viewName': viewName
      });
    });
  });

});

app.get('/view/:name', function (req, res) {
  var viewName = req.params.name;
  var view = require(suitePath + '/locator/' + viewName + '.json');
  res.json({
    'uiView': 'viewEdit',
    'viewName': viewName,
    'viewJSON': view
  });
});


app.get('/view/:name/delete', function (req, res) {
  var viewName = req.params.name;
  fs.unlink(suitePath + '/locator/' + viewName + '.json', function (err) {
    if (err) {
      res.json({
        'uiView': 'error',
        'uiMsg': 'error message:' + err.message
      });
      return;
    }
    util.getViews(suitePath, function (files) {
      util.syncNemoConfig(suitePath, function (err, ok) {
        if (err) {
          res.json({
            'uiView': 'error',
            'uiMsg': 'error message:' + err.message
          });
          return;
        }
        res.json({
          'uiMsg': 'Deleted View ' + viewName,
          'uiView': 'viewList',
          'views': files
        });
      });

    });
  });
});

app.get('/view/:name/:locator/edit', function (req, res) {
  var viewName = req.params.name;
  var locatorName = req.params.locator;
  var locatorJson = require(suitePath + '/locator/' + viewName + '.json')[locatorName];
  var viewJson = {};
  viewJson[locatorName] = locatorJson;

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
  var viewJson = require(suitePath + '/locator/' + viewName + '.json');
  viewJson[locatorName] = {
    'type': locatorType,
    'locator': locatorString
  };
  fs.writeFile(suitePath + '/locator/' + viewName + '.json', JSON.stringify(viewJson, null, 2), function (err) {
    if (err) {
      res.json({
        'uiView': 'error',
        'uiMsg': 'error message:' + err.message
      });
      return;
    }
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
  var viewJson = require(suitePath + '/locator/' + viewName + '.json');
  viewJson[locatorName] = {
    'type': locatorType,
    'locator': locatorString
  };
  fs.writeFile(suitePath + '/locator/' + viewName + '.json', JSON.stringify(viewJson, null, 2), function (err) {
    if (err) {
      res.json({
        'uiView': 'error',
        'uiMsg': 'error message:' + err.message
      });
      return;
    }
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
  var view = require(suitePath + '/locator/' + viewName + '.json');
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
    locatorJson = require(suitePath + '/locator/' + viewName + '.json')[locatorName];
  }

  var viewJson = {};
  viewJson[locatorName] = locatorJson;
  tmpView = nemoRemote.nemo.view.addView({'name': 'tmpView', 'locator': viewJson}, false);
  tmpView[locatorName]().getOuterHtml().then(function (outerHtml) {
    res.json({
      'uiView': 'locatorTest',
      'viewName': viewName,
      'html': outerHtml
    });
  }, function (err) {
    console.log('err from webdriver', err);
    res.json({
      'uiView': 'error',
      'uiMsg': 'error message:' + err.message
    })
  });
});
app.get('/walk/step', function (req, res) {
  console.log('/walk/step');
  if (walkers === null) {
    //create the array of WebElements
    nemoRemote.injectWalkerStyle().then(function () {
      return nemoRemote.nemo.drivex.finds({
        'type': 'css',
        'locator': 'input[type=text], input[type=password], input[type=button], select, a'
      });
    }).
      then(function (_allwalkers) {
        console.log('_allwalkers', _allwalkers.length);
        //filter out non visible elements
        nemoRemote.nemo.wd.promise.filter(_allwalkers, function (_current) {
          return _current.isDisplayed();
        }).then(function (_viswalkers) {
          console.log('_viswalkers', _viswalkers.length);
          walkers = _viswalkers;
          setWalker().
            then(function () {
              return getWalkerProps();
            }).
            then(function (walkerProps) {
              var walkerLocator = buildWalkerLocator(walkerProps);
              res.json({
                'uiView': 'locatorWalk',
                'locator': walkerLocator.locator,
                'type': walkerLocator.type,
                'html': walkerProps.outerHtml
              });
            });
        });
        //walkers = _walkers;
        // setWalker();
      });
  } else {
    setWalker().
      then(function () {
        return getWalkerProps();
      }).
      then(function (walkerProps) {
        var walkerLocator = buildWalkerLocator(walkerProps);
        res.json({
          'uiView': 'locatorWalk',
          'locator': walkerLocator.locator,
          'type': walkerLocator.type,
          'html': walkerProps.outerHtml
        });
      });
  }
  function setWalker() {
    currentWalker = walkers.shift();
    walkers.push(currentWalker);
    console.log('currentWalker', currentWalker);
    return nemoRemote.nemo.driver.executeScript(function () {
      if (document.querySelector('.__nemo__walker__')) {
        document.querySelector('.__nemo__walker__').className = document.querySelector('.__nemo__walker__').className.replace('__nemo__walker__', '');
      }
      arguments[0].className += ' __nemo__walker__';
    }, currentWalker);
  }

  function getWalkerProps() {
    var tagName = null;
    var id = null;
    var className = null;
    var name = null;
    var outerHtml = null;
    return currentWalker.getTagName().
      then(function (_tagName) {
        tagName = _tagName;
        return currentWalker.getAttribute('id');
      }).then(function (_id) {
        id = _id;
        return currentWalker.getOuterHtml();
      }).then(function (_outerHtml) {
        outerHtml = _outerHtml;
        return currentWalker.getAttribute('class');
      }).then(function (_className) {
        className = _className;
        return currentWalker.getAttribute('name');
      }).then(function (_name) {
        name = _name;
        return {
          'tagName': tagName,
          'id': id,
          'className': className,
          'name': name,
          'outerHtml': outerHtml
        };
      });
  }

  function buildWalkerLocator(walkerProps) {
    var walkerLocator = {'type': null, 'locator': null};
    if (walkerProps.id !== null) {
      walkerLocator.type = 'css';
      walkerLocator.locator = '#' + walkerProps.id;
    } else if (walkerProps.tagName !== null && walkerProps.name !== null) {
      walkerLocator.type = 'css';
      walkerLocator.locator = walkerProps.tagName + '[name=' + walkerProps.name + ']';
    }
    return walkerLocator;
  }


});
app.get('/walk/stop', function (req, res) {

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
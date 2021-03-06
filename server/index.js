var express = require('express');
var app = express();
var path = require('path');
var nemoRemote = require(path.resolve(__dirname, '../nemo-remote'));
var util = require(path.resolve(__dirname, '../util'));
var fs = require('fs');
var tmpView = null;
var suitePath = null;
var flashMessage = null;
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

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  console.log('handling request', req.path, req.body);
  return next();
});
app.get('/', function (req, res) {
  res.send('Hello World!')
});
app.get('/views', removeWalkStyle, function (req, res) {
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
    'mode': {'new': true}
  });
});

app.post('/views/new', function (req, res) {
  //new view
  //get view name off of request
  var viewName = req.body.name;
  //save new JSON file
  fs.writeFile(suitePath + '/locator/' + viewName + '.json', '{}', function (err) {
    if (err) {
      errorResponse(err, res);
      return;
    }
    console.log('Saved ' + viewName + '.json');

      res.json({
        'uiView': 'viewEdit',
        'uiMsg': {type: 'info', message: 'Added View ' + viewName},
        'viewName': viewName
      });

  });

});

app.get('/view/:name', removeWalkStyle, function (req, res) {
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
      errorResponse(err, res);
      return;
    }
    util.getViews(suitePath, function (files) {

        res.json({
          'uiMsg': {type: 'info', message: 'Deleted View ' + viewName},
          'uiView': 'viewList',
          'views': files
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
  util.getViews(suitePath, function (views) {
    res.json({
      'uiView': 'locatorEdit',
      'viewName': viewName,
      'locatorName': locatorName,
      'locatorJson': locatorJson,
      'locatorType': locatorJson.type,
      'locatorString': locatorJson.locator,
      'views': views
    });
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
      errorResponse(err, res);
      return;
    }
    console.log('Saved ' + viewName + '.json');
    res.json({
      'uiView': 'viewEdit',
      'viewName': viewName,
      'uiMsg': {type: 'info', message: 'Saved Locator ' + locatorName},
      'viewJSON': viewJson
    });
  });

});
app.get('/view/:name/locator/new', function (req, res) {
  var viewName = req.params.name;
  util.getViews(suitePath, function (views) {
    res.json({
      'uiView': 'locatorEdit',
      'mode': {'new': true},
      'viewName': viewName,
      'views': views
    });
  });
});

app.post('/view/:name/locator/new', function (req, res) {
  var viewName = req.params.name;
  var locatorName = req.body.name;
  var locatorType = req.body.type;
  var walking = (req.body.walk) ? true : false;
  var locatorString = req.body.string;
  var viewJson = require(suitePath + '/locator/' + viewName + '.json');
  viewJson[locatorName] = {
    'type': locatorType,
    'locator': locatorString
  };
  fs.writeFile(suitePath + '/locator/' + viewName + '.json', JSON.stringify(viewJson, null, 2), function (err) {
    if (err) {
      errorResponse(err, res);
      return;
    }
    console.log('Saved ' + viewName + '.json');
    if (walking === false) {
      res.json({
        'uiMsg': {type: 'info', message: 'Added Locator ' + locatorName},
        'uiView': 'viewEdit',
        'viewName': viewName,
        'viewJSON': viewJson
      });
    } else {
      //remove the one we just added
      flashMessage = 'Added Locator ' + locatorName;
      walkers.pop();
      if (walkers.length && walkers.length > 0) {
        res.redirect('/walk/step');
      }
      else {
        flashMessage = 'Added Locator ' + locatorName + ' and finished walking';
        res.redirect('/walk/stop');
      }
    }

  });

});

app.get('/view/:name/:locator/delete', function (req, res) {
  var viewName = req.params.name;
  var locatorName = req.params.locator;
  var viewJson = require(suitePath + '/locator/' + viewName + '.json');
  if (viewJson[locatorName]) {
    delete viewJson[locatorName];
  }
  fs.writeFile(suitePath + '/locator/' + viewName + '.json', JSON.stringify(viewJson, null, 2), function (err) {
    if (err) {
      errorResponse(err, res);
      return;
    }
    res.json({
      'uiMsg': {type: 'info', message: 'Deleted Locator ' + locatorName},
      'uiView': 'viewEdit',
      'viewName': viewName,
      'viewJSON': viewJson
    });
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
  tmpView = nemoRemote.nemo.view.addView(viewJson, ['tmpView'], false);
  tmpView[locatorName]().getOuterHtml().then(function (outerHtml) {
    res.json({
      'uiView': 'locatorTest',
      'viewName': viewName,
      'html': outerHtml
    });
  }, function (err) {
    console.log('err from webdriver', err);
    errorResponse(err, res);
  });
});
app.get('/walk/step', function (req, res) {
  var _flashMessage = null;
  if (flashMessage !== null) {
    _flashMessage = flashMessage;
    flashMessage = null;
  }
  console.log('/walk/step');
  if (walkers === null) {
    //create the array of WebElements
    nemoRemote.injectWalkerStyle().then(function () {
      return nemoRemote.nemo.view._finds({
        'type': 'css',
        'locator': 'input[type=text], input[type=password], input[type=button], select, a'
      });
    }).
      then(function (_allwalkers) {
        //filter out non visible elements
        nemoRemote.nemo.wd.promise.filter(_allwalkers, function (_current) {
          return _current.isDisplayed();
        }).then(function (_viswalkers) {
          walkers = _viswalkers;
          setWalker();
        });
      }, function(err) {
        errorResponse(err, res);
      });
  } else {
    setWalker();
  }
  function setWalker() {
    currentWalker = walkers.shift();
    walkers.push(currentWalker);
    return nemoRemote.nemo.driver.executeScript(function () {
      if (document.querySelector('.__nemo__walker__')) {
        document.querySelector('.__nemo__walker__').className = document.querySelector('.__nemo__walker__').className.replace('__nemo__walker__', '');
      }
      arguments[0].className += ' __nemo__walker__';
    }, currentWalker).then(function () {
      return getWalkerProps();
    }).
      then(function (walkerProps) {
        var walkerLocator = buildWalkerLocator(walkerProps);
        var jsonResponse = {
          'uiView': 'locatorWalk',
          'locator': walkerLocator.locator,
          'type': walkerLocator.type,
          'html': walkerProps.outerHtml
        };
        if (_flashMessage !== null) {
          jsonResponse.uiMsg = {type: 'info', message: _flashMessage};
        }
        res.json(jsonResponse);
      }, function(err) {
        errorResponse(err, res);
      });
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
      }, function(err) {
        errorResponse(err, res);
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
app.get('/walk/stop', removeWalkStyle, function (req, res) {
  var message = flashMessage || 'Walk canceled';
  flashMessage = null;
  res.json({
    'uiView': 'stopWalk',
    'uiMsg': {
      type: 'info',
      message: message
    }
  })

});


app.get('/reinject', function (req, res) {
  nemoRemote.reinjectUI().then(function () {
    res.send('OK');
  });
});

function errorResponse(err, res) {
  res.json({
    'uiView': 'message',
    'uiMsg': {type: 'error', message: 'error message:' + err.message}
  });
}

function removeWalkStyle(req, res, next) {
  walkers = null;
  nemoRemote.nemo.driver.executeScript(function () {
    if (document.querySelector('.__nemo__walker__')) {
      document.querySelector('.__nemo__walker__').className = document.querySelector('.__nemo__walker__').className.replace('__nemo__walker__', '');
    }
  }).then(function () {
    next();
  }, function (err) {
    errorResponse(err, res);
    return;
  })
}
module.exports = function (_suitePath) {
  suitePath = path.resolve(process.cwd(), _suitePath);
  var server = app.listen(2330, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Server app listening at http://%s:%s', host, port);

  });
};
(function () {
  var baseurl = document.getElementById("nemo-ui-script").getAttribute("data-baseurl");
  var views = {};
  views.home = function () {
    return '<h3>Nemo UI</h3>' +
      '<ul>' +
      '<li><a href="' + baseurl + '/views">View list (load existing view, create new view)</a></li>' +
      '<li>View edit (add locator, delete locator, test locator)</li>' +
      '<li>New view (name field)</li>' +
      '<li>New locator (locator field)</li>' +
      '</ul>';
  };
  views.viewList = function (json) {
    var views = json.views;
    var markup = '<h3>Views</h3>' +
      getUIMessage(json) +
      '<table>' +
      '<tr>' +
      '<th>Name</th>' +
      '<th>Actions</th>' +
      '</tr>';
    views.forEach(function (view) {
      markup += '<tr><td>'+view+'</td><td><a href="' + baseurl + '/view/' + view + '">Edit</a> | <a href="' + baseurl + '/view/' + view + '/delete">Delete</a></td></tr>';
    });
    markup += '</table>' +
      '<p><input type="button" value="New View" data-method="get" id="nemoUI_newView"/></p>'

    return markup;

  };

  views.viewEdit = function (json) {
    var viewName = json.viewName || '';
    var viewJSON = json.viewJSON || {};
    var markup = '';
    if (json.mode && json.mode === 'new') {
      markup += '<h3><a href="' + baseurl + '/views">Views</a> > <input type="text" value="" id="nemoUI_newName"/></h3>';
    } else {
      markup += '<h3><a href="' + baseurl + '/views">Views</a> > ' + viewName + '</h3>';
    }

    markup += getUIMessage(json) +
      '<table>' +
      '<tr>' +
      '<th>Name</th>' +
      '<th>Type</th>' +
      '<th>Locator</th>' +
      '<th>Actions</th>' +
      '</tr>';
    Object.keys(viewJSON).forEach(function (key) {
      markup += '<tr>' +
      '<td>' + key + '</td>' +
      '<td>' + viewJSON[key].type + '</td>' +
      '<td>' + viewJSON[key].locator + '</td>' +
      '<td><a  href="' + baseurl + '/view/' + viewName + '/' + key + '/edit">Edit</a> | <a href="' + baseurl + '/view/' + viewName + '/' + key + '/delete">Delete</a>| <a href="' + baseurl + '/view/' + viewName + '/' + key + '/test">Test</a></td>' +
      '</tr>';
    });
    markup += '</table>';
    if (json.mode && json.mode === 'new') {
      markup += '<input type="button" value="Save" id="nemoUI_saveNewView"/>';
    } else {
      markup += '<p><input type="button" data-viewname="'+ viewName +'" data-method="GET" value="New Locator" id="nemoUI_locatorNew"/></p>';
    }
    return markup;
  };

  views.locatorEdit = function (json) {
    var locatorString = json.locatorString || '';
    var locatorType = json.locatorType || '';
    var locatorName = json.locatorName || '';
    var markup = '';
    if (json.mode && json.mode === 'new') {
      markup += '<h3><a href="' + baseurl + '/views">Views</a> > <a href="' + baseurl + '/view/' + json.viewName + '">' + json.viewName + '</a> > <input type="text" value="" id="nemoUI_newName"/></h3>';
    } else {
      markup += '<h3><a href="' + baseurl + '/views">Views</a> > <a href="' + baseurl + '/view/' + json.viewName + '">' + json.viewName + '</a> > ' + locatorName + '</h3>';
    }

     markup += '<p>Type: <input type="text" value="' + locatorType + '" id="nemoUI_locatorType"/></p>' +
      '<p>Locator: <input type="text" value="' + locatorString + '" id="nemoUI_locatorString"/></p>' +
      '<p><input type="button" value="Test" id="nemoUI_locatorTest"/><input data-viewname="' + json.viewName + '" data-locatorname="' + locatorName + '" type="button" value="Save" id="nemoUI_locatorSave"/></p>';

    return markup;
  };
  views.noViewProvided = function (json) {
    var markup = '<h3>No View Provided</h3>' +
      '<pre>' + json + '</pre>';

    return markup;
  };
  views.locatorTest = {
    'render': function(json) {
      //add a pre tag in nemoUI
      var prepre = document.querySelector("#nemoUI pre");
      if (prepre && prepre.remove) {
         prepre.remove();
      }
      var pre = document.createElement("pre");
      pre.innerText = json.html;//.replace(/</g, "%lt;");
      document.querySelector("#nemoUI").appendChild(pre);
    }
  };
  views.error = {
    'render': function(json) {
      var errorbox = document.querySelector("#nemoUI .error");
      if (errorbox && errorbox.remove) {
        errorbox.remove();
      }
      errorbox = document.createElement("p");
      errorbox.setAttribute("class", "error");
      errorbox.innerText = json.uiMsg;
      document.querySelector("#nemoUI").insertBefore(errorbox, document.querySelector("#nemoUI h3").nextSibling);
    },
    'teardown': function() {
      var errorbox = document.querySelector("#nemoUI .error");
      if (errorbox && errorbox.remove) {
        errorbox.remove();
      }
    }
  };
  function getUIMessage(json) {
    if (json.uiMsg) {
      return '<div class="uimsg">' + json.uiMsg + '</div>'
    }
    return '';
  }

  //add the remote div
  var div = document.createElement("div");

  div.setAttribute("id", "nemoUI");
  div.innerHTML = views.home();
  //'<textarea rows="4" cols="40"></textarea>';
  document.querySelector("body").appendChild(div);
  document.querySelector("#nemoUI").addEventListener("click", function (e) {
    if (e.srcElement.tagName === 'A') {
      e.preventDefault();
      handleLink(e);
    } else if (e.srcElement.tagName === 'INPUT') {
      handleButton(e);
    }
  });
  handleLink({'srcElement': {'href': baseurl + '/views'}})
  function handleLink(e) {
    var url = e.srcElement.href;
    xhr({
      'method': 'GET',
      'url': url,
      'load': xhrLoad
    });
  }

  function handleButton(e) {
    var data = null;
    var buttonId = e.srcElement.getAttribute('id');
    var method = e.srcElement.getAttribute('data-method') || 'POST';
    var url = baseurl;
    if (buttonId === 'nemoUI_newView') {
      url += '/views/new';
    }
    else if (buttonId === 'nemoUI_locatorNew') {
      url += '/view/' + e.srcElement.getAttribute('data-viewname') + '/locator/new';
    }
    else if (buttonId === 'nemoUI_saveNewView') {
      url += '/views/new';
      method = 'POST';
      data = 'name=' + document.querySelector('#nemoUI_newName').value;
    }
    else if (buttonId === 'nemoUI_locatorSave') {
      var locatorName = e.srcElement.getAttribute('data-locatorname');
      var viewName = e.srcElement.getAttribute('data-viewname');
      var type = document.querySelector('#nemoUI_locatorType').value;
      var string = document.querySelector('#nemoUI_locatorString').value;

      if (locatorName === '') {
        //new locator
        var name = document.querySelector('#nemoUI_newName').value;
        url += '/view/' + viewName + '/locator/new';
        data = 'name=' + name + '&type=' + type + '&string=' + string;
      } else {
        //existing locator
        url += '/view/' + viewName + '/' + locatorName + '/edit';
        data = 'type=' + type + '&string=' + string;
      }

      method = 'POST';

    }
    else if (buttonId === 'nemoUI_locatorTest') {
      var type = document.querySelector('#nemoUI_locatorType').value;
      var string = document.querySelector('#nemoUI_locatorString').value;
      var viewName = e.srcElement.getAttribute('data-viewname') || 'foo';
      url += '/view/' + viewName + '/bar/test';
      data = 'type=' + type + '&string=' + string;
    } else {
      return; //don't submit
    }
    xhr({
      'method': method,
      'url': url,
      'load': xhrLoad,
      'data': data
    });
  }

  function xhr(config) {
    //kill any error messages
    views.error.teardown();
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("progress", config.progress || xhrProgress, false);
    oReq.addEventListener("load", config.load || xhrLoad, false);
    oReq.addEventListener("error", config.error || xhrError, false);
    oReq.addEventListener("abort", config.abort || xhrAbort, false);
    oReq.open(config.method || "get", config.url, true);
    if (config.data && config.data !== null) {
      oReq.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    }
    oReq.send(config.data);
  }

  function xhrProgress(e) {
    console.log('xhrProgress', e);
  }

  function xhrLoad() {
    var json = JSON.parse(this.responseText);
    var uiView = json.uiView;
    //write out list of views
    if (uiView === undefined) {
      console.log('uiView is undefined');
    } else {
      if (views[uiView].constructor === Function) {
        div.innerHTML = views[uiView](json);
      } else {
        views[uiView].render(json);
      }

    }
    console.log('xhr response', json);
  }

  function xhrError(e) {
    console.log('xhrError', e);
  }

  function xhrAbort(e) {
    console.log('xhrAbort', e);
  }
})();
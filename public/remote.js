(function() {
  var baseurl = document.getElementById("nemo-ui-script").getAttribute("data-baseurl");
  var views = {};
  views.home = function() {
    return '<h3>Nemo UI</h3>' +
      '<ul>' +
      '<li><a data-view="list" href="' + baseurl + '/views">View list (load existing view, create new view)</a></li>' +
      '<li>View edit (add locator, delete locator, test locator)</li>' +
      '<li>New view (name field)</li>' +
      '<li>New locator (locator field)</li>' +
      '</ul>';
  };
  views.list = function(json) {
    var views = json.views;
    var markup = '<h3>Views</h3>' +
      '<ul>';
    views.forEach(function(view) {
      markup += '<li><a data-view="view" href="' + baseurl + '/view/' + view + '">' + view + '</a></li>';
    });
    markup += '</ul>';
    return markup;

  };

  views.view = function(json) {
    var viewName = json.viewName;
    var viewJSON = json.viewJSON;
    var markup = '<h3>View: ' + viewName + '</h3>' +
        getUIMessage(json) +
    '<table>' +
        '<tr>' +
        '<th>Name</th>' +
        '<th>Type</th>' +
      '<th>Locator</th>' +
      '<th>Actions</th>' +
        '</tr>';
    Object.keys(viewJSON).forEach(function(key) {
      markup += '<tr>' +
        '<td>' + key + '</td>' +
        '<td>' + viewJSON[key].type + '</td>' +
        '<td>' + viewJSON[key].locator + '</td>' +
        '<td><a data-view="locator" href="' + baseurl + '/view/' + viewName + '/' + key + '/edit">Edit</a> | <a data-view="view" href="' + baseurl + '/view/' + viewName + '/' + key + '/delete">Delete</a></td>' +
        '</tr>';
    });
    markup += '</table>';
    return markup;
  };

  views.locator = function(json) {
    var markup = '<h3>Locator</h3>';

    return markup;
  };

  function getUIMessage(json) {
    if (json.uimsg) {
      return '<div class="uimsg">' + json.uimsg + '</div>'
    }
    return '';
  }
  //add the remote div
  var div = document.createElement("div");

  div.setAttribute("id", "nemoUI");
  div.innerHTML = views.home();
  //'<textarea rows="4" cols="40"></textarea>';
  document.querySelector("body").appendChild(div);
  document.querySelector("#nemoUI").addEventListener("click", function(e) {
    if (e.srcElement.tagName !== 'A') {
      return;
    }
    e.preventDefault();
    var url = e.srcElement.href;
    var view = e.srcElement.getAttribute('data-view');
    xhr({
      'method': 'GET',
      'url': url,
      'load': function() {
        //write out list of views
        div.innerHTML = views[view](JSON.parse(this.responseText));
      }
    });
  });

  function xhr(config) {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("progress", config.progress || xhrProgress, false);
    oReq.addEventListener("load", config.load || xhrLoad, false);
    oReq.addEventListener("error", config.error || xhrError, false);
    oReq.addEventListener("abort", config.abort || xhrAbort, false);

    oReq.open(config.method || "get", config.url, true);
    oReq.send();
  }

  function xhrProgress(e) {
    console.log('xhrProgress', e);
  }

  function xhrLoad(e) {
    console.log('xhrComplete', e);
    console.log(this.responseText);
  }

  function xhrError(e) {
    console.log('xhrError', e);
  }

  function xhrAbort(e) {
    console.log('xhrAbort', e);
  }
})();
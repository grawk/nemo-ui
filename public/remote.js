(function () {
  var baseurl = document.getElementById("nemo-ui-script").getAttribute("data-baseurl");
  var views = __nemoTemplates(baseurl);

  //add the remote div
  var div = document.createElement("div");

  div.setAttribute("id", "nemoUI");
  div.innerHTML = views.home();
  //'<textarea rows="4" cols="40"></textarea>';
  document.querySelector("body").appendChild(div);
  console.log('window.frames', window.frames);
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
    if (buttonId === 'moveMe') {
      //going to try moving iframe around
    } else if (buttonId === 'nemoUI_newView') {
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
      var walking = e.srcElement.getAttribute('data-walk');
      var type = document.querySelector('#nemoUI_locatorType').value;
      var string = document.querySelector('#nemoUI_locatorString').value;

      if (locatorName === '') {
        //new locator
        var name = document.querySelector('#nemoUI_newName').value;
        url += '/view/' + viewName + '/locator/new';
        data = 'name=' + name + '&type=' + type + '&string=' + string;
        if (walking === 'true') {
          data += '&walk=true';
        }
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
    }
    else if (buttonId === 'nemoUI_walk') {
      url += '/walk/step';
      method = 'GET';
    } else if (buttonId === 'nemoUI_cancelWalk') {
      url += '/walk/stop';
      method = 'GET';
    } else {
      return; //don't submit
    }


    xhr({
      'method': method || 'POST',
      'url': url,
      'load': xhrLoad,
      'data': data
    });
  }

  function xhr(config) {
    //kill any messages
    views.message.teardown();
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("progress", config.progress || xhrProgress, false);
    oReq.addEventListener("load", config.load || xhrLoad, false);
    oReq.addEventListener("error", config.error || xhrError, false);
    oReq.addEventListener("abort", config.abort || xhrAbort, false);
    oReq.open(config.method || "get", config.url, true);
    if (config.data && config.data !== null) {
      oReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
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
      if (uiView !== 'message' && json.uiMsg) {
        views['message'].render(json);
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
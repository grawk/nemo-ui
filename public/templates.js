var __nemoTemplates = function(baseurl) {

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
      '<table>' +
      '<tr>' +
      '<th>Name</th>' +
      '<th>Actions</th>' +
      '</tr>';
    views.forEach(function (view) {
      markup += '<tr><td>' + view + '</td><td><a href="' + baseurl + '/view/' + view + '">Edit</a> | <a href="' + baseurl + '/view/' + view + '/delete">Delete</a></td></tr>';
    });
    markup += '</table>' +
    '<p><input type="button" value="New View" data-method="get" id="nemoUI_newView"/></p>'

    return markup;

  };

  views.viewEdit = function (json) {
    var viewName = json.viewName || '';
    var viewJSON = json.viewJSON || {};
    var markup = '';
    if (json.mode && json.mode.new) {
      markup += '<h3><a href="' + baseurl + '/views">Views</a> > <input type="text" value="" id="nemoUI_newName"/></h3>';
    } else {
      markup += '<h3><a href="' + baseurl + '/views">Views</a> > ' + viewName + '</h3>';
    }

    markup += '<table>' +
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
    if (json.mode && json.mode.new) {
      markup += '<input type="button" value="Save" id="nemoUI_saveNewView"/>';
    } else {
      markup += '<p><input type="button" data-viewname="' + viewName + '" data-method="GET" value="New Locator" id="nemoUI_locatorNew"/></p>';
    }
    return markup;
  };
  views.viewSelect = {
    'render': function(json) {
      var markup = '';
      if (json.mode && json.mode.new) {
        markup += '<select id="nemoUI_viewSelect">';
        json.views.forEach(function(view) {
          var selected = (json.viewName === view) ? 'selected' : '';
          markup += '<option value="' + view + '" ' + selected + '>' + view + '</option>';
        });
        markup += '</select>';
        return markup;
      } else {
        return '<a href="' + baseurl + '/view/' + json.viewName + '">' + json.viewName + '</a>';
      }

    }
  };
  views.locatorEdit = function (json) {
    var locatorString = json.locatorString || '';
    var locatorType = json.locatorType || '';
    var locatorName = json.locatorName || '';
    var markup = '';
    if (json.mode && json.mode.new) {
      markup += '<h3><a href="' + baseurl + '/views">Views</a> > ' + views.viewSelect.render(json) + ' > <input type="text" value="" id="nemoUI_newName"/></h3>';
    } else {
      markup += '<h3><a href="' + baseurl + '/views">Views</a> > ' + views.viewSelect.render(json) + ' > ' + locatorName + '</h3>';
    }

    markup += '<p>Type: <input type="text" value="' + locatorType + '" id="nemoUI_locatorType"/></p>' +
    '<p>Locator: <input type="text" value="' + locatorString + '" id="nemoUI_locatorString"/></p>' +
    '<p><input type="button" value="Test" id="nemoUI_locatorTest"/><input data-walk="false" data-viewname="' + json.viewName + '" data-locatorname="' + locatorName + '" type="button" value="Save" id="nemoUI_locatorSave"/>';

    markup += '<input type="button" value="Walk" id="nemoUI_walk"/><input type="button" value="Cancel Walk" style="display:none" id="nemoUI_cancelWalk"/></p>';

    return markup;
  };
  views.noViewProvided = function (json) {
    var markup = '<h3>No View Provided</h3>' +
      '<pre>' + json + '</pre>';

    return markup;
  };
  views.locatorTest = {
    'render': function (json) {
      //add a pre tag in nemoUI
      views.pre.render(json.html);
    }
  };
  views.locatorWalk = {
    'render': function (json) {
      //add a pre tag in nemoUI
      views.pre.render(json.html);
      document.querySelector('#nemoUI_newName').value = '';
      document.querySelector('#nemoUI_locatorType').value = json.type;
      document.querySelector('#nemoUI_locatorString').value = json.locator;
      document.querySelector('#nemoUI_locatorSave').setAttribute('data-walk', true);
      document.querySelector('#nemoUI_cancelWalk').setAttribute('style', 'display:default');
    }
  };
  views.stopWalk = {
    'render': function (json) {
      //add a pre tag in nemoUI
      views.pre.teardown();
      document.querySelector('#nemoUI_locatorType').value = '';
      document.querySelector('#nemoUI_locatorString').value = '';
      document.querySelector('#nemoUI_locatorSave').setAttribute('data-walk', false);
      document.querySelector('#nemoUI_cancelWalk').setAttribute('style', 'display:none');
    }
  };
  views.pre = {
    'render': function(html) {
      var prepre = document.querySelector("#nemoUI pre");
      if (prepre && prepre.remove) {
        prepre.remove();
      }
      var pre = document.createElement("pre");
      pre.innerText = html;//.replace(/</g, "%lt;");
      document.querySelector("#nemoUI").appendChild(pre);
    },
    'teardown': function() {
      var prepre = document.querySelector("#nemoUI pre");
      if (prepre && prepre.remove) {
        prepre.remove();
      }
    }
  }
  views.message = {
    'render': function (json) {
      var errorbox = document.querySelector("#nemoUI .messagebox");
      if (errorbox && errorbox.remove) {
        errorbox.remove();
      }
      errorbox = document.createElement("p");
      errorbox.setAttribute("class", json.uiMsg.type + ' messagebox');
      errorbox.innerText = json.uiMsg.message;
      document.querySelector("#nemoUI").insertBefore(errorbox, document.querySelector("#nemoUI h3").nextSibling);
    },
    'teardown': function () {
      var errorbox = document.querySelector("#nemoUI .messagebox");
      if (errorbox && errorbox.remove) {
        errorbox.remove();
      }
    }
  };
  return views;
};
function createActionButton (title, callback, appendTo) {
  appendTo = appendTo || 'buttons';
  var buttons = document.getElementById(appendTo);
  var paragraph = document.createElement('p');
  var button = document.createElement('button');
  button.textContent = title;
  button.onclick = function (e) {
      e.preventDefault();
      callback();
  };
  paragraph.appendChild(button);
  buttons.appendChild(paragraph);
}

document.addEventListener('deviceready', function () {
  'use strict';

  var contentEl = document.getElementById('content');

  cordova.require('nodejs-mobile-cordova-tests.tests').defineManualTests(contentEl, createActionButton); // eslint-disable-line no-undef

});


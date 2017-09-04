// Bridge between the Cordova UI and the NodeJS plugin

class Channel {};

Channel.prototype.setListener = function (callback) {
  cordova.exec(callback, callback, 'NodeJS', 'setChannelListener', null);
};

Channel.prototype.send = function (msg) {
  cordova.exec(null, null, 'NodeJS', 'sendMessageToNode', [msg]);
};

const channel = new Channel();

function start(filename, callback) {
  cordova.exec(
    function(arg) {
      if (callback) {
        callback(null);
      }
    },
    function(err) {
      if (callback) {
        callback(err);
      }
    },
    'NodeJS',
    'startEngine',
    [filename]
  );
};

function startWithScript(script, callback) {
  cordova.exec(
    function(arg) {
      if (callback) {
        callback(null);
      }
    },
    function(err) {
      if (callback) {
        callback(err);
      }
    },
   'NodeJS',
   'startEngineWithScript',
   [script]
  );
};

module.exports = exports = {
  start,
  startWithScript,
  channel
};
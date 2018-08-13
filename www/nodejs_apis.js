// Bridge between the Cordova UI and the Node.js Mobile plug-in

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventEmitter = require('./nodejs_events');

var EVENT_CHANNEL = '_EVENTS_';

var channels = {};

/*
 * This classes is defined in cordova-bridge/index.js as well.
 * Any change made here should be ported to cordova-bridge/index.js too.
 * The MessageCodec class provides two static methods to serialize/deserialize
 * the data sent through the events channel.
*/

var MessageCodec = function () {
  // This is a 'private' constructor, should only be used by this class
  // static methods.
  function MessageCodec(_event) {
    _classCallCheck(this, MessageCodec);

    this.event = _event;

    for (var _len = arguments.length, _payload = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      _payload[_key - 1] = arguments[_key];
    }

    this.payload = JSON.stringify(_payload);
  }

  _createClass(MessageCodec, null, [{
    key: 'serialize',


    // Serialize the message payload and the message.
    value: function serialize(event) {
      for (var _len2 = arguments.length, payload = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        payload[_key2 - 1] = arguments[_key2];
      }

      var envelope = new (Function.prototype.bind.apply(MessageCodec, [null].concat([event], payload)))();
      // Return the serialized message, that can be sent through a channel.
      return JSON.stringify(envelope);
    }
  }, {
    key: 'deserialize',


    // Deserialize the message and the message payload.
    value: function deserialize(message) {
      var envelope = JSON.parse(message);
      if (typeof envelope.payload !== 'undefined') {
        envelope.payload = JSON.parse(envelope.payload);
      }
      return envelope;
    }
  }]);

  return MessageCodec;
}();

;

/**
 * Channel super class.
 */

var ChannelSuper = function (_EventEmitter) {
  _inherits(ChannelSuper, _EventEmitter);

  function ChannelSuper(name) {
    _classCallCheck(this, ChannelSuper);

    var _this = _possibleConstructorReturn(this, (ChannelSuper.__proto__ || Object.getPrototypeOf(ChannelSuper)).call(this));

    _this.name = name;
    // Renaming the 'emit' method to 'emitLocal' is not strictly needed, but
    // it is useful to clarify that 'emitting' on this object has a local
    // scope: it emits the event on the Node side only, it doesn't send
    // the event to Cordova.
    _this.emitLocal = _this.emit;
    delete _this.emit;
    return _this;
  }

  return ChannelSuper;
}(EventEmitter);

;

/**
 * Events channel class that supports user defined event types with
 * optional arguments. Allows to send any serializable
 * JavaScript object supported by 'JSON.stringify()'.
 * Sending functions is not currently supported.
 * Includes the previously available 'send' method for 'message' events.
 */

var EventChannel = function (_ChannelSuper) {
  _inherits(EventChannel, _ChannelSuper);

  function EventChannel() {
    _classCallCheck(this, EventChannel);

    return _possibleConstructorReturn(this, (EventChannel.__proto__ || Object.getPrototypeOf(EventChannel)).apply(this, arguments));
  }

  _createClass(EventChannel, [{
    key: 'post',
    value: function post(event) {
      for (var _len3 = arguments.length, msg = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        msg[_key3 - 1] = arguments[_key3];
      }

      cordova.exec(null, null, 'NodeJS', 'sendMessageToNode', [this.name, MessageCodec.serialize.apply(MessageCodec, [event].concat(msg))]);
    }
  }, {
    key: 'send',


    // Posts a 'message' event, to be backward compatible with old code.
    value: function send() {
      for (var _len4 = arguments.length, msg = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        msg[_key4] = arguments[_key4];
      }

      this.post.apply(this, ['message'].concat(msg));
    }
  }, {
    key: 'setListener',


    // Sets a listener on the 'message' event, to be backward compatible with old code.
    value: function setListener(callback) {
      this.on('message', callback);
    }
  }, {
    key: 'processData',
    value: function processData(data) {
      // The data contains the serialized message envelope.
      var envelope = MessageCodec.deserialize(data);
      this.emitLocal.apply(this, [envelope.event].concat(_toConsumableArray(envelope.payload)));
    }
  }]);

  return EventChannel;
}(ChannelSuper);

;

/*
 * Dispatcher for all channels. This method is called by the plug-in
 * native code to deliver messages and events from Node.
 * The first argument is the channel name.
 * The second argument is the data.
 */
function allChannelsListener(args) {
  var channelName = args[0];
  var data = args[1];

  if (channels.hasOwnProperty(channelName)) {
    channels[channelName].processData(data);
  } else {
    console.error('Error: Channel not found:', channelName);
  }
};

// Register the listern for all channels
cordova.exec(allChannelsListener, allChannelsListener, 'NodeJS', 'setAllChannelsListener', null);

/**
 * Private methods.
 */
function registerChannel(channel) {
  channels[channel.name] = channel;
};

function startEngine(command, args, callback) {
  cordova.exec(function (arg) {
    if (callback) {
      callback(null);
    }
  }, function (err) {
    if (callback) {
      callback(err);
    }
  }, 'NodeJS', command, [].concat(args));
};

/**
 * Module exports.
 */
function start(filename, callback, options) {
  options = options || {};
  startEngine('startEngine', [filename, options], callback);
};

function startWithScript(script, callback, options) {
  options = options || {};
  startEngine('startEngineWithScript', [script, options], callback);
};

var eventChannel = new EventChannel(EVENT_CHANNEL);
registerChannel(eventChannel);

module.exports = exports = {
  start: start,
  startWithScript: startWithScript,
  channel: eventChannel
};
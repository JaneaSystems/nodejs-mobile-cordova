// Bridge between the Cordova UI and the Node.js Mobile plug-in

'use strict';

const EventEmitter = require('./nodejs_events');

const EVENT_CHANNEL = '_EVENTS_';

var channels = {};

/*
 * This classes is defined in cordova-bridge/index.js as well.
 * Any change made here should be ported to cordova-bridge/index.js too.
 * The MessageCodec class provides two static methods to serialize/deserialize
 * the data sent through the events channel.
*/
class MessageCodec {
  // This is a 'private' constructor, should only be used by this class
  // static methods.
  constructor(_event, _payload) {
    this.event = _event;
    this.payload = JSON.stringify(_payload);
  };

  // Serialize the message payload and the message.
  static serialize(event, payload) {
    const envelope = new MessageCodec(event, payload);
    // Return the serialized message, that can be sent through a channel.
    return JSON.stringify(envelope);
  };

  // Deserialize the message and the message payload.
  static deserialize(message) {
    var envelope = JSON.parse(message);
    if (envelope.payload !== undefined) {
      envelope.payload = JSON.parse(envelope.payload);
    }
    return envelope;
  };
};

/**
 * Channel super class.
 */
class ChannelSuper extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    // Renaming the 'emit' method to 'emitLocal' is not strictly needed, but
    // it is useful to clarify that 'emitting' on this object has a local
    // scope: it emits the event on the Node side only, it doesn't send
    // the event to Cordova.
    this.emitLocal = this.emit;
    delete this.emit;
  };
};

/**
 * Events channel class that supports user defined event types with
 * an optional message. Allows to send any serializable
 * JavaScript object supported by 'JSON.stringify()'.
 * Sending functions is not currently supported.
 * Includes the previously available 'send' method for 'message' events.
 */
class EventChannel extends ChannelSuper {
  post(event, msg) {
    cordova.exec(null, null, 'NodeJS', 'sendMessageToNode', [this.name, MessageCodec.serialize(event, msg)]);
  };

  // Posts a 'message' event, to be backward compatible with old code.
  send(msg) {
    this.post('message',msg);
  };

  // Sets a listener on the 'message' event, to be backward compatible with old code.
  setListener(callback) {
    this.on('message', callback);
  };

  processData(data) {
    // The data contains the serialized message envelope.
    var envelope = MessageCodec.deserialize(data);
    this.emitLocal(envelope.event, envelope.payload);
  };
};

/*
 * Dispatcher for all channels. This method is called by the plug-in
 * native code to deliver messages and events from Node.
 * The first argument is the channel name.
 * The second argument is the data.
 */
function allChannelsListener(args) {
  const channelName = args[0];
  const data = args[1];

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
    command,
    [].concat(args)
  );
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

const eventChannel = new EventChannel(EVENT_CHANNEL);
registerChannel(eventChannel);

module.exports = exports = {
  start,
  startWithScript,
  channel: eventChannel
};

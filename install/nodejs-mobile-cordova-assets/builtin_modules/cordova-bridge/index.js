const EventEmitter = require('events');
const NativeBridge = process.binding('cordova_bridge');

class ChannelEmitter extends EventEmitter { }
ChannelEmitter.prototype.send = function (msg) {
  NativeBridge.send(msg);
};

const channel = new ChannelEmitter();

NativeBridge.setListener(function (msg) {
  channel.emit('message', msg);
});

exports.channel = channel;
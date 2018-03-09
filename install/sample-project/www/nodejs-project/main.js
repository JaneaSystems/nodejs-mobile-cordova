// Require the 'cordova-bridge' to enable communications between the
// Node.js app and the Cordova app.
const cordova = require('cordova-bridge');

// Send a message to Cordova.
cordova.channel.send('main.js loaded');

// Post an event to Cordova.
cordova.channel.post('started');

// Post an event with a message.
cordova.channel.post('started', 'main.js loaded');

// A sample object to show how the channel supports generic
// JavaScript objects.
class Reply {
  constructor(replyMsg, originalMsg) {
    this.reply = replyMsg;
    this.original = originalMsg;
  }
};

// Listen to messages from Cordova.
cordova.channel.on('message', (msg) => {
  console.log('[node] MESSAGE received: "%s"', msg);
  // Reply sending a user defined object.
  cordova.channel.send(new Reply('Message received!', msg));
});

// Listen to event 'myevent' from Cordova.
cordova.channel.on('myevent', (msg) => {
  console.log('[node] MYEVENT received with message: "%s"', msg);
});

// Handle the 'pause' and 'resume' events.
// These are events raised automatically when the app switched to the
// background/foreground.
cordova.app.on('pause', () => {
  console.log('[node] app paused.');
});

cordova.app.on('resume', () => {
  console.log('[node] app resumed.');
  cordova.channel.post('engine', 'resumed');
});

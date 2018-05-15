const cordova = require('cordova-bridge');
const TestBase = require('./test-base');

let testName = 'cordova-send';

class TestCordovaSend extends TestBase {
  // Node side class to receive a message from cordova and inform which of the expected messages was received.
  // Used by the "Test cordova send." tests
  static prepare() {
    cordova.channel.on('message', (msg) => {
      if (typeof msg === 'undefined') {
        cordova.channel.post('test-msg-sent', 'no-msg'); return;
      }
      if (typeof msg === 'number') {
        if (msg === 0) {
          cordova.channel.post('test-msg-sent', 'integer-zero'); return;
        }
        if (msg === 5275) {
          cordova.channel.post('test-msg-sent', 'integer-positive'); return;
        }
        if (msg === -1253) {
          cordova.channel.post('test-msg-sent', 'integer-negative'); return;
        }
      }
      if (typeof msg === 'boolean') {
        if (msg === true) {
          cordova.channel.post('test-msg-sent', 'bool-true'); return;
        }
        if (msg === false) {
          cordova.channel.post('test-msg-sent', 'bool-false'); return;
        }
      }
      if (typeof msg === 'string') {
        if (msg === '') {
          cordova.channel.post('test-msg-sent', 'string-empty'); return;
        } 
        if (msg === 'a') {
          cordova.channel.post('test-msg-sent', 'string-char'); return;
        }
        if (msg === 'This is a sentence.') {
          cordova.channel.post('test-msg-sent', 'string-sentence'); return;
        }
      }
      if (typeof msg === 'object') {
        if (msg === null) {
          cordova.channel.post('test-msg-sent', 'object-null'); return;
        }
        if (Object.keys(msg).length === 0 && msg.constructor === Object) {
          cordova.channel.post('test-msg-sent', 'object-empty'); return;
        }
        if (super.checkIfIsEqualToUSER_DEFINED_OBJECT(msg)) {
          cordova.channel.post('test-msg-sent', 'object-many-fields'); return;
        }
      }
      cordova.channel.post('test-msg-sent', 'unexpected');
    });
    super.prepare(testName, () => {});
  }
  static cleanUp() {
    cordova.channel.removeAllListeners('message');
    super.cleanUp(testName);
  }
}

module.exports = TestCordovaSend;

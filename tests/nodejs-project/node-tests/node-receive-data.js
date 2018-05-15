const cordova = require('cordova-bridge');
const TestBase = require('./test-base');

let testName = "node-receive-data";

class TestNodeReceiveData extends TestBase {
  // Node side class to receive data from cordova and inform which of the expected cases was received.
  // Used by the "Test event data received by node." tests
  static prepare() {
    super.prepare(testName, (data) => {
      if (typeof data === 'undefined') {
        cordova.channel.post('test-data-sent', 'no-data'); return;
      }
      if (typeof data === 'number') {
        if (data === 0) {
          cordova.channel.post('test-data-sent', 'integer-zero'); return;
        }
        if (data === 5275) {
          cordova.channel.post('test-data-sent', 'integer-positive'); return;
        }
        if (data === -1253) {
          cordova.channel.post('test-data-sent', 'integer-negative'); return;
        }
      }
      if (typeof data === 'boolean') {
        if (data === true) {
          cordova.channel.post('test-data-sent', 'bool-true'); return;
        }
        if (data === false) {
          cordova.channel.post('test-data-sent', 'bool-false'); return;
        }
      }
      if (typeof data === 'string') {
        if (data === '') {
          cordova.channel.post('test-data-sent', 'string-empty'); return;
        } 
        if (data === 'a') {
          cordova.channel.post('test-data-sent', 'string-char'); return;
        }
        if (data === 'This is a sentence.') {
          cordova.channel.post('test-data-sent', 'string-sentence'); return;
        }
      }
      if (typeof data === 'object') {
        if (data === null) {
          cordova.channel.post('test-data-sent', 'object-null'); return;
        }
        if (Object.keys(data).length === 0 && data.constructor === Object) {
          cordova.channel.post('test-data-sent', 'object-empty'); return;
        }
        if (super.checkIfIsEqualToUSER_DEFINED_OBJECT(data)) {
          cordova.channel.post('test-data-sent', 'object-many-fields'); return;
        }
      }
      cordova.channel.post('test-data-sent', 'unexpected');
    });
  }
  static cleanUp() {
    super.cleanUp(testName);
  }
}

module.exports = TestNodeReceiveData;

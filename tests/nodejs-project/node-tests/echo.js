const cordova = require('cordova-bridge');
const TestBase = require('./test-base');

let testName = 'echo';

class TestEcho extends TestBase {
  // Resends the received arguments through the echo channel. Used by many tests where node side verifications don't matter.
  static prepare() {
    super.prepare(testName, (...args) => { cordova.channel.post('echo', ...args); } );
  }
  static cleanUp() {
    super.cleanUp(testName);
  }
}

module.exports = TestEcho;

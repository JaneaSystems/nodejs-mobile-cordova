const cordova = require('cordova-bridge');
const TestBase = require('./test-base');

let testName = 'node-once';

class TestNodeOnce extends TestBase {
  // Node side class to test that node events registered with once will be called only once.
  // Used by the "Test node once." tests
  static prepare() {
    super.prepare(testName, (request) => {
      switch(request) {
        case 'no-data':
        // test case for event only, with no data.
        {
          let result = 'ok';
          let calledOnce = false;
          cordova.channel.once('echo', function(replyObj) {
            if (calledOnce) {
              result = 'ko: called more than once';
              return;
            }
            calledOnce=true;
            if (typeof replyObj !== 'undefined') {
              result = 'ko: received data';
            }
            setTimeout( () => {
                cordova.channel.post('node-once-result', result);
              },
              TestBase.WAIT_FOR_EVENTS_MILLISECONDS()
            ); // Wait for the second event.
            cordova.channel.post('cordova-echo'); // Recall
          });
          cordova.channel.post('cordova-echo');
          }
        break;
        case 'user-defined-object':
        // test case for user defined data sent.
        {
          let result = 'ok';
          let calledOnce = false;
          let expected_data = TestBase.USER_DEFINED_OBJECT();
          cordova.channel.once('echo', function(replyObj) {
            if (calledOnce) {
              result = 'ko: called more than once';
              return;
            }
            calledOnce=true;
            if (typeof replyObj !== 'object') {
              result = 'ko: did not receive an object';
            }
            if (!TestBase.checkIfIsEqualToUSER_DEFINED_OBJECT(replyObj)) {
              result = 'ko: the received object did not match the sent one';
            }
            setTimeout( () => {
                cordova.channel.post('node-once-result', result);
              },
              TestBase.WAIT_FOR_EVENTS_MILLISECONDS()
            ); // Wait for the second event.
            cordova.channel.post('cordova-echo', expected_data); // Recall
          });
          cordova.channel.post('cordova-echo', expected_data);
        }
        break;
        default:
          cordova.channel.post('node-once-result', 'ko: unexpected test case');
      }
    });
  }
  static cleanUp() {
    cordova.channel.removeAllListeners('echo');
    super.cleanUp(testName);
  }
}

module.exports = TestNodeOnce;

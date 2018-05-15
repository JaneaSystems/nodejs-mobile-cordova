const cordova = require('cordova-bridge');
const TestBase = require('./test-base');

let testName = 'node-add-listener';

class TestNodeAddListener extends TestBase {
  // Node side class to test the node side addListener. Tests multiple listeners as well.
  // Used by the "Test node addListener." tests
  static prepare() {
    super.prepare(testName, (request) => {
      switch(request) {
        case 'no-data':
        // listen to event with no data
        {
          let result = 'ok';
          cordova.channel.addListener('echo', function(replyObj) {
            if (typeof replyObj !== 'undefined') {
              result = 'ko: received data';
            }
            cordova.channel.post('node-add-listener-result', result);
          });
          cordova.channel.post('cordova-echo');
        }
        break;
        case 'user-defined-object':
        // listen to event with user defined data
        {
          let result = 'ok';
          let expected_data = TestBase.USER_DEFINED_OBJECT();
          cordova.channel.addListener('echo', function(replyObj) {
            if (typeof replyObj !== 'object') {
              result = 'ko: did not receive an object';
            }
            if (!TestBase.checkIfIsEqualToUSER_DEFINED_OBJECT(replyObj)) {
              result = 'ko: the received object did not match the sent one';
            }
            cordova.channel.post('node-add-listener-result', result);
          });
          cordova.channel.post('cordova-echo', expected_data);
        }
        break;
        case 'many-listeners-no-data':
        // add many listeners to events with no data
        {
          let result = 'ok';
          let totalListenerCalls = 0;
          let listener1Called = 0;
          let listener2Called = 0;
          function checkIfDone() {
            if(totalListenerCalls>=2) {
              if( totalListenerCalls!==2
                || listener1Called!==1
                || listener2Called!==1
              ) {
                result = 'ko: events were not called the expected number of times';
              }
              cordova.channel.post('node-add-listener-result', result);
            }
          }
          cordova.channel.addListener('echo', function listener1(replyObj) {
            totalListenerCalls++;
            listener1Called++;
            if (typeof replyObj !== 'undefined') {
              result = 'ko: received data';
            }
            checkIfDone();
          });
          cordova.channel.addListener('echo', function listener2(replyObj) {
            totalListenerCalls++;
            listener2Called++;
            if (typeof replyObj !== 'undefined') {
              result = 'ko: received data';
            }
            checkIfDone();
          });
          cordova.channel.post('cordova-echo');
        }
        break;
        case 'many-listeners-user-defined-object':
        // add many listeners to events with a user defined object
        {
          let result = 'ok';
          let expected_data = TestBase.USER_DEFINED_OBJECT();
          let totalListenerCalls = 0;
          let listener1Called = 0;
          let listener2Called = 0;
          function checkIfDone() {
            if(totalListenerCalls>=2) {
              if( totalListenerCalls!==2
                || listener1Called!==1
                || listener2Called!==1
              ) {
                result = 'ko: events were not called the expected number of times';
              }
              cordova.channel.post('node-add-listener-result', result);
            }
          }
          cordova.channel.addListener('echo', function listener1(replyObj) {
            totalListenerCalls++;
            listener1Called++;
            if (typeof replyObj !== 'object') {
              result = 'ko: did not receive an object';
            }
            if (!TestBase.checkIfIsEqualToUSER_DEFINED_OBJECT(replyObj)) {
              result = 'ko: the received object did not match the sent one';
            }
            checkIfDone();
          });
          cordova.channel.addListener('echo', function listener2(replyObj) {
            totalListenerCalls++;
            listener2Called++;
            if (typeof replyObj !== 'object') {
              result = 'ko: did not receive an object';
            }
            if (!TestBase.checkIfIsEqualToUSER_DEFINED_OBJECT(replyObj)) {
              result = 'ko: the received object did not match the sent one';
            }
            checkIfDone();
          });
          cordova.channel.post('cordova-echo', expected_data);
        }
        break;
        case 'many-listeners-multiple-calls':
        // add many listeners to events that can be called multiple times
        {
          let result = 'ok';
          let totalListenerCalls = 0;
          let listener1Called = 0;
          let listener2Called = 0;
          let listener1Received = [];
          let listener2Received = [];
          function checkIfDone() {
            if (totalListenerCalls>=4) {
              if (totalListenerCalls!==4
                || listener1Called!==2
                || listener2Called!==2
              ) {
                result = 'ko: events were not called the expected number of times';
              }
              if (!listener1Received.includes('foo')
                ||!listener1Received.includes('bar')
                ||!listener2Received.includes('foo')
                ||!listener2Received.includes('bar')
              ) {
                result = 'ko: events did not receive the expected values';
              }
              cordova.channel.post('node-add-listener-result', result);
            }
          }
          cordova.channel.addListener('echo', function listener1(replyObj) {
            totalListenerCalls++;
            listener1Called++;
            listener1Received.push(replyObj);
            if (typeof replyObj !== 'string') {
              result = 'ko: listener did not receive a string';
            }
            checkIfDone();
          });
          cordova.channel.addListener('echo', function listener2(replyObj) {
            totalListenerCalls++;
            listener2Called++;
            listener2Received.push(replyObj);
            if (typeof replyObj !== 'string') {
              result = 'ko: listener did not receive a string';
            }
            checkIfDone();
          });
          cordova.channel.post('cordova-echo', 'foo');
          cordova.channel.post('cordova-echo', 'bar');
        }
        break;
        default:
          cordova.channel.post('node-add-listener-result', 'ko: unexpected test case');
      }
    });
  }
  static cleanUp() {
    cordova.channel.removeAllListeners('echo');
    super.cleanUp(testName);
  }
}

module.exports = TestNodeAddListener;

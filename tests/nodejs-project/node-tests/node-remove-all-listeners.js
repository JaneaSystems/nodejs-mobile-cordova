const cordova = require('cordova-bridge');
const TestBase = require('./test-base');

let testName = 'node-remove-all-listeners';

class TestNodeRemoveAllListeners extends TestBase {
  // Node side class to test the node side removeAllListeners.
  // Used by the "Test node removeAllListeners." tests
  static prepare(reinstateControl) {
    // Needs to receive a function that is able to reinstate the
    // control channel listener again, since some tests will remove it.
    super.prepare(testName, (request) => {
      switch(request) {
        case 'do-nothing-no-listeners':
        // not do anything with no previous listeners added
        {
          let result = 'ok';
          // Expected events before.
          if (cordova.channel.eventNames().length !== 2
            || !cordova.channel.eventNames().includes('control')
            || !cordova.channel.eventNames().includes('test-' + testName)
          ) {
            result = 'ko: event listened to are not the expected when the test starts';
          }
          cordova.channel.removeAllListeners();
          if (cordova.channel.eventNames().length !== 0) {
            result = 'ko: events were not clean after first removeAllListeners';
          }
          cordova.channel.removeAllListeners();
          if (cordova.channel.eventNames().length !== 0) {
            result = 'ko: events were not clean after second removeAllListeners';
          }
          reinstateControl();
          cordova.channel.post('node-remove-all-listeners-result', result);
        }
        break;
        case 'do-nothing-no-listeners-in-event':
        // not do anything with no previous listeners added to that event
        {
          let result = 'ok';
          // Expected events before.
          if (cordova.channel.eventNames().length !== 2
            || !cordova.channel.eventNames().includes('control')
            || !cordova.channel.eventNames().includes('test-' + testName)
          ) {
            result = 'ko: event listened to are not the expected when the test starts';
          }
          let expected_data = TestBase.USER_DEFINED_OBJECT();;
          function echoListener(replyObj) {
            if (typeof replyObj !== 'object') {
              result = 'ko: did not receive an object';
            }
            if (!TestBase.checkIfIsEqualToUSER_DEFINED_OBJECT(replyObj)) {
              result = 'ko: the received object did not match the sent one';
            }
            cordova.channel.post('node-remove-all-listeners-result', result);
          };
          cordova.channel.on('echo', echoListener);
          if (cordova.channel.eventNames().length !== 3
            || !cordova.channel.eventNames().includes('control')
            || !cordova.channel.eventNames().includes('test-' + testName)
            || !cordova.channel.eventNames().includes('echo')
            || cordova.channel.listeners('echo').length !== 1
            || !cordova.channel.listeners('echo').includes(echoListener)
          ) {
            result = 'ko: events listened to are not the expected after adding echoListener'
          }
          cordova.channel.removeAllListeners('not-echo'); // Should not remove anything.
          if (cordova.channel.eventNames().length !== 3
            || !cordova.channel.eventNames().includes('control')
            || !cordova.channel.eventNames().includes('test-' + testName)
            || !cordova.channel.eventNames().includes('echo')
            || cordova.channel.listeners('echo').length !== 1
            || !cordova.channel.listeners('echo').includes(echoListener)
          ) {
            // Should still have listeners for echo.
            result = 'ko: events listened to are not the expected after removing from wrong event'
          }
          cordova.channel.post('cordova-echo', expected_data);
        }
        break;
        case 'remove-listeners-no-event':
        // remove listeners added to an event without specifying the event
        {
          let result = 'ok';
          let totalListenerCalls = 0;
          let listener1Called = 0;
          let listener2Called = 0;
          let listener1Received = [];
          let listener2Received = [];
          if (cordova.channel.eventNames().length !== 2
            || !cordova.channel.eventNames().includes('control')
            || !cordova.channel.eventNames().includes('test-' + testName)
          ) {
            result = 'ko: events listened to are not the expected when the test starts';
          }
          function listener1(replyObj) {
            totalListenerCalls++;
            listener1Called++;
            listener1Received.push(replyObj);
            if (typeof replyObj !== 'string') {
              result = 'ko: listener did not receive a string';
            }
            waitForInitialCallOnBothListeners();
          }
          function listener2(replyObj) {
            totalListenerCalls++;
            listener2Called++;
            listener2Received.push(replyObj);
            if (typeof replyObj !== 'string') {
              result = 'ko: listener did not receive a string';
            }
            waitForInitialCallOnBothListeners();
          }
          function waitForInitialCallOnBothListeners() {
            if(totalListenerCalls==2) {
              // Both listeners have received the 'foo' message.
              if (listener1Called!==1
                || listener2Called!==1
              ) {
                result = 'ko: events were not called the expected number of times before removing a listener';
              }
              if (!listener1Received.includes('foo')
                ||listener1Received.includes('bar')
                ||!listener2Received.includes('foo')
                ||listener2Received.includes('bar')
              ) {
                result = 'ko: events did not receive the expected values before removing a listener';
              }
              if (cordova.channel.eventNames().length !== 3
                || !cordova.channel.eventNames().includes('control')
                || !cordova.channel.eventNames().includes('test-' + testName)
                || !cordova.channel.eventNames().includes('echo')
                || cordova.channel.listeners('echo').length !== 2
                || !cordova.channel.listeners('echo').includes(listener1)
                || !cordova.channel.listeners('echo').includes(listener2)
              ) {
                result = 'ko: events listened to are not the expected after adding the listeners'
              }
              cordova.channel.removeAllListeners();
              setTimeout(() => {
                if (totalListenerCalls!==2
                  || listener1Called!==1
                  || listener2Called!==1
                ) {
                  result = 'ko: events were not called the expected number of times after removing all listeners';
                }
                if (!listener1Received.includes('foo')
                  ||listener1Received.includes('bar')
                  ||!listener2Received.includes('foo')
                  ||listener2Received.includes('bar')
                ) {
                  result = 'ko: events did not receive the expected values after removing all listeners';
                }
                if (cordova.channel.eventNames().length !== 0) {
                  result = 'ko: events listened to are not the expected after removing a listener';
                }
                reinstateControl();
                cordova.channel.post('node-remove-all-listeners-result', result);
              }, TestBase.WAIT_FOR_EVENTS_MILLISECONDS()); // Wait for the next event call to arrive.
              cordova.channel.post('cordova-echo', 'bar');
            }
          }
          cordova.channel.on('echo', listener1);
          cordova.channel.on('echo', listener2);
          if (cordova.channel.eventNames().length !== 3
            || !cordova.channel.eventNames().includes('control')
            || !cordova.channel.eventNames().includes('test-' + testName)
            || !cordova.channel.eventNames().includes('echo')
            || cordova.channel.listeners('echo').length !== 2
            || !cordova.channel.listeners('echo').includes(listener1)
            || !cordova.channel.listeners('echo').includes(listener2)
          ) {
            result = 'ko: events listened to are not the expected after adding the listeners'
          }
          cordova.channel.post('cordova-echo', 'foo');
        }
        break;
        case 'remove-listeners-specify-event':
        // remove listeners added to an event by specifying the event
        {
          let result = 'ok';
          let totalListenerCalls = 0;
          let listener1Called = 0;
          let listener2Called = 0;
          let listener1Received = [];
          let listener2Received = [];
          if (cordova.channel.eventNames().length !== 2
            || !cordova.channel.eventNames().includes('control')
            || !cordova.channel.eventNames().includes('test-' + testName)
          ) {
            result = 'ko: events listened to are not the expected when the test starts';
          }
          function listener1(replyObj) {
            totalListenerCalls++;
            listener1Called++;
            listener1Received.push(replyObj);
            if (typeof replyObj !== 'string') {
              result = 'ko: listener did not receive a string';
            }
            waitForInitialCallOnBothListeners();
          }
          function listener2(replyObj) {
            totalListenerCalls++;
            listener2Called++;
            listener2Received.push(replyObj);
            if (typeof replyObj !== 'string') {
              result = 'ko: listener did not receive a string';
            }
            waitForInitialCallOnBothListeners();
          }
          function waitForInitialCallOnBothListeners() {
            if(totalListenerCalls==2) {
              // Both listeners have received the 'foo' message.
              if (listener1Called!==1
                || listener2Called!==1
              ) {
                result = 'ko: events were not called the expected number of times before removing a listener';
              }
              if (!listener1Received.includes('foo')
                ||listener1Received.includes('bar')
                ||!listener2Received.includes('foo')
                ||listener2Received.includes('bar')
              ) {
                result = 'ko: events did not receive the expected values before removing a listener';
              }
              if (cordova.channel.eventNames().length !== 3
                || !cordova.channel.eventNames().includes('control')
                || !cordova.channel.eventNames().includes('test-' + testName)
                || !cordova.channel.eventNames().includes('echo')
                || cordova.channel.listeners('echo').length !== 2
                || !cordova.channel.listeners('echo').includes(listener1)
                || !cordova.channel.listeners('echo').includes(listener2)
              ) {
                result = 'ko: events listened to are not the expected after adding the listeners'
              }
              cordova.channel.removeAllListeners('echo');
              setTimeout(() => {
                if (totalListenerCalls!==2
                  || listener1Called!==1
                  || listener2Called!==1
                ) {
                  result = 'ko: events were not called the expected number of times after removing all listeners';
                }
                if (!listener1Received.includes('foo')
                  ||listener1Received.includes('bar')
                  ||!listener2Received.includes('foo')
                  ||listener2Received.includes('bar')
                ) {
                  result = 'ko: events did not receive the expected values after removing all listeners';
                }
                if (cordova.channel.eventNames().length !== 2
                  || !cordova.channel.eventNames().includes('control')
                  || !cordova.channel.eventNames().includes('test-' + testName)
                ) {
                      result = 'ko: events listened to are not the expected after removing a listener';
                }
                cordova.channel.post('node-remove-all-listeners-result', result);
              }, TestBase.WAIT_FOR_EVENTS_MILLISECONDS()); // Wait for the next event call to arrive.
              cordova.channel.post('cordova-echo', 'bar');
            }
          }
          cordova.channel.on('echo', listener1);
          cordova.channel.on('echo', listener2);
          if (cordova.channel.eventNames().length !== 3
            || !cordova.channel.eventNames().includes('control')
            || !cordova.channel.eventNames().includes('test-' + testName)
            || !cordova.channel.eventNames().includes('echo')
            || cordova.channel.listeners('echo').length !== 2
            || !cordova.channel.listeners('echo').includes(listener1)
            || !cordova.channel.listeners('echo').includes(listener2)
          ) {
            result = 'ko: events listened to are not the expected after adding the listeners'
          }
          cordova.channel.post('cordova-echo', 'foo');
        }
        break;
        default:
          cordova.channel.post('node-remove-all-listeners-result', 'ko: unexpected test case');
      }
    });
  }
  static cleanUp() {
    cordova.channel.removeAllListeners('echo');
    super.cleanUp(testName);
  }
}

module.exports = TestNodeRemoveAllListeners;

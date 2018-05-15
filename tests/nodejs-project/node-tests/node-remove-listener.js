const cordova = require('cordova-bridge');
const TestBase = require('./test-base');

let testName = 'node-remove-listener';

class TestNodeRemoveListener extends TestBase {
  // Node side class to test the node side removeListener.
  // Used by the "Test node removeListener." tests
  static prepare() {
    super.prepare(testName, (request) => {
      switch(request) {
        case 'dont-remove-listener-from-other-event':
        // not to do anything if no listeners have been added to that event
        {
          let result = 'ok';
          let expected_data = TestBase.USER_DEFINED_OBJECT();
          if (cordova.channel.eventNames().length !== 2
            || !cordova.channel.eventNames().includes('control')
            || !cordova.channel.eventNames().includes('test-' + testName)
          ) {
            result = 'ko: event listened to are not the expected when the test starts';
          }
          function echoListener(replyObj) {
            if (typeof replyObj !== 'object') {
              result = 'ko: did not receive an object';
            }
            if (!TestBase.checkIfIsEqualToUSER_DEFINED_OBJECT(replyObj)) {
              result = 'ko: the received object did not match the sent one';
            }
            cordova.channel.post('node-remove-listener-result', result);
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
          cordova.channel.removeListener('not-echo', echoListener); // Should not remove anything.
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
        case 'remove-one-listener':
          // remove a previously added listener
        {
          let result = 'ok';
          let calledOnce = false;
          let expected_data = TestBase.USER_DEFINED_OBJECT();
          if (cordova.channel.eventNames().length !== 2
            || !cordova.channel.eventNames().includes('control')
            || !cordova.channel.eventNames().includes('test-' + testName)
          ) {
            result = 'ko: event listened to are not the expected when the test starts';
          }
          function echoListener(replyObj) {
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
            if (cordova.channel.eventNames().length !== 3
              || !cordova.channel.eventNames().includes('control')
              || !cordova.channel.eventNames().includes('test-' + testName)
              || !cordova.channel.eventNames().includes('echo')
              || cordova.channel.listeners('echo').length !== 1
              || !cordova.channel.listeners('echo').includes(echoListener)
            ) {
              // Should still have listeners for echo.
              result = 'ko: events listened to are not the expected before removing the listener'
            }
            cordova.channel.removeListener('echo', echoListener); // Should remove the listener.
            if (cordova.channel.eventNames().length !== 2
              || !cordova.channel.eventNames().includes('control')
              || !cordova.channel.eventNames().includes('test-' + testName)
            ) {
              result = 'ko: event listened to are not the expected after removing the listener';
            }
            setTimeout( () => {
              cordova.channel.post('node-remove-listener-result', result);
            }, TestBase.WAIT_FOR_EVENTS_MILLISECONDS()); // Wait for the second event before passing to the next test.
            cordova.channel.post('cordova-echo', expected_data); // Recall
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
          cordova.channel.post('cordova-echo', expected_data);
        }
        break;
        case 'remove-one-listener-from-many':
        // remove one listener after multiple listeners have been added
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
              // Remove listener2.
              cordova.channel.removeListener('echo', listener2);
              setTimeout(() => {
                if (totalListenerCalls!==3
                  || listener1Called!==2
                  || listener2Called!==1
                ) {
                  result = 'ko: events were not called the expected number of times after removing a listener';
                }
                if (!listener1Received.includes('foo')
                  ||!listener1Received.includes('bar')
                  ||!listener2Received.includes('foo')
                  ||listener2Received.includes('bar')
                ) {
                  result = 'ko: events did not receive the expected values after removing a listener';
                }
                if (cordova.channel.eventNames().length !== 3
                  || !cordova.channel.eventNames().includes('control')
                  || !cordova.channel.eventNames().includes('test-' + testName)
                  || !cordova.channel.eventNames().includes('echo')
                  || cordova.channel.listeners('echo').length !== 1
                  || !cordova.channel.listeners('echo').includes(listener1)
                  || cordova.channel.listeners('echo').includes(listener2)
                ) {
                  result = 'ko: events listened to are not the expected after removing a listener'
                }
                cordova.channel.post('node-remove-listener-result', result);
              }, TestBase.WAIT_FOR_EVENTS_MILLISECONDS()); //Wait for the next event call to arrive.
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
          cordova.channel.post('node-remove-listener-result', 'ko: unexpected test case');
      }
    });
  }
  static cleanUp() {
    cordova.channel.removeAllListeners('echo');
    super.cleanUp(testName);
  }
}

module.exports = TestNodeRemoveListener;

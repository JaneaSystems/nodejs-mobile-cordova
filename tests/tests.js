
let isNodeJSStarted = false;

function startupCallback(err) {
  if (err) {
    if (err === 'Engine already started') {
      // Engine already started. It's expected if the user came from another page or pressed the reset button.
    } else {
      console.log('Engine start failed with this error: ' + err);
    }
  } else {
    //console.log ('Node.js Mobile Engine started');
  }
};

function startNodeProject() {
  //nodejs.channel.on('control', controlEventistener);

  nodejs.start('test-main.js', startupCallback, {
  });
};

document.addEventListener('deviceready', function() {
  startNodeProject();
});

const USER_DEFINED_OBJECT = { // Generic user defined object. Should be equal to the one in the node side.
  a_string: 'a string',
  a_false: false,
  a_true: true,
  a_null: null,
  an_empty_string: '',
  a_zero: 0,
  a_positive: 5242,
  a_negative: -1235,
  an_empty_object: {},
  another_object: { a: -43, b: false }
};

const WAIT_FOR_EVENTS_MILLISECONDS = 1000; // Wait for 1 second in tests where we don't want an event to be called.

function generalPrepare(name, done) {
  nodejs.channel.removeAllListeners('prepared-' + name);
  nodejs.channel.removeAllListeners('cleaned-' + name);
  nodejs.channel.on('prepared-' + name, () => {
    nodejs.channel.removeAllListeners('prepared-' + name);
    done();
  });
  nodejs.channel.post('control', { action : 'prepare', testName: name } );
}

function generalCleanUp(name, done) {
  nodejs.channel.removeAllListeners('prepared-' + name);
  nodejs.channel.removeAllListeners('cleaned-' + name);
  nodejs.channel.on('cleaned-' + name, () => {
    nodejs.channel.removeAllListeners('cleaned-' + name);
    done();
  });
  nodejs.channel.post('control', { action : 'clean-up', testName: name } );
}

function setUpTheEchoChannel() {
  nodejs.channel.on('cordova-echo', function(...args) {
    nodejs.channel.post('echo', ...args);
  });
}

function cleanUpTheEchoChannel() {
  nodejs.channel.removeAllListeners('cordova-echo');
}

exports.defineAutoTests = function () {
  describe('Test event data received by cordova.', function() {
    // The objects sent by node are defined in nodejs-project/note-tests/cordova-receive-data.js
    beforeAll( function() {
      nodejs.channel.removeAllListeners();
    });

    beforeEach( function(done) {
      nodejs.channel.removeAllListeners('test-receive-data');
      generalPrepare('cordova-receive-data', done);
    });

    it( 'should receive an event without data' , function(done) {
      nodejs.channel.on('test-receive-data', function(data) {
        expect(typeof data === "undefined").toBe(true);
        done();
      });
      nodejs.channel.post('test-cordova-receive-data', 'no-data');
    });

    it( 'should receive a zero integer' , function(done) {
      let expected_data = 0;
      nodejs.channel.on('test-receive-data', function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-cordova-receive-data', 'integer-zero');
    });

    it( 'should receive a positive integer' , function(done) {
      let expected_data = 5275;
      nodejs.channel.on('test-receive-data', function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-cordova-receive-data', 'integer-positive');
    });

    it( 'should receive a negative integer' , function(done) {
      let expected_data = -1253;
      nodejs.channel.on('test-receive-data', function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-cordova-receive-data', 'integer-negative');
    });

    it( 'should receive a true boolean' , function(done) {
      let expected_data = true;
      nodejs.channel.on('test-receive-data', function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toBe(expected_data);
        done();
      });
      nodejs.channel.post('test-cordova-receive-data', 'bool-true');
    });

    it( 'should receive a false boolean' , function(done) {
      let expected_data = false;
      nodejs.channel.on('test-receive-data', function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toBe(expected_data);
        done();
      });
      nodejs.channel.post('test-cordova-receive-data', 'bool-false');
    });

    it( 'should receive an empty string' , function(done) {
      let expected_data = '';
      nodejs.channel.on('test-receive-data', function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-cordova-receive-data', 'string-empty');
    });

    it( 'should receive a string with a char' , function(done) {
      let expected_data = 'a';
      nodejs.channel.on('test-receive-data', function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-cordova-receive-data', 'string-char');
    });

    it( 'should receive a string with a sentence' , function(done) {
      let expected_data = 'This is a sentence.';
      nodejs.channel.on('test-receive-data', function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-cordova-receive-data', 'string-sentence');
    });

    it( 'should receive a null object' , function(done) {
      let expected_data = null;
      nodejs.channel.on('test-receive-data', function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-cordova-receive-data', 'object-null');
    });

    it( 'should receive an empty object' , function(done) {
      let expected_data = {};
      nodejs.channel.on('test-receive-data', function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-cordova-receive-data', 'object-empty');
    });

    it( 'should receive an object with many fields' , function(done) {
      let expected_data = USER_DEFINED_OBJECT;
      nodejs.channel.on('test-receive-data', function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-cordova-receive-data', 'object-many-fields');
    });

    afterEach( function(done) {
      nodejs.channel.removeAllListeners('test-receive-data');
      generalCleanUp('cordova-receive-data', done);
    });
  });

  describe('Test event data received by node.', function() {
    // The node code that tries to interpret what we are sending is defined in nodejs-project/note-tests/node-receive-data.js
    beforeAll( function() {
      nodejs.channel.removeAllListeners();
    });

    beforeEach( function(done) {
      nodejs.channel.removeAllListeners('test-data-sent');
      generalPrepare('node-receive-data', done);
    });

    it( 'should send an event without data' , function(done) {
      nodejs.channel.on('test-data-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('no-data');
        done();
      });
      nodejs.channel.post('test-node-receive-data');
    });

    it( 'should send a zero integer' , function(done) {
      nodejs.channel.on('test-data-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('integer-zero');
        done();
      });
      nodejs.channel.post('test-node-receive-data', 0);
    });

    it( 'should send a positive integer' , function(done) {
      nodejs.channel.on('test-data-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('integer-positive');
        done();
      });
      nodejs.channel.post('test-node-receive-data', 5275);
    });

    it( 'should send a negative integer' , function(done) {
      nodejs.channel.on('test-data-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('integer-negative');
        done();
      });
      nodejs.channel.post('test-node-receive-data', -1253);
    });

    it( 'should send a true boolean' , function(done) {
      nodejs.channel.on('test-data-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('bool-true');
        done();
      });
      nodejs.channel.post('test-node-receive-data', true);
    });

    it( 'should send a false boolean' , function(done) {
      nodejs.channel.on('test-data-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('bool-false');
        done();
      });
      nodejs.channel.post('test-node-receive-data', false);
    });

    it( 'should send an empty string' , function(done) {
      nodejs.channel.on('test-data-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('string-empty');
        done();
      });
      nodejs.channel.post('test-node-receive-data', '');
    });

    it( 'should send a string with a char' , function(done) {
      nodejs.channel.on('test-data-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('string-char');
        done();
      });
      nodejs.channel.post('test-node-receive-data', 'a');
    });

    it( 'should send a string with a sentence' , function(done) {
      nodejs.channel.on('test-data-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('string-sentence');
        done();
      });
      nodejs.channel.post('test-node-receive-data', 'This is a sentence.');
    });

    it( 'should send a null object' , function(done) {
      nodejs.channel.on('test-data-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('object-null');
        done();
      });
      nodejs.channel.post('test-node-receive-data', null);
    });

    it( 'should send an empty object' , function(done) {
      nodejs.channel.on('test-data-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('object-empty');
        done();
      });
      nodejs.channel.post('test-node-receive-data', {});
    });

    it( 'should send an object with many fields' , function(done) {
      nodejs.channel.on('test-data-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('object-many-fields');
        done();
      });
      nodejs.channel.post('test-node-receive-data', USER_DEFINED_OBJECT);
    });

    afterEach( function(done) {
      nodejs.channel.removeAllListeners('test-data-sent');
      generalCleanUp('node-receive-data', done);
    });
  });

  describe('Test cordova once.', function() {
    // Makes sure the listeners registered with once are only called once.
    beforeAll( function() {
      nodejs.channel.removeAllListeners();
    });

    // Since node checks don't matter for this test, it uses a generic echo channel defined in nodejs-project/note-tests/echo.js
    beforeEach( function(done) {
      nodejs.channel.removeAllListeners('echo');
      generalPrepare('echo', done);
    });

    it( 'should receive event with no data only once' , function(done) {
      let calledOnce = false;
      nodejs.channel.once('echo', function(replyObj) {
        expect(calledOnce).toBe(false);
        if (calledOnce) {
          done(); // This was called twice. Pass to the next test.
          return;
        }
        calledOnce=true;
        expect(typeof replyObj === 'undefined').toBe(true);
        setTimeout( () => {done();}, WAIT_FOR_EVENTS_MILLISECONDS); // Wait for the second event.
        nodejs.channel.post('test-echo'); // Recall
      });
      nodejs.channel.post('test-echo');
    });

    it( 'should receive event with user-defined object only once' , function(done) {
      let calledOnce = false;
      let expected_data = USER_DEFINED_OBJECT;
      nodejs.channel.once('echo', function(replyObj) {
        expect(calledOnce).toBe(false);
        if (calledOnce) {
          done(); // This was called twice. Pass to the next test.
          return;
        }
        calledOnce=true;
        expect(typeof replyObj === 'object').toBe(true);
        expect(replyObj).toEqual(expected_data);
        setTimeout( () => {done();}, WAIT_FOR_EVENTS_MILLISECONDS); // Wait for the second event.
        nodejs.channel.post('test-echo', expected_data); // Recall
      });
      nodejs.channel.post('test-echo', expected_data);
    });

    afterEach( function(done) {
      nodejs.channel.removeAllListeners('echo');
      generalCleanUp('echo', done);
    });
  });

  describe('Test cordova addListener.', function() {
    // Tests channel.addListener() . Tests multiple listeners as well.
    beforeAll( function() {
      nodejs.channel.removeAllListeners();
    });

    // Since node-side checks don't matter for these tests, a generic echo channel defined in nodejs-project/note-tests/echo.js is used.
    beforeEach( function(done) {
      nodejs.channel.removeAllListeners('echo');
      generalPrepare('echo', done);
    });

    it( 'should listen to event with no data' , function(done) {
      nodejs.channel.addListener('echo', function(replyObj) {
        expect(typeof replyObj === 'undefined').toBe(true);
        done();
      });
      nodejs.channel.post('test-echo');
    });

    it( 'should listen to event with user defined data' , function(done) {
      let expected_data = USER_DEFINED_OBJECT;
      nodejs.channel.addListener('echo', function(replyObj) {
        expect(typeof replyObj === 'object').toBe(true);
        expect(replyObj).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-echo', expected_data);
    });

    it( 'should add many listeners to events with no data' , function(done) {
      let totalListenerCalls = 0;
      let listener1Called = 0;
      let listener2Called = 0;
      function checkIfDone() {
        if(totalListenerCalls>=2) {
          expect(totalListenerCalls).toBe(2);
          expect(listener1Called).toBe(1);
          expect(listener2Called).toBe(1);
          done();
        }
      }
      nodejs.channel.addListener('echo', function listener1(replyObj) {
        totalListenerCalls++;
        listener1Called++;
        expect(typeof replyObj === 'undefined').toBe(true);
        checkIfDone();
      });
      nodejs.channel.addListener('echo', function listener2(replyObj) {
        totalListenerCalls++;
        listener2Called++;
        expect(typeof replyObj === 'undefined').toBe(true);
        checkIfDone();
      });
      nodejs.channel.post('test-echo');
    });

    it( 'should add many listeners to events with a user defined object' , function(done) {
      let expected_data = USER_DEFINED_OBJECT;
      let totalListenerCalls = 0;
      let listener1Called = 0;
      let listener2Called = 0;
      function checkIfDone() {
        if(totalListenerCalls>=2) {
          expect(totalListenerCalls).toBe(2);
          expect(listener1Called).toBe(1);
          expect(listener2Called).toBe(1);
          done();
        }
      }
      nodejs.channel.addListener('echo', function listener1(replyObj) {
        totalListenerCalls++;
        listener1Called++;
        expect(typeof replyObj === 'object').toBe(true);
        expect(replyObj).toEqual(expected_data);
        checkIfDone();
      });
      nodejs.channel.addListener('echo', function listener2(replyObj) {
        totalListenerCalls++;
        listener2Called++;
        expect(typeof replyObj === 'object').toBe(true);
        expect(replyObj).toEqual(expected_data);
        checkIfDone();
      });
      nodejs.channel.post('test-echo', expected_data);
    });

    it( 'should add many listeners to events that can be called multiple times' , function(done) {
      let totalListenerCalls = 0;
      let listener1Called = 0;
      let listener2Called = 0;
      let listener1Received = [];
      let listener2Received = [];
      function checkIfDone() {
        if(totalListenerCalls>=4) {
          expect(totalListenerCalls).toBe(4);
          expect(listener1Called).toBe(2);
          expect(listener2Called).toBe(2);
          expect(listener1Received).toContain('foo');
          expect(listener1Received).toContain('bar');
          expect(listener2Received).toContain('foo');
          expect(listener2Received).toContain('bar');
          done();
        }
      }
      nodejs.channel.addListener('echo', function listener1(replyObj) {
        totalListenerCalls++;
        listener1Called++;
        listener1Received.push(replyObj);
        expect(typeof replyObj === 'string').toBe(true);
        checkIfDone();
      });
      nodejs.channel.addListener('echo', function listener2(replyObj) {
        totalListenerCalls++;
        listener2Called++;
        listener2Received.push(replyObj);
        expect(typeof replyObj === 'string').toBe(true);
        checkIfDone();
      });
      nodejs.channel.post('test-echo', 'foo');
      nodejs.channel.post('test-echo', 'bar');
    });

    afterEach( function(done) {
      nodejs.channel.removeAllListeners('echo');
      generalCleanUp('echo', done);
    });
  });

  describe('Test cordova removeListener.', function() {
    // Tests channel.removeListener() .
    beforeAll( function() {
      nodejs.channel.removeAllListeners();
    });

    // Since node-side checks don't matter for these tests, a generic echo channel defined in nodejs-project/note-tests/echo.js is used.
    beforeEach( function(done) {
      nodejs.channel.removeAllListeners('echo');
      generalPrepare('echo', done);
    });

    it ('should not to do anything if no listeners have been added to that event', function(done) {
      expect(nodejs.channel.eventNames()).toEqual([]); // No events before.
      let expected_data = USER_DEFINED_OBJECT;
      function echoListener(replyObj) {
        expect(typeof replyObj === 'object').toBe(true);
        expect(replyObj).toEqual(expected_data);
        done();
      };
      nodejs.channel.on('echo', echoListener);
      expect(nodejs.channel.eventNames()).toEqual(['echo']); // Should have listeners for echo.
      expect(nodejs.channel.listeners('echo')).toEqual([echoListener]);
      nodejs.channel.removeListener('not-echo', echoListener); // Should not remove anything.
      expect(nodejs.channel.eventNames()).toEqual(['echo']); // Should still have listeners for echo.
      expect(nodejs.channel.listeners('echo')).toEqual([echoListener]);
      nodejs.channel.post('test-echo', expected_data);
    });

    it ('should remove a previously added listener', function(done) {
      let calledOnce = false;
      let expected_data = USER_DEFINED_OBJECT;
      expect(nodejs.channel.eventNames()).toEqual([]); // No events before.
      function echoListener(replyObj) {
        expect(calledOnce).toBe(false);
        if (calledOnce) {
          done(); // This listener was called twice. Pass to the next test.
          return;
        }
        calledOnce=true;
        expect(typeof replyObj === 'object').toBe(true);
        expect(replyObj).toEqual(expected_data);
        expect(nodejs.channel.eventNames()).toEqual(['echo']); // Should have listeners for echo.
        expect(nodejs.channel.listeners('echo')).toEqual([echoListener]);
        nodejs.channel.removeListener('echo', echoListener); // Should remove the listener.
        expect(nodejs.channel.eventNames()).toEqual([]);
        expect(nodejs.channel.listeners('echo')).toEqual([]);
        setTimeout( () => {done();}, WAIT_FOR_EVENTS_MILLISECONDS); // Wait for the second event before passing to the next test.
        nodejs.channel.post('test-echo', expected_data); // Recall
      };
      nodejs.channel.on('echo', echoListener);
      expect(nodejs.channel.eventNames()).toEqual(['echo']); // Should have listeners for echo.
      expect(nodejs.channel.listeners('echo')).toEqual([echoListener]);
      nodejs.channel.post('test-echo', expected_data);
    });

    it ('should remove one listener after multiple listeners have been added', function(done) {
      let totalListenerCalls = 0;
      let listener1Called = 0;
      let listener2Called = 0;
      let listener1Received = [];
      let listener2Received = [];
      expect(nodejs.channel.eventNames()).toEqual([]); // No events before.
      function listener1(replyObj) {
        totalListenerCalls++;
        listener1Called++;
        listener1Received.push(replyObj);
        expect(typeof replyObj === 'string').toBe(true);
        waitForInitialCallOnBothListeners();
      }
      function listener2(replyObj) {
        totalListenerCalls++;
        listener2Called++;
        listener2Received.push(replyObj);
        expect(typeof replyObj === 'string').toBe(true);
        waitForInitialCallOnBothListeners();
      }
      function waitForInitialCallOnBothListeners() {
        if(totalListenerCalls==2) {
          // Both listeners have received the 'foo' message.
          expect(listener1Called).toBe(1);
          expect(listener2Called).toBe(1);
          expect(listener1Received).toContain('foo');
          expect(listener2Received).toContain('foo');
          // Remove listener2.
          expect(nodejs.channel.eventNames()).toEqual(['echo']); // Should have listeners for echo.
          expect(nodejs.channel.listeners('echo')).toContain(listener1);
          expect(nodejs.channel.listeners('echo')).toContain(listener2);
          nodejs.channel.removeListener('echo', listener2);
          setTimeout(() => {
            expect(totalListenerCalls).toBe(3);
            expect(listener1Called).toBe(2);
            expect(listener2Called).toBe(1);
            expect(listener1Received).toContain('foo');
            expect(listener2Received).toContain('foo');
            expect(listener1Received).toContain('bar');
            expect(listener2Received).not.toContain('bar');
            expect(nodejs.channel.eventNames()).toEqual(['echo']);
            expect(nodejs.channel.listeners('echo')).toContain(listener1);
            expect(nodejs.channel.listeners('echo')).not.toContain(listener2);
            done();
          }, WAIT_FOR_EVENTS_MILLISECONDS); //Wait for the next event call to arrive.
          nodejs.channel.post('test-echo', 'bar');
        }
      }
      nodejs.channel.on('echo', listener1);
      nodejs.channel.on('echo', listener2);
      expect(nodejs.channel.eventNames()).toEqual(['echo']); // Should have listeners for echo.
      expect(nodejs.channel.listeners('echo')).toContain(listener1);
      expect(nodejs.channel.listeners('echo')).toContain(listener2);
      nodejs.channel.post('test-echo', 'foo');
    });

    afterEach( function(done) {
      nodejs.channel.removeAllListeners('echo');
      generalCleanUp('echo', done);
    });
  });

  describe('Test cordova removeAllListeners.', function() {
    // Tests channel.removeAllListeners() .
    beforeAll( function() {
      nodejs.channel.removeAllListeners();
    });

    // Since node-side checks don't matter for these tests, a generic echo channel defined in nodejs-project/note-tests/echo.js is used.
    beforeEach( function(done) {
      nodejs.channel.removeAllListeners('echo');
      generalPrepare('echo', done);
    });

    it ('should not do anything with no previous listeners added', function() {
      expect(nodejs.channel.eventNames()).toEqual([]); // No events before.
      nodejs.channel.removeAllListeners();
      expect(nodejs.channel.eventNames()).toEqual([]); // No events afterwards.
    });

    it ('should not do anything with no previous listeners added to that event', function(done) {
      expect(nodejs.channel.eventNames()).toEqual([]); // No events before.
      let expected_data = USER_DEFINED_OBJECT;
      function echoListener(replyObj) {
        expect(typeof replyObj === 'object').toBe(true);
        expect(replyObj).toEqual(expected_data);
        done();
      };
      nodejs.channel.on('echo', echoListener);
      expect(nodejs.channel.eventNames()).toEqual(['echo']); // Should have listeners for echo.
      expect(nodejs.channel.listeners('echo')).toEqual([echoListener]);
      nodejs.channel.removeAllListeners('not-echo'); // Should not remove anything.
      expect(nodejs.channel.eventNames()).toEqual(['echo']); // Should still have listeners for echo.
      expect(nodejs.channel.listeners('echo')).toEqual([echoListener]);
      nodejs.channel.post('test-echo', expected_data);
    });

    it ('should remove listeners added to an event without specifying the event', function(done) {
      let totalListenerCalls = 0;
      let listener1Called = 0;
      let listener2Called = 0;
      let listener1Received = [];
      let listener2Received = [];
      expect(nodejs.channel.eventNames()).toEqual([]); // No events before.
      function listener1(replyObj) {
        totalListenerCalls++;
        listener1Called++;
        listener1Received.push(replyObj);
        expect(typeof replyObj === 'string').toBe(true);
        waitForInitialCallOnBothListeners();
      }
      function listener2(replyObj) {
        totalListenerCalls++;
        listener2Called++;
        listener2Received.push(replyObj);
        expect(typeof replyObj === 'string').toBe(true);
        waitForInitialCallOnBothListeners();
      }
      function waitForInitialCallOnBothListeners() {
        if(totalListenerCalls==2) {
          // Both listeners have received the 'foo' message.
          expect(listener1Called).toBe(1);
          expect(listener2Called).toBe(1);
          expect(listener1Received).toContain('foo');
          expect(listener2Received).toContain('foo');
          expect(nodejs.channel.eventNames()).toEqual(['echo']); // Should have listeners for echo.
          expect(nodejs.channel.listeners('echo')).toContain(listener1);
          expect(nodejs.channel.listeners('echo')).toContain(listener2);
          nodejs.channel.removeAllListeners();
          setTimeout(() => {
            expect(totalListenerCalls).toBe(2);
            expect(listener1Called).toBe(1);
            expect(listener2Called).toBe(1);
            expect(listener1Received).toContain('foo');
            expect(listener2Received).toContain('foo');
            expect(listener1Received).not.toContain('bar');
            expect(listener2Received).not.toContain('bar');
            expect(nodejs.channel.eventNames()).toEqual([]);
            expect(nodejs.channel.listeners('echo')).not.toContain(listener1);
            expect(nodejs.channel.listeners('echo')).not.toContain(listener2);
            done();
          }, WAIT_FOR_EVENTS_MILLISECONDS); //Wait for the next event call to arrive.
          nodejs.channel.post('test-echo', 'bar');
        }
      }
      nodejs.channel.on('echo', listener1);
      nodejs.channel.on('echo', listener2);
      expect(nodejs.channel.eventNames()).toEqual(['echo']); // Should have listeners for echo.
      expect(nodejs.channel.listeners('echo')).toContain(listener1);
      expect(nodejs.channel.listeners('echo')).toContain(listener2);
      nodejs.channel.post('test-echo', 'foo');
    });

    it ('should remove listeners added to an event by specifying the event', function(done) {
      let totalListenerCalls = 0;
      let listener1Called = 0;
      let listener2Called = 0;
      let listener1Received = [];
      let listener2Received = [];
      expect(nodejs.channel.eventNames()).toEqual([]); // No events before.
      function listener1(replyObj) {
        totalListenerCalls++;
        listener1Called++;
        listener1Received.push(replyObj);
        expect(typeof replyObj === 'string').toBe(true);
        waitForInitialCallOnBothListeners();
      }
      function listener2(replyObj) {
        totalListenerCalls++;
        listener2Called++;
        listener2Received.push(replyObj);
        expect(typeof replyObj === 'string').toBe(true);
        waitForInitialCallOnBothListeners();
      }
      function waitForInitialCallOnBothListeners() {
        if(totalListenerCalls==2) {
          // Both listeners have received the 'foo' message.
          expect(listener1Called).toBe(1);
          expect(listener2Called).toBe(1);
          expect(listener1Received).toContain('foo');
          expect(listener2Received).toContain('foo');
          expect(nodejs.channel.eventNames()).toEqual(['echo']); // Should have listeners for echo.
          expect(nodejs.channel.listeners('echo')).toContain(listener1);
          expect(nodejs.channel.listeners('echo')).toContain(listener2);
          nodejs.channel.removeAllListeners('echo');
          setTimeout(() => {
            expect(totalListenerCalls).toBe(2);
            expect(listener1Called).toBe(1);
            expect(listener2Called).toBe(1);
            expect(listener1Received).toContain('foo');
            expect(listener2Received).toContain('foo');
            expect(listener1Received).not.toContain('bar');
            expect(listener2Received).not.toContain('bar');
            expect(nodejs.channel.eventNames()).toEqual([]);
            expect(nodejs.channel.listeners('echo')).not.toContain(listener1);
            expect(nodejs.channel.listeners('echo')).not.toContain(listener2);
            done();
          }, WAIT_FOR_EVENTS_MILLISECONDS); //Wait for the next event call to arrive.
          nodejs.channel.post('test-echo', 'bar');
        }
      }
      nodejs.channel.on('echo', listener1);
      nodejs.channel.on('echo', listener2);
      expect(nodejs.channel.eventNames()).toEqual(['echo']); // Should have listeners for echo.
      expect(nodejs.channel.listeners('echo')).toContain(listener1);
      expect(nodejs.channel.listeners('echo')).toContain(listener2);
      nodejs.channel.post('test-echo', 'foo');
    });

    afterEach( function(done) {
      nodejs.channel.removeAllListeners('echo');
      generalCleanUp('echo', done);
    });
  });

  describe('Test cordova send', function() {
    // The node code that tries to interpret what we are sending is defined in nodejs-project/note-tests/cordova-send.js
    beforeAll( function() {
      nodejs.channel.removeAllListeners();
    });

    beforeEach( function(done) {
      nodejs.channel.removeAllListeners('test-msg-sent');
      generalPrepare('cordova-send', done);
    });

    it( 'should send a message without data' , function(done) {
      nodejs.channel.on('test-msg-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('no-msg');
        done();
      });
      nodejs.channel.send();
    });

    it( 'should send a zero integer message' , function(done) {
      nodejs.channel.on('test-msg-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('integer-zero');
        done();
      });
      nodejs.channel.send(0);
    });

    it( 'should send a positive integer message' , function(done) {
      nodejs.channel.on('test-msg-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('integer-positive');
        done();
      });
      nodejs.channel.send(5275);
    });

    it( 'should send a negative integer message' , function(done) {
      nodejs.channel.on('test-msg-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('integer-negative');
        done();
      });
      nodejs.channel.send(-1253);
    });

    it( 'should send a true boolean message' , function(done) {
      nodejs.channel.on('test-msg-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('bool-true');
        done();
      });
      nodejs.channel.send(true);
    });

    it( 'should send a false boolean message' , function(done) {
      nodejs.channel.on('test-msg-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('bool-false');
        done();
      });
      nodejs.channel.send(false);
    });

    it( 'should send an empty string message' , function(done) {
      nodejs.channel.on('test-msg-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('string-empty');
        done();
      });
      nodejs.channel.send('');
    });

    it( 'should send a string with a char message' , function(done) {
      nodejs.channel.on('test-msg-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('string-char');
        done();
      });
      nodejs.channel.send('a');
    });

    it( 'should send a string with a sentence message' , function(done) {
      nodejs.channel.on('test-msg-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('string-sentence');
        done();
      });
      nodejs.channel.send('This is a sentence.');
    });

    it( 'should send a null object message' , function(done) {
      nodejs.channel.on('test-msg-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('object-null');
        done();
      });
      nodejs.channel.send(null);
    });

    it( 'should send an empty object message' , function(done) {
      nodejs.channel.on('test-msg-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('object-empty');
        done();
      });
      nodejs.channel.send({});
    });

    it( 'should send an object with many fields message' , function(done) {
      nodejs.channel.on('test-msg-sent', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('object-many-fields');
        done();
      });
      nodejs.channel.send(USER_DEFINED_OBJECT);
    });

    afterEach( function(done) {
      nodejs.channel.removeAllListeners('test-msg-sent');
      generalCleanUp('cordova-send', done);
    });
  });

  describe('Test node send and cordova setListener.', function() {
    // The objects sent by node are defined in nodejs-project/note-tests/node-send.js
    beforeAll( function() {
      nodejs.channel.removeAllListeners();
    });

    beforeEach( function(done) {
      nodejs.channel.removeAllListeners('message');
      generalPrepare('node-send', done);
    });

    it( 'should receive a message without data' , function(done) {
      nodejs.channel.setListener(function(data) {
        expect(typeof data === "undefined").toBe(true);
        done();
      });
      nodejs.channel.post('test-node-send', 'no-msg');
    });

    it( 'should receive a zero integer message' , function(done) {
      let expected_data = 0;
      nodejs.channel.setListener(function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-node-send', 'integer-zero');
    });

    it( 'should receive a positive integer message' , function(done) {
      let expected_data = 5275;
      nodejs.channel.setListener(function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-node-send', 'integer-positive');
    });

    it( 'should receive a negative integer message' , function(done) {
      let expected_data = -1253;
      nodejs.channel.setListener(function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-node-send', 'integer-negative');
    });

    it( 'should receive a true boolean message' , function(done) {
      let expected_data = true;
      nodejs.channel.setListener(function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toBe(expected_data);
        done();
      });
      nodejs.channel.post('test-node-send', 'bool-true');
    });

    it( 'should receive a false boolean message' , function(done) {
      let expected_data = false;
      nodejs.channel.setListener(function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toBe(expected_data);
        done();
      });
      nodejs.channel.post('test-node-send', 'bool-false');
    });

    it( 'should receive an empty string message' , function(done) {
      let expected_data = '';
      nodejs.channel.setListener(function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-node-send', 'string-empty');
    });

    it( 'should receive a string with a char message' , function(done) {
      let expected_data = 'a';
      nodejs.channel.setListener(function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-node-send', 'string-char');
    });

    it( 'should receive a string with a sentence message' , function(done) {
      let expected_data = 'This is a sentence.';
      nodejs.channel.setListener(function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-node-send', 'string-sentence');
    });

    it( 'should receive a null object message' , function(done) {
      let expected_data = null;
      nodejs.channel.setListener(function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-node-send', 'object-null');
    });

    it( 'should receive an empty object message' , function(done) {
      let expected_data = {};
      nodejs.channel.setListener(function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-node-send', 'object-empty');
    });

    it( 'should receive an object with many fields message' , function(done) {
      let expected_data = USER_DEFINED_OBJECT;
      nodejs.channel.setListener(function(data) {
        expect(typeof data === typeof expected_data).toBe(true);
        expect(data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-node-send', 'object-many-fields');
    });

    afterEach( function(done) {
      nodejs.channel.removeAllListeners('message');
      generalCleanUp('node-send', done);
    });
  });

  describe('Test node once.', function() {
    // The node code that defines the node side tests is defined in nodejs-project/note-tests/node-once.js
    beforeAll( function() {
      nodejs.channel.removeAllListeners();
    });

    // Uses an echo channel on the cordova side so that node can check if it receives back the events it sends for this channel.
    beforeEach( function(done) {
      setUpTheEchoChannel();
      nodejs.channel.removeAllListeners('node-once-result');
      generalPrepare('node-once', done);
    });

    it( 'node should receive event with no data only once' , function(done) {
      nodejs.channel.on('node-once-result', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('ok');
        done();
      });
      nodejs.channel.post('test-node-once', 'no-data');
    });

    it( 'node should receive event with user-defined object only once' , function(done) {
      nodejs.channel.on('node-once-result', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('ok');
        done();
      });
      nodejs.channel.post('test-node-once', 'user-defined-object');
    });

    afterEach( function(done) {
      cleanUpTheEchoChannel();
      nodejs.channel.removeAllListeners('node-once-result');
      generalCleanUp('node-once', done);
    });
  });

  describe('Test node addListener.', function() {
    // The node code that defines the node side tests is defined in nodejs-project/note-tests/node-add-listener.js
    beforeAll( function() {
      nodejs.channel.removeAllListeners();
    });

    // Uses an echo channel on the cordova side so that node can check if it receives back the events it sends for this channel.
    beforeEach( function(done) {
      setUpTheEchoChannel();
      nodejs.channel.removeAllListeners('node-add-listener-result');
      generalPrepare('node-add-listener', done);
    });

    it( 'node should listen to event with no data' , function(done) {
      nodejs.channel.on('node-add-listener-result', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('ok');
        done();
      });
      nodejs.channel.post('test-node-add-listener', 'no-data');
    });

    it( 'node should listen to event with user defined data' , function(done) {
      nodejs.channel.on('node-add-listener-result', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('ok');
        done();
      });
      nodejs.channel.post('test-node-add-listener', 'user-defined-object');
    });

    it( 'node should add many listeners to events with no data' , function(done) {
      nodejs.channel.on('node-add-listener-result', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('ok');
        done();
      });
      nodejs.channel.post('test-node-add-listener', 'many-listeners-no-data');
    });

    it( 'node should add many listeners to events with a user defined object' , function(done) {
      nodejs.channel.on('node-add-listener-result', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('ok');
        done();
      });
      nodejs.channel.post('test-node-add-listener', 'many-listeners-user-defined-object');
    });

    it( 'node should add many listeners to events that can be called multiple times' , function(done) {
      nodejs.channel.on('node-add-listener-result', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('ok');
        done();
      });
      nodejs.channel.post('test-node-add-listener', 'many-listeners-multiple-calls');
    });

    afterEach( function(done) {
      cleanUpTheEchoChannel();
      nodejs.channel.removeAllListeners('node-add-listener-result');
      generalCleanUp('node-add-listener', done);
    });
  });

  describe('Test node removeListener.', function() {
    // The node code that defines the node side tests is defined in nodejs-project/note-tests/node-remove-listener.js
    beforeAll( function() {
      nodejs.channel.removeAllListeners();
    });

    // Uses an echo channel on the cordova side so that node can check if it receives back the events it sends for this channel.
    beforeEach( function(done) {
      setUpTheEchoChannel();
      nodejs.channel.removeAllListeners('node-remove-listener-result');
      generalPrepare('node-remove-listener', done);
    });

    it ('node should not to do anything if no listeners have been added to that event', function(done) {
      nodejs.channel.on('node-remove-listener-result', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('ok');
        done();
      });
      nodejs.channel.post('test-node-remove-listener', 'dont-remove-listener-from-other-event');
    });

    it ('node should remove a previously added listener', function(done) {
      nodejs.channel.on('node-remove-listener-result', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('ok');
        done();
      });
      nodejs.channel.post('test-node-remove-listener', 'remove-one-listener');
    });

    it ('node should remove one listener after multiple listeners have been added', function(done) {
      nodejs.channel.on('node-remove-listener-result', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('ok');
        done();
      });
      nodejs.channel.post('test-node-remove-listener', 'remove-one-listener-from-many');
    });

    afterEach( function(done) {
      cleanUpTheEchoChannel();
      nodejs.channel.removeAllListeners('node-remove-listener-result');
      generalCleanUp('node-remove-listener', done);
    });
  });

  describe('Test node removeAllListeners.', function() {
    // The node code that defines the node side tests is defined in nodejs-project/note-tests/node-remove-all-listeners.js
    beforeAll( function() {
      nodejs.channel.removeAllListeners();
    });

    // Uses an echo channel on the cordova side so that node can check if it receives back the events it sends for this channel.
    beforeEach( function(done) {
      setUpTheEchoChannel();
      nodejs.channel.removeAllListeners('node-remove-all-listeners-result');
      generalPrepare('node-remove-all-listeners', done);
    });

    it ('node should not do anything with no previous listeners added', function(done) {
      nodejs.channel.on('node-remove-all-listeners-result', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('ok');
        done();
      });
      nodejs.channel.post('test-node-remove-all-listeners', 'do-nothing-no-listeners');
    });

    it ('node should not do anything with no previous listeners added to that event', function(done) {
      nodejs.channel.on('node-remove-all-listeners-result', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('ok');
        done();
      });
      nodejs.channel.post('test-node-remove-all-listeners', 'do-nothing-no-listeners-in-event');
    });

    it ('node should remove listeners added to an event without specifying the event', function(done) {
      nodejs.channel.on('node-remove-all-listeners-result', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('ok');
        done();
      });
      nodejs.channel.post('test-node-remove-all-listeners', 'remove-listeners-no-event');
    });

    it ('node should remove listeners added to an event by specifying the event', function(done) {
      nodejs.channel.on('node-remove-all-listeners-result', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('ok');
        done();
      });
      nodejs.channel.post('test-node-remove-all-listeners', 'remove-listeners-specify-event');
    });

    afterEach( function(done) {
      cleanUpTheEchoChannel();
      nodejs.channel.removeAllListeners('node-remove-all-listeners-result');
      generalCleanUp('node-remove-all-listeners', done);
    });
  });

  describe('Test node app.datadir().', function() {
    // The node code that defines the node side tests is defined in nodejs-project/note-tests/node-datadir.js
    beforeAll( function() {
      nodejs.channel.removeAllListeners();
    });

    beforeEach( function(done) {
      nodejs.channel.removeAllListeners('node-datadir-result');
      generalPrepare('node-datadir', done);
    });
  
    it ('node should write a file to the writable directory and read it correctly', function(done) {
      nodejs.channel.on('node-datadir-result', function(response) {
        expect(typeof response === 'string').toBe(true);
        expect(response).toEqual('ok');
        done();
      });
      nodejs.channel.post('test-node-datadir', 'write-and-read-file');
    });
  
    afterEach( function(done) {
      nodejs.channel.removeAllListeners('node-datadir-result');
      generalCleanUp('node-datadir', done);
    });
  });

  describe('Test sending and receiving same value back', function() {
    beforeAll( function() {
      nodejs.channel.removeAllListeners();
    });

    beforeEach( function(done) {
      nodejs.channel.removeAllListeners('echo');
      generalPrepare('echo', done);
    });

    it( 'should support sending and receiving no data' , function(done) {
      nodejs.channel.on('echo', function(reply_data) {
        expect(typeof reply_data === 'undefined').toBe(true);
        done();
      });
      nodejs.channel.post('test-echo');
    });

    it( 'should support sending and receiving a zero integer' , function(done) {
      let expected_data = 0;
      nodejs.channel.on('echo', function(reply_data) {
        expect(typeof reply_data === typeof expected_data).toBe(true);
        expect(reply_data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-echo', expected_data);
    });

    it( 'should support sending and receiving a positive integer' , function(done) {
      let expected_data = 5275;
      nodejs.channel.on('echo', function(reply_data) {
        expect(typeof reply_data === typeof expected_data).toBe(true);
        expect(reply_data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-echo', expected_data);
    });

    it( 'should support sending and receiving a negative integer' , function(done) {
      let expected_data = -1253;
      nodejs.channel.on('echo', function(reply_data) {
        expect(typeof reply_data === typeof expected_data).toBe(true);
        expect(reply_data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-echo', expected_data);
    });

    it( 'should support sending and receiving a true boolean' , function(done) {
      let expected_data = true;
      nodejs.channel.on('echo', function(reply_data) {
        expect(typeof reply_data === typeof expected_data).toBe(true);
        expect(reply_data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-echo', expected_data);
    });

    it( 'should support sending and receiving a false boolean' , function(done) {
      let expected_data = false;
      nodejs.channel.on('echo', function(reply_data) {
        expect(typeof reply_data === typeof expected_data).toBe(true);
        expect(reply_data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-echo', expected_data);
    });

    it( 'should support sending and receiving an empty string' , function(done) {
      let expected_data = '';
      nodejs.channel.on('echo', function(reply_data) {
        expect(typeof reply_data === typeof expected_data).toBe(true);
        expect(reply_data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-echo', expected_data);
    });

    it( 'should support sending and receiving a string with a char' , function(done) {
      let expected_data = 'a';
      nodejs.channel.on('echo', function(reply_data) {
        expect(typeof reply_data === typeof expected_data).toBe(true);
        expect(reply_data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-echo', expected_data);
    });

    it( 'should support sending and receiving a string with a sentence' , function(done) {
      let expected_data = 'This is a sentence.';
      nodejs.channel.on('echo', function(reply_data) {
        expect(typeof reply_data === typeof expected_data).toBe(true);
        expect(reply_data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-echo', expected_data);
    });

    it( 'should support sending and receiving a null object' , function(done) {
      let expected_data = null;
      nodejs.channel.on('echo', function(reply_data) {
        expect(typeof reply_data === typeof expected_data).toBe(true);
        expect(reply_data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-echo', expected_data);
    });

    it( 'should support sending and receiving an empty object' , function(done) {
      let expected_data = {};
      nodejs.channel.on('echo', function(reply_data) {
        expect(typeof reply_data === typeof expected_data).toBe(true);
        expect(reply_data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-echo', expected_data);
    });

    it( 'should support sending and receiving an object with many fields' , function(done) {
      let expected_data = USER_DEFINED_OBJECT;
      nodejs.channel.on('echo', function(reply_data) {
        expect(typeof reply_data === typeof expected_data).toBe(true);
        expect(reply_data).toEqual(expected_data);
        done();
      });
      nodejs.channel.post('test-echo', expected_data);
    });

    afterEach( function(done) {
      nodejs.channel.removeAllListeners('echo');
      generalCleanUp('echo', done);
    });
  });

};

exports.defineManualTests = function(contentEl, createActionButton) {
  createActionButton('Test Pause/Resume', function() {
    nodejs.channel.removeAllListeners();
    contentEl.innerHTML = '';
    nodejs.channel.on('pause-called', (timestamp) => {
      contentEl.innerHTML+='The pause event was called at ' + timestamp/1000 + ' seconds.<br/>';
    });
    nodejs.channel.on('resume-called', (timestamp) => {
      contentEl.innerHTML+='The resume event was called at ' + timestamp/1000 + ' seconds.<br/>';
      nodejs.channel.post('control', { action : 'clean-pause-resume' } );
    });
    nodejs.channel.on('prepared-pause-resume', () => {
      contentEl.innerHTML+=`
        You can do actions for which you expect pause and resume to be called now.
        You should get messages for both of the events.<br/>
        Some actions you can take:<br/>
        <ul>
        <li>Press the Home button and then return to this application.</li>
        <li>Lock and then unlock the phone.</li>
        <li>
          Open another application and then return to this one.
          <a href='http://janeasystems.com/' target='_blank'>Click here to open a browser.</a>
        </ul>
        <br/>
        `;
    });
    nodejs.channel.on('cleaned-pause-resume', () => {
      nodejs.channel.removeAllListeners();
      contentEl.innerHTML+='This pause resume test is done. Press the button again if you want to run another test.<br/>';
    });
    nodejs.channel.post('control', { action : 'prepare-pause-resume' } );
  });
  createActionButton('Stress cordova-node channel', function() {
    nodejs.channel.removeAllListeners();
    let test_header = 'This test will send messages to node, 1000 at a time. You have to press the Stop current tests button to stop it.<br/>';
    contentEl.innerHTML = test_header;
    let num_msgs_sent = 0;
    function send_1000_msgs() {
      for(let i=0;i<1000;i++) {
        nodejs.channel.post('test-stress-channel', num_msgs_sent);
        num_msgs_sent++;
      }
    }
    nodejs.channel.on('stress-channel-report', (num_rcvd) => {
      contentEl.innerHTML = test_header + 'Node received ' + num_rcvd + ' messages.<br/>';
      send_1000_msgs();
    });
    function completeTest() {
      contentEl.innerHTML += 'Stress test completed.<br/>';
      generalCleanUp('stress-channel', () => {
        nodejs.channel.removeAllListeners();
      });
    }
    generalPrepare('stress-channel', () => {
      send_1000_msgs();
    });
  })
  createActionButton('Stress node-cordova channel', function() {
    nodejs.channel.removeAllListeners();
    let test_header = 'This test will ask for node to send messages, 1000 at a time. You have to press the Stop current tests button to stop it.<br/>';
    contentEl.innerHTML = test_header;
    let num_msgs_received = 0;
    let last_msg_received = 0;
    let out_of_order_warning_given = false;
    function ask_for_1000_msgs() {
      nodejs.channel.post('test-node-stress-channel', 1000);
    }
    nodejs.channel.on('node-stress-channel', (msg) => {
      num_msgs_received++;
      if (!out_of_order_warning_given && msg<last_msg_received) {
        console.log('Out of order message on Cordova. ' + msg + ' arrived after ' + last_msg_received);
        out_of_order_warning_given = true;
      }
      last_msg_received=msg;
      if(num_msgs_received%1000==0) {
        contentEl.innerHTML = test_header + 'Cordova received ' + num_msgs_received + ' messages.<br/>';
        ask_for_1000_msgs();
      }
    });
    function completeTest() {
      contentEl.innerHTML += 'Stress test completed.<br/>';
      generalCleanUp('node-stress-channel', () => {
        nodejs.channel.removeAllListeners();
      });
    }
    generalPrepare('node-stress-channel', () => {
      ask_for_1000_msgs();
    });
  })
  createActionButton('Stop current tests', function() {
    var stoppedTests = 0;
    function testCleanReport(mask) {
      stoppedTests = stoppedTests|mask;
      if(stoppedTests===0b111) {
        contentEl.innerHTML += 'Any manual tests running have been stopped.<br/>';
        nodejs.channel.removeAllListeners();
      }
    }
    nodejs.channel.on('cleaned-pause-resume', () => {
      testCleanReport(0b001);
    });
    nodejs.channel.post('control', { action : 'clean-pause-resume' } );
    generalCleanUp('node-stress-channel', () => {
      testCleanReport(0b010);
    });
    generalCleanUp('stress-channel', () => {
      testCleanReport(0b100);
    });
  })
};

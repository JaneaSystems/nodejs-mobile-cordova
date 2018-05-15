const cordova = require('cordova-bridge');
const TestBase = require('./test-base');

let testName = 'node-send';

class TestNodeSend extends TestBase {
  // Node side class to send messages that cordova expects to receive correctly with setListener.
  // Used by the "Test node send and cordova setListener." tests
  static prepare() {
    super.prepare(testName, (request) => {
      switch(request) {
        case 'no-msg':
          cordova.channel.send();
        break;
        case 'integer-zero':
          cordova.channel.send(0);
        break;
        case 'integer-positive':
          cordova.channel.send(5275);
        break;
        case 'integer-negative':
          cordova.channel.send(-1253);
        break;
        case 'bool-true':
          cordova.channel.send(true);
        break;
        case 'bool-false':
          cordova.channel.send(false);
        break;
        case 'string-empty':
          cordova.channel.send('');
        break;
        case 'string-char':
          cordova.channel.send('a');
        break;
        case 'string-sentence':
          cordova.channel.send('This is a sentence.');
        break;
        case 'object-null':
          cordova.channel.send(null);
        break;
        case 'object-empty':
          cordova.channel.send({});
        break;
        case 'object-many-fields':
          cordova.channel.send(super.USER_DEFINED_OBJECT());
        break;
        default:
          cordova.channel.send('unexpected');
      }
    });
  }
  static cleanUp() {
    super.cleanUp(testName);
  }
}

module.exports = TestNodeSend;

const cordova = require('cordova-bridge');
const TestBase = require('./test-base');

let testName = 'cordova-receive-data';

class TestCordovaReceiveData extends TestBase {
  // Node side class to send data that cordova expects to receive correctly.
  // Used by the "Test event data received by cordova." tests
  static prepare() {
    super.prepare(testName, (request) => {
      switch(request) {
        case 'no-data':
          cordova.channel.post('test-receive-data');
        break;
        case 'integer-zero':
          cordova.channel.post('test-receive-data', 0);
        break;
        case 'integer-positive':
          cordova.channel.post('test-receive-data', 5275);
        break;
        case 'integer-negative':
          cordova.channel.post('test-receive-data', -1253);
        break;
        case 'bool-true':
          cordova.channel.post('test-receive-data', true);
        break;
        case 'bool-false':
          cordova.channel.post('test-receive-data', false);
        break;
        case 'string-empty':
          cordova.channel.post('test-receive-data', '');
        break;
        case 'string-char':
          cordova.channel.post('test-receive-data', 'a');
        break;
        case 'string-sentence':
          cordova.channel.post('test-receive-data', 'This is a sentence.');
        break;
        case 'object-null':
          cordova.channel.post('test-receive-data', null);
        break;
        case 'object-empty':
          cordova.channel.post('test-receive-data', {});
        break;
        case 'object-many-fields':
          cordova.channel.post('test-receive-data', super.USER_DEFINED_OBJECT());
        break;
        default:
          cordova.channel.post('test-receive-data', 'unexpected');
      }
    });
  }
  static cleanUp() {
    super.cleanUp(testName);
  }
}

module.exports = TestCordovaReceiveData;

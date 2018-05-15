const cordova = require('cordova-bridge');
const TestBase = require('./test-base');
const path = require('path');
const fs = require('fs');

let testName = 'node-datadir';

class TestNodeDataDir extends TestBase {
  // Node side class to test the node side app.datadir().
  // Used by the "Test node app.datadir()." tests
  static prepare() {
    super.prepare(testName, (request) => {
      switch(request) {
        case 'write-and-read-file':
        // write a file to the writable directory and read it correctly.
        {
          let result = 'ok';
          let contentToWrite = 'file-contents';
          let writablePath = path.join(cordova.app.datadir(), 'writefile.txt');
          fs.writeFileSync(writablePath, contentToWrite, {encoding: 'utf8'});
          let readResult = fs.readFileSync(writablePath, {encoding: 'utf8'});
          if(contentToWrite !== readResult) {
            result = 'ko: file contents read are not what was supposed to be written.';
          }
          cordova.channel.post('node-datadir-result', result);
        }
        break;
        default:
          cordova.channel.post('node-datadir-result', 'ko: unexpected test case');
      }
    });
  }
  static cleanUp() {
    super.cleanUp(testName);
  }
}

module.exports = TestNodeDataDir;

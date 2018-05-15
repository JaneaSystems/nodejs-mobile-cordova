const cordova = require('cordova-bridge');
const TestBase = require('./test-base');
const assert = require('assert');

let testName = 'node-stress-channel';

class TestNodeStressChannel extends TestBase {
  // Node side class to stress the channel.
  // Used by the manual "stress node-cordova channel"
  static prepare() {
    let num_msgs_sent = 0;
    super.prepare(testName, (num_msgs) => {
      for(let i=0;i<num_msgs;i++) {
        cordova.channel.post('node-stress-channel', num_msgs_sent);
        num_msgs_sent++;
      }
      let logMsg = 'Node sent ' + num_msgs_sent + ' messages. ';
      console.log(logMsg);
    });
  }
  static cleanUp() {
    super.cleanUp(testName);
  }
}

module.exports = TestNodeStressChannel;

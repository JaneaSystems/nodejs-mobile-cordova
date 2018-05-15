const cordova = require('cordova-bridge');
const TestBase = require('./test-base');

let testName = 'stress-channel';

class TestStressChannel extends TestBase {
  // Node side class to stress the channel.
  // Used by the manual "stress cordova-node channel"
  static prepare() {
    let num_msgs_received = 0;
    let last_msg_received = 0;
    super.prepare(testName, (msg) => {
      num_msgs_received++;
      if(msg<last_msg_received) {
        console.log('Out of order message. ' + msg + ' arrived after ' + last_msg_received);
      }
      last_msg_received=msg;
      if(num_msgs_received%1000==0) {
        cordova.channel.post('stress-channel-report', num_msgs_received);
      }
    });
  }
  static cleanUp() {
    super.cleanUp(testName);
  }
}

module.exports = TestStressChannel;




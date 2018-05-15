const cordova = require('cordova-bridge');

function pretestCleanUp() {
  // Make every listener is removed except for control events before each test.
  let preTestEvents = cordova.channel.eventNames();
  for (const eventName of preTestEvents) {
    if(eventName!=='control') {
      cordova.channel.removeAllListeners(eventName);
    }
  }
}

function controlListener(controlObj) {
  switch(controlObj.action) {
    case 'prepare':
      pretestCleanUp();
      if(controlObj.testName === 'node-remove-all-listeners') {
        // Remove All listeners tests have to remove listeners from the control channel.
        // They are a special case that needs to know how to register this listener again.
        // Logic errors on these tests may cause the node side to become unresponsive,
        // if the control channel doesn't get reinstated.
        require('./node-tests/node-remove-all-listeners').prepare( () => {
          cordova.channel.removeAllListeners('control');
          cordova.channel.on('control', controlListener);
        });
      } else {
        require('./node-tests/' + controlObj.testName).prepare();
      }
    break;
    case 'clean-up':
      require('./node-tests/' + controlObj.testName).cleanUp();
    break;
    case 'prepare-pause-resume':
      cordova.app.removeAllListeners();
      cordova.app.on('pause', (pauseLock) => {
        const NS_PER_MS = 1e6;
        const MS_PER_SEC = 1e3;
        const pauseTime = process.hrtime();
        cordova.channel.post('pause-called', pauseTime[0] * MS_PER_SEC + Math.floor(pauseTime[1]/ NS_PER_MS))
        pauseLock.release();
      });
      cordova.app.on('resume', () => {
        const NS_PER_MS = 1e6;
        const MS_PER_SEC = 1e3;
        const resumeTime = process.hrtime();
        cordova.channel.post('resume-called', resumeTime[0] * MS_PER_SEC + Math.floor(resumeTime[1]/ NS_PER_MS))
      });
      cordova.channel.post('prepared-pause-resume');
    break;
    case 'clean-pause-resume':
      cordova.app.removeAllListeners();
      cordova.channel.post('cleaned-pause-resume');
    break;
  }
};

cordova.channel.on('control', controlListener);


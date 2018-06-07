var expectToFail=false;

var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        document.getElementById('beforestart').setAttribute('style','display:block;');
        document.getElementById('nodefailstart').onclick = function() {
            showMessage('Will try to start node with a non existing file.');
            expectToFail=true;
            startNodeProject('file-that-does-not-exist.js');
        };
        document.getElementById('nodesuccesstart').onclick = function() {
            showMessage('Will try to start node correctly.');
            expectToFail=false;
            startNodeProject('test-main.js');
        };
    },
};

function showMessage(msg) {
    document.getElementById('messageslog').innerHTML += '<br/>- ' + (new Date()).toUTCString() + '<br/>' + msg ;
}

function proceedToTests() {
    document.getElementById('beforestart').setAttribute('style','display:none;');
    document.getElementById('afterstart').setAttribute('style','display:block;');
}

function startNodeProject(startFile) {
    nodejs.start(startFile, (err) => {
        if(err) {
            if (err === 'Engine already started') {
                // Engine already started. Let the user go to the tests.
                showMessage('The nodejs-mobile engine is already started.<br/>Proceed to the tests.');
                proceedToTests();
            } else {
                let msg = 'Engine start failed with this error:<br/>' + err;
                if (err === 'File not found' && expectToFail) {
                    msg += '<br/>This error was expected. TEST PASS';
                } else {
                    msg += '<br/>This error was not expected. TEST FAIL';
                }
                showMessage(msg);
            }
        } else {
            let msg = 'The nodejs-mobile engine started successfully.';
            if(expectToFail) {
                msg += '<br/>This was not expected. TEST FAIL'
            } else {
                msg += '<br/>This was expected. TEST PASS<br/>Proceed to the tests.'
                proceedToTests();
            }
            showMessage(msg);
        }
    });
}


app.initialize();

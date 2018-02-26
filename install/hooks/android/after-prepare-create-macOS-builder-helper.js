const fs = require('fs');
const path = require('path');

// Adds a helper script to run "npm rebuild" with the current PATH.
// This workaround is needed for Android Studio on macOS when it is not started
// from the command line, as npm probably won't be in the PATH at build time.
function buildMacOSHelperNpmBuildScript(context, platform)
{
  var platformPath = path.join(context.opts.projectRoot, 'platforms', platform);
  var platformAPI = require(path.join(platformPath, 'cordova', 'Api'));
  var platformAPIInstance = new platformAPI();
  var wwwPath = platformAPIInstance.locations.www;
  var helperMacOSBuildScriptPath = path.join(wwwPath, 'build-native-modules-MacOS-helper-script.sh');
  fs.writeFileSync( helperMacOSBuildScriptPath,`#!/bin/bash
    export PATH=$PATH:${process.env.PATH}
    npm $@
  `, {"mode": 0o755}
  );
}

module.exports = function(context)
{
  if (context.opts.platforms.indexOf('android') >= 0) {
    if (process.platform === 'darwin') {
      buildMacOSHelperNpmBuildScript(context, 'android');
    }
  }
}

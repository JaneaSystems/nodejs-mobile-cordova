const fs = require('fs');
const path = require('path');

// Gets the platform's www path.
function getPlatformWWWPath(context, platform) {
  const platformPath = path.join(context.opts.projectRoot, 'platforms', platform);
  const platformAPI = require(path.join(platformPath, 'cordova', 'Api'));
  let platformAPIInstance;
  try {
    platformAPIInstance = new platformAPI();
  } catch (e) {
    platformAPIInstance = new platformAPI(platform, platformPath);
  }
  return platformAPIInstance.locations.www;
}

// Adds a file to save the contents of the NODEJS_MOBILE_BUILD_NATIVE_MODULES
// environment variable if it is set during the prepare step.
function saveBuildNativeModulesPreference(context, platform)
{
  var wwwPath = getPlatformWWWPath(context, platform);
  var saveBuildNativeModulesPreferencePath = path.join(wwwPath, 'NODEJS_MOBILE_BUILD_NATIVE_MODULES_VALUE.txt');
  if (process.env.NODEJS_MOBILE_BUILD_NATIVE_MODULES !== undefined) {
    fs.writeFileSync(saveBuildNativeModulesPreferencePath, process.env.NODEJS_MOBILE_BUILD_NATIVE_MODULES);
  }
}

module.exports = function(context)
{
  if (context.opts.platforms.indexOf('android') >= 0) {
    saveBuildNativeModulesPreference(context, 'android');
  }
  if (context.opts.platforms.indexOf('ios') >= 0) {
    saveBuildNativeModulesPreference(context, 'ios');
  }
}

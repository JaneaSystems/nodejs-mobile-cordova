var path = require('path');
var fs = require('fs');

module.exports = function(context) {
  // Require the iOS platform Api to get the Xcode .pbxproj path.
  var iosPlatformPath = path.join(context.opts.projectRoot, 'platforms', 'ios');
  var iosAPI = require(path.join(iosPlatformPath, 'cordova', 'Api'));
  var iosAPIInstance = new iosAPI('ios', iosPlatformPath);
  var pbxprojPath = iosAPIInstance.locations.pbxproj;
  var rootIosProjDir = iosAPIInstance.locations.root;
  var cordovaProjPath = iosAPIInstance.locations.xcodeCordovaProj;
  var xcFrameworkPath = path.join(cordovaProjPath, 'Plugins', '@red-mobile', 'nodejs-mobile-cordova', 'NodeMobile.xcframework');
  var relativeXcFrameworkPath = path.relative(rootIosProjDir, xcFrameworkPath);

  // Patch the project file to fix a .xcframework include error.
  let pbxProjContents = fs.readFileSync(pbxprojPath).toString();
  pbxProjContents = pbxProjContents.replace('path = libs/ios/nodemobile/NodeMobile.xcframework', `path = "${relativeXcFrameworkPath}"`);
  pbxProjContents = pbxProjContents.replace('path = "libs/ios/nodemobile/NodeMobile.xcframework"', `path = "${relativeXcFrameworkPath}"`);
  fs.writeFileSync(pbxprojPath, pbxProjContents);

}
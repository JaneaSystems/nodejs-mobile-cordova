var path = require('path');
var fs = require('fs');

module.exports = function(context) {
  var xcode = context.requireCordovaModule('xcode');

  // Require the iOS platform Api to get the Xcode .pbxproj path.
  var iosPlatformPath = path.join(context.opts.projectRoot, 'platforms', 'ios');
  var iosAPI = require(path.join(iosPlatformPath, 'cordova', 'Api'));
  var iosAPIInstance = new iosAPI();
  var pbxprojPath = iosAPIInstance.locations.pbxproj;

  // Read the Xcode project and get the target.
  var xcodeProject = xcode.project(pbxprojPath);
  xcodeProject.parseSync();
  var firstTargetUUID = xcodeProject.getFirstTarget().uuid;

  // Adds a build phase to rebuild native modules.
  var rebuildNativeModulesBuildPhaseName = 'Build Node.js Mobile Native Modules';
  var rebuildNativeModulesBuildPhaseScript = `
set -e
if [ -z "$NODEJS_MOBILE_BUILD_NATIVE_MODULES" ]; then
# If build native modules preference is not set, look for it in the project's
# www/NODEJS_MOBILE_BUILD_NATIVE_MODULES_VALUE.txt
  PREFERENCE_FILE_PATH="$CODESIGNING_FOLDER_PATH/www/NODEJS_MOBILE_BUILD_NATIVE_MODULES_VALUE.txt"
  if [ -f "$PREFERENCE_FILE_PATH" ]; then
    NODEJS_MOBILE_BUILD_NATIVE_MODULES="$(cat $PREFERENCE_FILE_PATH | xargs)"
  fi
fi
if [ -z "$NODEJS_MOBILE_BUILD_NATIVE_MODULES" ]; then
# If build native modules preference is not set, try to find .gyp files
#to turn it on.
  gypfiles=($(find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -type f -name "*.gyp"))
  if [ \${#gypfiles[@]} -gt 0 ]; then
    NODEJS_MOBILE_BUILD_NATIVE_MODULES=1
  else
    NODEJS_MOBILE_BUILD_NATIVE_MODULES=0
  fi
fi
if [ "1" != "$NODEJS_MOBILE_BUILD_NATIVE_MODULES" ]; then exit 0; fi
# Delete object files that may already come from within the npm package.
find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -name "*.o" -type f -delete
find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -name "*.a" -type f -delete
find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -name "*.node" -type f -delete
# Delete bundle contents that may be there from previous builds.
find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -path "*/*.node/*" -delete
find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -name "*.node" -type d -delete
find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -path "*/*.framework/*" -delete
find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -name "*.framework" -type d -delete
# Symlinks to binaries are resolved by cordova prepare during the copy, causing build time errors.
# The original project's .bin folder will be added to the path before building the native modules.
find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -path "*/.bin/*" -delete
find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -name ".bin" -type d -delete
# Get the nodejs-mobile-gyp location
if [ -d "$PROJECT_DIR/../../plugins/nodejs-mobile-cordova/node_modules/nodejs-mobile-gyp/" ]; then
NODEJS_MOBILE_GYP_DIR="$( cd "$PROJECT_DIR" && cd ../../plugins/nodejs-mobile-cordova/node_modules/nodejs-mobile-gyp/ && pwd )"
else
NODEJS_MOBILE_GYP_DIR="$( cd "$PROJECT_DIR" && cd ../../node_modules/nodejs-mobile-gyp/ && pwd )"
fi
NODEJS_MOBILE_GYP_BIN_FILE="$NODEJS_MOBILE_GYP_DIR"/bin/node-gyp.js
# Rebuild modules with right environment
NODEJS_HEADERS_DIR="$( cd "$( dirname "$PRODUCT_SETTINGS_PATH" )" && cd Plugins/nodejs-mobile-cordova/ && pwd )"
# Adds the original project .bin to the path. It's a workaround
# to correctly build some modules that depend on symlinked modules,
# like node-pre-gyp.
if [ -d "$PROJECT_DIR/../../www/nodejs-project/node_modules/.bin/" ]; then
  PATH="$PROJECT_DIR/../../www/nodejs-project/node_modules/.bin/:$PATH"
fi
pushd $CODESIGNING_FOLDER_PATH/www/nodejs-project/
if [ "$PLATFORM_NAME" == "iphoneos" ]
then
GYP_DEFINES="OS=ios" npm_config_nodedir="$NODEJS_HEADERS_DIR" npm_config_node_gyp="$NODEJS_MOBILE_GYP_BIN_FILE" npm_config_platform="ios" npm_config_format="make-ios" npm_config_node_engine="chakracore" npm_config_arch="arm64" npm --verbose rebuild --build-from-source
else
GYP_DEFINES="OS=ios" npm_config_nodedir="$NODEJS_HEADERS_DIR" npm_config_node_gyp="$NODEJS_MOBILE_GYP_BIN_FILE" npm_config_platform="ios" npm_config_format="make-ios" npm_config_node_engine="chakracore" npm_config_arch="x64" npm --verbose rebuild --build-from-source
fi
popd
`
  var rebuildNativeModulesBuildPhase = xcodeProject.buildPhaseObject('PBXShellScriptBuildPhase', rebuildNativeModulesBuildPhaseName, firstTargetUUID);
  if (!(rebuildNativeModulesBuildPhase)) {
    xcodeProject.addBuildPhase(
      [],
      'PBXShellScriptBuildPhase',
      rebuildNativeModulesBuildPhaseName,
      firstTargetUUID,
      { shellPath: '/bin/sh', shellScript: rebuildNativeModulesBuildPhaseScript }
    );
  }

  // Adds a build phase to sign native modules.
  var signNativeModulesBuildPhaseName = 'Sign Node.js Mobile Native Modules';
  var signNativeModulesBuildPhaseScript = `
set -e
if [ -z "$NODEJS_MOBILE_BUILD_NATIVE_MODULES" ]; then
# If build native modules preference is not set, look for it in the project's
# www/NODEJS_MOBILE_BUILD_NATIVE_MODULES_VALUE.txt
  PREFERENCE_FILE_PATH="$CODESIGNING_FOLDER_PATH/www/NODEJS_MOBILE_BUILD_NATIVE_MODULES_VALUE.txt"
  if [ -f "$PREFERENCE_FILE_PATH" ]; then
    NODEJS_MOBILE_BUILD_NATIVE_MODULES="$(cat $PREFERENCE_FILE_PATH | xargs)"
    # Remove the preference file so it doesn't get in the application package.
    rm "$PREFERENCE_FILE_PATH"
  fi
fi
if [ -z "$NODEJS_MOBILE_BUILD_NATIVE_MODULES" ]; then
# If build native modules preference is not set, try to find .gyp files
#to turn it on.
  gypfiles=($(find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -type f -name "*.gyp"))
  if [ \${#gypfiles[@]} -gt 0 ]; then
    NODEJS_MOBILE_BUILD_NATIVE_MODULES=1
  else
    NODEJS_MOBILE_BUILD_NATIVE_MODULES=0
  fi
fi
if [ "1" != "$NODEJS_MOBILE_BUILD_NATIVE_MODULES" ]; then exit 0; fi
# Delete object files
find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -name "*.o" -type f -delete
find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -name "*.a" -type f -delete
# Create Info.plist for each framework built and loader override.
PATCH_SCRIPT_DIR="$( cd "$PROJECT_DIR" && cd ../../Plugins/nodejs-mobile-cordova/install/helper-scripts/ && pwd )"
NODEJS_PROJECT_DIR="$( cd "$CODESIGNING_FOLDER_PATH" && cd www/nodejs-project/ && pwd )"
node "$PATCH_SCRIPT_DIR"/ios-create-plists-and-dlopen-override.js $NODEJS_PROJECT_DIR
# Embed every resulting .framework in the application and delete them afterwards.
embed_framework()
{
    FRAMEWORK_NAME="$(basename "$1")"
    mkdir -p "$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/"
    cp -r "$1" "$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/"
    /usr/bin/codesign --force --sign $EXPANDED_CODE_SIGN_IDENTITY --preserve-metadata=identifier,entitlements,flags --timestamp=none "$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/$FRAMEWORK_NAME"
}
find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -name "*.framework" -type d | while read frmwrk_path; do embed_framework "$frmwrk_path"; done

#Delete gyp temporary .deps dependency folders from the project structure.
find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -path "*/.deps/*" -delete
find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -name ".deps" -type d -delete

#Delete frameworks from their build paths
find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -path "*/*.framework/*" -delete
find "$CODESIGNING_FOLDER_PATH/www/nodejs-project/" -name "*.framework" -type d -delete
`
  var signNativeModulesBuildPhase = xcodeProject.buildPhaseObject('PBXShellScriptBuildPhase', signNativeModulesBuildPhaseName, firstTargetUUID);
  if (!(signNativeModulesBuildPhase)) {
    xcodeProject.addBuildPhase(
      [],
      'PBXShellScriptBuildPhase',
      signNativeModulesBuildPhaseName,
      firstTargetUUID,
      { shellPath: '/bin/sh', shellScript: signNativeModulesBuildPhaseScript }
    );
  }

  //Adds a build phase to remove the x64 strips from the NodeMobile framework. Needed for correct App Store submission.
  var removeSimulatorArchsBuildPhaseName = 'Remove NodeJS Mobile Framework Simulator Strips';
  var removeSimulatorArchsBuildPhaseScript = `
set -e
FRAMEWORK_BINARY_PATH="$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/NodeMobile.framework/NodeMobile"
FRAMEWORK_STRIPPED_PATH="$FRAMEWORK_BINARY_PATH-strip"
if [ "$PLATFORM_NAME" != "iphonesimulator" ]; then
  if $(lipo "$FRAMEWORK_BINARY_PATH" -verify_arch "x86_64") ; then
    lipo -output "$FRAMEWORK_STRIPPED_PATH" -remove "x86_64" "$FRAMEWORK_BINARY_PATH"
    rm "$FRAMEWORK_BINARY_PATH"
    mv "$FRAMEWORK_STRIPPED_PATH" "$FRAMEWORK_BINARY_PATH"
    echo "Removed simulator strip from NodeMobile.framework"
  fi
fi
`
  var removeSimulatorArchsBuildPhase = xcodeProject.buildPhaseObject('PBXShellScriptBuildPhase', removeSimulatorArchsBuildPhaseName, firstTargetUUID);
  if (!removeSimulatorArchsBuildPhase) {
    xcodeProject.addBuildPhase(
      [],
      'PBXShellScriptBuildPhase',
      removeSimulatorArchsBuildPhaseName,
      firstTargetUUID,
      { shellPath: '/bin/sh', shellScript: removeSimulatorArchsBuildPhaseScript }
    );
  }

  // Write the changes into the Xcode project.
  fs.writeFileSync(pbxprojPath, xcodeProject.writeSync());

}

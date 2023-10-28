const fs = require("fs");
const path = require("path");

function getBinaryPathConfiguration(binaryPathConfiguration) {
  return binaryPathConfiguration
    .replace(/\{node_abi\}/g, "node_abi")
    .replace(/\{platform\}/g, "platform")
    .replace(/\{arch\}/g, "arch")
    .replace(/\{target_arch\}/g, "target_arch")
    .replace(/\{libc\}/g, "libc");
}

// Patches a package.json in case it has variable substitution for
// the module's binary at runtime. Since we are cross-compiling
// for mobile, this substitution will have different values at
// build time and runtime, so we pre-substitute them with fixed
// values.
function patchPackageJSON_preNodeGyp_modulePath(filePath) {
  let packageReadData = fs.readFileSync(filePath);
  let packageJSON = JSON.parse(packageReadData);
  if (packageJSON?.binary?.module_path) {
    const binaryPathConfiguration = getBinaryPathConfiguration(
      packageJSON.binary.module_path
    );
    packageJSON.binary.module_path = binaryPathConfiguration;
    const packageWriteData = JSON.stringify(packageJSON, null, 2);
    fs.writeFileSync(filePath, packageWriteData);
  }
}

/**
 * Since npm 7+, the environment variable npm_config_node_gyp (which we rely on
 * in scripts/ios-build-native-modules.sh) has not been forwarded to package
 * scripts, so here we patch each module's package.json to replace
 * node-gyp-build with our fork, node-gyp-build-mobile. This fork reads a
 * different environment variable, originally created in
 * scripts/ios-build-native-modules.sh, pointing to node-mobile-gyp.
 */
function patchPackageJSONNodeGypBuild(packageJSONPath) {
  try {
    const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath));
    if (packageJSON?.scripts?.install?.includes("node-gyp-build")) {
      packageJSON.scripts.install = packageJSON.scripts.install.replace(
        /node-gyp-build(?!-)/g,
        "$PROJECT_DIR/../node_modules/.bin/node-gyp-build-mobile"
      );
      fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, 2));
    }
  } catch (error) {
    console.error(`Failed to patch ${packageJSONPath}:`, error);
  }
}

// Visits every package.json to apply patches.
function visitPackageJSON(folderPath) {
  let files = fs.readdirSync(folderPath);
  for (let i in files) {
    let name = files[i];
    let filePath = path.join(folderPath, files[i]);
    if (fs.lstatSync(filePath).isDirectory()) {
      visitPackageJSON(filePath);
    } else if (name === "package.json") {
      try {
        patchPackageJSON_preNodeGyp_modulePath(filePath);
        patchPackageJSONNodeGypBuild(filePath);
      } catch (e) {
        console.warn(
          'Failed to patch the file : "' +
            filePath +
            '". The following error was thrown: ' +
            JSON.stringify(e)
        );
      }
    }
  }
}

// Applies the patch to the selected platform
function patchTargetPlatform(context, platform) {
  const platformPath = path.join(
    context.opts.projectRoot,
    "platforms",
    platform
  );
  const platformAPI = require(path.join(platformPath, "cordova", "Api"));
  let platformAPIInstance;
  try {
    platformAPIInstance = new platformAPI();
  } catch (e) {
    platformAPIInstance = new platformAPI(platform, platformPath);
  }
  const wwwPath = platformAPIInstance.locations.www;
  const nodeModulesPathToPatch = path.join(
    wwwPath,
    "nodejs-project",
    "node_modules"
  );
  if (fs.existsSync(nodeModulesPathToPatch)) {
    visitPackageJSON(nodeModulesPathToPatch);
  }
}

module.exports = function (context) {
  if (context.opts.platforms.indexOf("android") >= 0) {
    patchTargetPlatform(context, "android");
  }
  if (context.opts.platforms.indexOf("ios") >= 0) {
    patchTargetPlatform(context, "ios");
  }
};

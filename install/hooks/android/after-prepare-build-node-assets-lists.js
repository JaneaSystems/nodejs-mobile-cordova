var fs = require('fs');
var path = require('path');

var fileList = [];
var dirList = [];

function enumFolder(folderPath) {
  var files = fs.readdirSync(folderPath);
  for (var i in files) {
    var name = files[i];
    var path = folderPath + '/' + files[i];
    if (fs.statSync(path).isDirectory()) {
      if (name.startsWith('.') === false) {
        dirList.push(path);
        enumFolder(path);
      }
    } else {
      if (name.startsWith('.') === false &&
          name.endsWith('.gz') === false &&
          name.endsWith('~') === false) {
        fileList.push(path);
      }
    }
  }
}

function createFileAndFolderLists(context, callback) {
  try {
    var cordovaLib = require('cordova-lib');
    var platformAPI = cordovaLib.cordova_platforms.getPlatformApi('android');
    var nodeJsProjectRoot = 'www/nodejs-project';
    // The Android application's assets path will be the parent of the application's www folder.
    var androidAssetsPath = path.join(platformAPI.locations.www,'..');
    var fileListPath = path.join(androidAssetsPath,'file.list');
    var dirListPath = path.join(androidAssetsPath,'dir.list');

    enumFolder(nodeJsProjectRoot);
    fs.writeFileSync(fileListPath, fileList.join('\n'));
    fs.writeFileSync(dirListPath, dirList.join('\n'));
  } catch (err) {
    console.log(err);
    callback(err);
    return;
  }
  callback(null);
}

module.exports = function(context) {
  if (context.opts.platforms.indexOf('android') < 0) {
    return;
  }

  return new Promise((resolve, reject) => {
    createFileAndFolderLists(context, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

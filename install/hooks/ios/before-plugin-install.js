var fs = require('fs');
var targz2 = require('tar.gz2');

const nodeProjectFolder = 'www/nodejs-project';
const libnodeFolderPath = 'plugins/nodejs-mobile-cordova/libs/libnode/ios/';
const libnodeFileName = 'libnode.framework';
const libnodeFilePath = libnodeFolderPath + libnodeFileName;
const zipFileName = libnodeFileName + '.tar.zip';
const zipFilePath = libnodeFolderPath + zipFileName

module.exports = function(context) {
  var Q = context.requireCordovaModule('q');
  var deferral = new Q.defer();
  
  // Create the node project folder if it doesn't exist
  if (!fs.existsSync(nodeProjectFolder)) {
    fs.mkdirSync(nodeProjectFolder);
  }

  // Unzip and untar the libnode.Framework
  if (fs.existsSync(zipFilePath)) {  
    targz2().extract(zipFilePath, libnodeFolderPath, function(err) {
      if (err) {
        deferral.reject(err);
      } else {
        fs.unlinkSync(zipFilePath);
        deferral.resolve();
      }
    });
  } else if (!fs.existsSync(libnodeFilePath)) {
    deferral.reject(new Error(libnodeFileName + ' is missing'));
  } else {
    deferral.resolve();
  }
  
  return deferral.promise;
}

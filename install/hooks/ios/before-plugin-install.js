var fs = require('fs');
var targz2 = require('tar.gz2');

const nodeProjectFolder = 'www/nodejs-project';
const nodeMobileFolderPath = 'plugins/@red-mobile/nodejs-mobile-cordova/libs/ios/nodemobile/';
const nodeMobileFileName = 'NodeMobile.xcframework';
const nodeMobileFilePath = nodeMobileFolderPath + nodeMobileFileName;
const zipFileName = nodeMobileFileName + '.tar.zip';
const zipFilePath = nodeMobileFolderPath + zipFileName

module.exports = function(context) {
  // Create the node project folder if it doesn't exist
  if (!fs.existsSync(nodeProjectFolder)) {
    fs.mkdirSync(nodeProjectFolder);
  }

  return new Promise((resolve, reject) => {
      // Unzip and untar the libnode.Framework
    if (fs.existsSync(zipFilePath)) {
        targz2().extract(zipFilePath, nodeMobileFolderPath, function(err) {
        if (err) {
            reject(err);
        } else {
            fs.unlinkSync(zipFilePath);
            resolve();
        }
        });
    } else if (!fs.existsSync(nodeMobileFilePath)) {
        reject(new Error(nodeMobileFileName + ' is missing'));
    } else {
        resolve();
    }
  });
}

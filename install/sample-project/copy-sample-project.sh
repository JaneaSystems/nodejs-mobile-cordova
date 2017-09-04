#!/bin/sh
SRC_PATH="plugins/nodejs-mobile-cordova/install/sample-project"

function copy {
  cp -i "$SRC_PATH/$1" $1
}

mkdir -p "www/nodejs-project"

copy "www/js/index.js"
copy "www/nodejs-project/main.js"
copy "www/nodejs-project/package.json"
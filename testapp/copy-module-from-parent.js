const copy = require('recursive-copy');
const path = require('path');

var appProjectRoot = __dirname;
var modulePath = path.join(appProjectRoot, '..');

var options = {
  overwrite: true,
  dot: true,
  filter: (src) => {
    // So the app doesn't copy the module's node_modules nor itself.
    return (!src.startsWith('node_modules') && !src.startsWith('testapp'));
  }
};

copy(modulePath,
  path.join(appProjectRoot,'temp-module-copy'),
  options
).then( () => console.log("Module from parent folder copied successfully.") )
.catch ( err => console.log("Error while copying module from parent folder: " + err) );

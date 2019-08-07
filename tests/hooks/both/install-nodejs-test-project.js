const fse = require('fs-extra');
const path = require('path');

module.exports = function(context)
{
  var projectRoot = context.opts.projectRoot;
  var pluginRoot = context.opts.plugin.dir;

  return new Promise((resolve, reject) => {
    fse.copy(path.join(pluginRoot,'nodejs-project'),path.join(projectRoot,'www','nodejs-project'))
    .then( () => resolve() )
    .catch ( err => reject(err) );
  });
}

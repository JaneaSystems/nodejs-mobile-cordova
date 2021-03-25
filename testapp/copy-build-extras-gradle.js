const copy = require('recursive-copy')
const path = require('path')

copy(
  path.join(__dirname, '/build-extras.gradle'),
  path.join(__dirname, '/platforms/android/app/build-extras.gradle'),
  {
    overwrite: true,
    dot: true
  }
).then( () => console.log("The file build.gradle copied successfully.") )
.catch ( err => console.log("Error while copying build.gradle: " + err) )
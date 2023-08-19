# Node.js for Mobile Apps Cordova plugin

## Installation

```bash
% cordova plugin add nodejs-mobile-cordova
```

## Requirements

- Cordova 12.x or higher
- Android API 24 or higher

When building an application for the Android platform, make sure you have the [Android NDK](https://developer.android.com/ndk/index.html) installed and the environment variable `ANDROID_NDK_HOME` set, for example:

```bash
% export ANDROID_NDK_HOME=/Users/username/Library/Android/sdk/ndk-bundle
```

## Supported Platforms

- Android (ARMv7a, ARM64)

## Reporting Issues

We have a [central repo](https://github.com/janeasystems/nodejs-mobile/issues) where we manage all the issues related to Node.js for Mobile Apps, including specific issues of the Node.js for Mobile Apps Cordova plugin.
So please, open the issue [there](https://github.com/janeasystems/nodejs-mobile/issues).

## Methods available in the Cordova layer

These methods can be called from the Cordova javascript code directly:

- `nodejs.start`
- `nodejs.startWithScript`
- `nodejs.channel.on`
- `nodejs.channel.post`
- `nodejs.channel.setListener`
- `nodejs.channel.send`

> `nodejs.channel.setListener(callback)` is equivalent to `nodejs.channel.on('message',callback)` and `nodejs.channel.send(msg)` is equivalent to `nodejs.channel.post('message',msg)`. They are maintained for backward compatibility purposes.

### nodejs.start(scriptFileName, callback [, options])

| Param | Type |
| --- | --- |
| scriptFileName | `string` |
| callback | `function`  |
| options | `[StartupOptions](#cordova.StartupOptions)`  |

Starts the nodejs-mobile runtime thread with a file inside the `nodejs-project` directory.

### nodejs.startWithScript(scriptBody, callback [, options])

| Param | Type |
| --- | --- |
| scriptBody | `string` |
| callback | `function`  |
| options | `[StartupOptions](#cordova.StartupOptions)`  |

Starts the nodejs-mobile runtime thread with a script body.

### nodejs.channel.on(event, callback)

| Param | Type |
| --- | --- |
| event | `string` |
| callback | `[function](#cordova.channelCallback)` |

Registers a callback for user-defined events raised from the nodejs-mobile side.

### nodejs.channel.post(event, message)

| Param | Type |
| --- | --- |
| event | `string` |
| message | any JS type that can be serialized with `JSON.stringify` and deserialized with `JSON.parse` |

Raises a user-defined event on the nodejs-mobile side.

### nodejs.channel.setListener(listenerCallback)

| Param | Type |
| --- | --- |
| listenerCallback | `[function](#cordova.channelCallback)` |

Registers a callback for 'message' events raised from the nodejs-mobile side.
It is an alias for `nodejs.channel.on('message', listenerCallback);`.

### nodejs.channel.send(message)

| Param | Type |
| --- | --- |
| message | any JS type that can be serialized with `JSON.stringify` and deserialized with `JSON.parse` |

Raises a 'message' event on the nodejs-mobile side.
It is an alias for `nodejs.channel.post('message', message);`.

### StartupOptions: `object`

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| redirectOutputToLogcat | `boolean` | `true` | Allows to disable the redirection of the Node stdout/stderr to the Android logcat |

Note: the stdout/stderr redirection is applied to the whole application, the side effect is that some undesired/duplicated output may appear in the logcat.
For example, the Chromium console output `I/chromium: [INFO:CONSOLE(xx)]` is also sent to stderr and will show up in logcat has well, with the `NODEJS-MOBILE` log tag.

## Methods available in the Node layer

The following methods can be called from the Node javascript code through the `cordova-bridge` module:

```js
  var cordova = require('cordova-bridge');
```

- `cordova.channel.on`
- `cordova.channel.post`
- `cordova.channel.send`
- `cordova.app.on`
- `cordova.app.datadir`

> `cordova.channel.send(msg)` is equivalent to `cordova.channel.post('message',msg)`. It is maintained for backward compatibility purposes.

### cordova.channel.on(event, callback)

| Param | Type |
| --- | --- |
| event | `string` |
| callback | `[function](#cordova.channelCallback)` |

Registers a callback for user-defined events raised from the cordova side.

> To receive messages from `nodejs.channel.send`, use
>
> ```js
>   cordova.channel.on('message', listenerCallback);
> ```

### cordova.channel.post(event, message)

| Param | Type |
| --- | --- |
| event | `string` |
| message | any JS type that can be serialized with `JSON.stringify` and deserialized with `JSON.parse` |

Raises a user-defined event on the cordova side.

### cordova.channel.send(message)

| Param | Type |
| --- | --- |
| message | any JS type that can be serialized with `JSON.stringify` and deserialized with `JSON.parse` |

Raises a 'message' event on the cordova side.
It is an alias for `cordova.channel.post('message', message);`.

### cordova.app.on(event, callback)

| Param | Type |
| --- | --- |
| event | `string` |
| callback | `function` |

Registers callbacks for App events.
Currently supports the 'pause' and 'resume' events, which are raised automatically when the app switches to the background/foreground.

```js
cordova.app.on('pause', (pauseLock) => {
  console.log('[node] app paused.');
  pauseLock.release();
});
cordova.app.on('resume', () => {
  console.log('[node] app resumed.');
});
```

The 'pause' event is raised when the application switches to the background. On iOS, the system will wait for the 'pause' event handlers to return before finally suspending the application. For the purpose of letting the iOS application know when it can safely suspend after going to the background, a `pauseLock` argument is passed to each 'pause' listener, so that `release()` can be called on it to signal that listener has finished doing all the work it needed to do. The application will only suspend after all the locks have been released (or iOS forces it to).

```js
cordova.app.on('pause', (pauseLock) => {
  server.close( () => {
    // App will only suspend after the server stops listening for connections and current connections are closed.
    pauseLock.release();
  });
});
```

**Warning :** On iOS, the application will eventually be suspended, so the pause event should be used to run the clean up operations as quickly as possible and let the application suspend after that. Make sure to call `pauseLock.release()` in each 'pause' event listener, or your Application will keep running in the background for as long as iOS will allow it.

### cordova.app.datadir()

Returns a writable path used for persistent data storage in the application. Its value corresponds to `NSDocumentDirectory` on iOS and `FilesDir` on Android.

### Channel callback: `function(arg)`

| Name | Type |
| --- | --- |
| arg | any JS type that can be serialized with `JSON.stringify` and deserialized with `JSON.parse` |

The messages sent through the channel can be of any type that can be correctly serialized with [`JSON.stringify`](https://www.w3schools.com/js/js_json_stringify.asp) on one side and deserialized with [`JSON.parse`](https://www.w3schools.com/js/js_json_parse.asp) on the other side, as it is what the channel does internally. This means that passing JS dates through the channel will convert them to strings and functions will be removed from their containing objects. In line with [The JSON Data Interchange Syntax Standard](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf), the channel supports sending messages that are composed of these JS types: `Boolean`, `Number`, `String`, `Object`, `Array`.

## Notes about other node APIs

### os.tmpdir()

On iOS, `os.tmpdir()` returns a temporary directory, since iOS sets the `TMPDIR` environment variable of the application to the equivalent of calling `NSTemporaryDirectory`.

The Android OS doesn't define a temporary directory for the system or application, so the plugin sets the `TMPDIR` environment variable to the value of the application context's `CacheDir` value.

## Usage

This shows how to build an iOS app that exchanges text messages between the Cordova layer and the Node.js layer.
In macOS, using `Terminal`:

```bash
% cordova create HelloCordova
% cd HelloCordova
% cordova platform add ios
% cordova plugin add nodejs-mobile-cordova
% cordova plugin add cordova-plugin-console
```

You can either manually create the `./www/nodejs-project/` folder, the `./www/nodejs-project/main.js` file and edit `./www/js/index.js` or use the provided helper script to do it automatically. The helper script copies a more extended sample compared to the one provided with the manual steps.

---

### Set up project files using the helper script

If you choose to use the helper script, you will be asked to overwrite the existing `./www/js/index.js` file:

```bash
./plugins/@red-mobile/nodejs-mobile-cordova/install/sample-project/copy-sample-project.sh
overwrite www/js/index.js? (y/n [n]) y
```

The script creates the `./www/nodejs-project/` folder and adds two files:

- `./www/nodejs-project/main.js`
- `./www/nodejs-project/package.json`

The changes in `./www/js/index.js` are needed to invoke Node.js for Mobile Apps from Cordova.

---

### Set up project files using the manual steps

If you want to set up the project manually, first create the project folder for the Node.js files:

```bash
% mkdir www/nodejs-project
```

Then, with your editor of choice (we use VS Code in this example) create the `main.js` script file:

```bash
% code www/nodejs-project/main.js
```

Add the following code to `main.js` and save the file:

```js
const cordova = require('cordova-bridge');

cordova.channel.on('message', function (msg) {
  console.log('[node] received:', msg);
  cordova.channel.send('Replying to this message: ' + msg);
});
```

Edit the cordova script file `www/js/index.js`:

```bash
% code `./www/js/index.js`
```

Append the following code at the end of the file:

```js
function channelListener(msg) {
    console.log('[cordova] received:' + msg);
}

function startupCallback(err) {
    if (err) {
        console.log(err);
    } else {
        console.log ('Node.js Mobile Engine Started');
        nodejs.channel.send('Hello from Cordova!');
    }
};

function startNodeProject() {
    nodejs.channel.setListener(channelListener);
    nodejs.start('main.js', startupCallback);
    // To disable the stdout/stderr redirection to the Android logcat:
    // nodejs.start('main.js', startupCallback, { redirectOutputToLogcat: false });
};

```

Search for the `onDeviceReady` event and in the event handler add a call to `startNodeProject()`:

```js
  onDeviceReady: function() {
      this.receivedEvent('deviceready');
      startNodeProject();
  },
```

Save the changes to the `www/js/index.js` file to complete the manual steps of setting up the project files.

---

After the project files have been created, either manually or using the helper script, open the Cordova app project in Xcode:

```bash
% open platforms/ios/HelloCordova.xcodeproj
```

Switch to Xcode:

- select HelloCordova to view the project settings
- in the `General` settings:
  - in the `Signing` section select a team to sign the app
  - in `Deployment Info` section select `Deployment Target` `11.0` or higher

Go back to `Terminal` to build the Cordova app

```bash
% cordova build ios --device
```

Switch to Xcode:

- select a target device for the project
- run the project
- enlarge the `Console` area and scroll to the bottom

If you created the project following the manual steps, the output will look like this:

```bash
2017-10-02 18:49:18.606100+0200 HelloCordova[2182:1463518] Node.js Mobile Engine Started
[node] received: Hello from Cordova!
2017-10-02 18:49:18.690132+0200 HelloCordova[2182:1463518] [cordova] received: Replying to this message: Hello from Cordova!
```

If you used the helper script, the output will look like this:

```bash
2018-02-26 09:18:21.178612+0100 HelloCordova[1089:957630] Node.js Mobile Engine started
2018-02-26 09:18:21.385605+0100 HelloCordova[1089:957630] [cordova] MESSAGE from Node: "main.js loaded"
2018-02-26 09:18:21.385760+0100 HelloCordova[1089:957630] [cordova] "STARTED" event received from Node
2018-02-26 09:18:21.385831+0100 HelloCordova[1089:957630] [cordova] "STARTED" event received from Node with a message: "main.js loaded"
[node] MESSAGE received: "Hello from Cordova!"
[node] MYEVENT received with message: "An event from Cordova"
2018-02-26 09:18:21.392035+0100 HelloCordova[1089:957630] [cordova] MESSAGE from Node: "Message received!" - In reply to: "Hello from Cordova!"
```

## Node Modules

Node modules can be added to the project using `npm`.
The Node modules have to be installed in the `./www/nodejs-project/` folder and a `package.json` file needs to be added to the folder.

If you used the helper script to install the sample project, the `package.json` file is already present and you can proceed adding the desired Node modules.

If you don't know how to create the `package.json` file, just copy the sample one from `./plugins/@red-mobile/nodejs-mobile-cordova/install/sample-project/www/nodejs-project/package.json`.
Then proceed with the installation of the Node modules you want to add to your Node.js project:

```bash
% cd www/nodejs-project/
% npm install module-name
```

Rebuild your Cordova project so that the newly added Node modules are added to the Cordova application.

On Android, the plugin extracts the project files and the Node modules from the APK assets in order to make them available to the Node.js for Mobile Apps engine. They are extracted from the APK and copied to a working folder (`context.getFilesDir().getAbsolutePath() + "/www/nodejs-project/"`) when the application is launched for the first time or a new version of the application has been installed.
Given the project folder will be overwritten after each application update, it should not be used for persistent data storage.
To expedite the process of extracting the assets files, instead of parsing the assets hierarchy, a list of files `file.list` and a list of folders `dir.list` are created when the application is compiled and then added to the application assets. On Android 6.x and older versions, this allows to work around a serious perfomance bug in the Android assets manager.

### Native Modules

On Linux and macOS, there is support for building modules that contain native code.

The plugin automatically detects native modules in `./www/nodejs-project/` by searching for `.gyp`files. It's recommended to have the build prerequisites mentioned in `nodejs-mobile` for [Android](https://github.com/janeasystems/nodejs-mobile#prerequisites-to-build-the-android-library-on-linux-ubuntudebian) and [iOS](https://github.com/janeasystems/nodejs-mobile#prerequisites-to-build-the-ios-framework-library-on-macos). For Android it's also recommended that you set the `ANDROID_NDK_HOME` environment variable in your system.

Building native modules for Android can take a long time, since it depends on building a standalone NDK toolchain for each required architecture. The resulting `.node` binaries are then included in the final application in a separate asset path for each architecture and the correct one will be chosen at runtime.

While the plugin tries to detect automatically the presence of native modules, there's a way to override this detection and turn the native modules build process on or off, by creating the `www/NODEJS_MOBILE_BUILD_NATIVE_MODULES_VALUE.txt` file and setting its contents to `1` or `0` respectively.  E.g., from the root path of your project:

```sh
echo "1" > www/NODEJS_MOBILE_BUILD_NATIVE_MODULES_VALUE.txt
cordova run android
```

```sh
echo "1" > www/NODEJS_MOBILE_BUILD_NATIVE_MODULES_VALUE.txt
cordova run ios
```

## Troubleshooting

### Android

If the installed Android NDK version is `>= r18`, the following error can occur while building for Android:

```sh
FAILURE: Build failed with an exception.

* What went wrong:
A problem occurred configuring root project 'android'.
> No toolchains found in the NDK toolchains folder for ABI with prefix: mips64el-linux-android
```

This is caused by the Gradle version used by `cordova-android` version `6.x` not supporting the NDK toolchain versions greater than `r18`, as documented in this [cordova-android issue](https://github.com/apache/cordova-android/issues/504) and the [Android NDK r18 Changelog's known issues](https://github.com/android-ndk/ndk/wiki/Changelog-r18#known-issues).

The [cordova-android issue](https://github.com/apache/cordova-android/issues/504) mentions possible workarounds the user may take to get around this issue, including updating the gradle plugin used by your Android Project / using an older NDK.

To solve this issue while using Android NDK versions `>= r18` with cordova-android 6.x without having to update the project created by cordova, the recommended workaround would be to copy the `mips64el-linux-android-4.9` and `mipsel-linux-android-4.9` toolchains from an older release into your local NDK install or create a local link to other toolchains so that the Gradle internal checks pass, since these toolchains won't be used by Cordova. Here's one way to do this, assuming the `ANDROID_NDK_HOME` environment variable is set in your system:

```bash
% cd $ANDROID_NDK_HOME/toolchains
% ln -s aarch64-linux-android-4.9 mips64el-linux-android
% ln -s arm-linux-androideabi-4.9 mipsel-linux-android
```

### iOS

When using `Xcode 10` with `cordova-ios` version `4.x`, the following error might occur when trying to build or run the application:

```sh
The executable was signed with invalid entitlements.

The entitlements specified in you Application's Code Signing Entitlements file are invalid, not permitted, or do not match those specified in you provisioning profile.
```

This is caused by the new `Xcode 10` build system, as documented in this [cordova-ios issue](https://github.com/apache/cordova-ios/issues/407), including these recommended workarounds:

- Including the `--buildFlag="-UseModernBuildSystem=0"` flag in the `build` and `run` commands:

  ```bash
  % cordova run ios --buildFlag='-UseModernBuildSystem=0'
  % cordova build ios --buildFlag='-UseModernBuildSystem=0'
  ```

- Adding the flag under the iOS release or debug config when using a `build.json` config file:

  ```json
  "buildFlag": [
    "-UseModernBuildSystem=0"
  ]
  ```

- Changing the build system to the "Legacy Build System" when building from the Xcode IDE:
  1. In the Xcode "File Menu", select "Project Settings...";
  1. In the "Project Settings..." window, inside the "Per-User Project Settings:" area, change the "Build System:" setting to "Legacy Build System".

# nodejs-mobile-cordova plugin test application

This is a Cordova application designed to run the [Node.js for Mobile Apps Cordova plugin tests](../tests).

It consists of an initial screen to test starting the "nodejs-mobile" engine before passing to the [cordova-plugin-test-framework](https://github.com/apache/cordova-plugin-test-framework) compatible tests defined inside the plugin, but with a lighter UI.

## Installation and running

These instructions assume you are already able to install and run a Cordova application using the [Node.js for Mobile Apps Cordova plugin](../) on the current system.

### Clone this repo

```sh
git clone https://github.com/janeasystems/nodejs-mobile-cordova
```

### Install the cordova platforms and plugins

Start by installing the npm dependencies:
```sh
cd nodejs-mobile-cordova/testapp
npm install
```

Use the helper script to copy the "nodejs-mobile-cordova" plugin code that's in the parent directory to `testapp/temp-module-copy`, so cordova can install it:
```sh
npm run copy-module
```

Instruct the Cordova client to fetch and add every needed platform and plugin:
```sh
cordova prepare
```

### Run on iOS

Running the test application works like running a regular Cordova application. Here's an example:

```sh
cordova prepare ios
```

You can then open `platforms/ios/CordovaTestApp.xcodeproj` in Xcode, configure the application's signing in `General/Signing`, select the target device and run the application.

### Run on Android

Running the test application works like running a regular Cordova application. As an example, with the target device connected to the development machine, run the following:

```sh
cordova run android
```

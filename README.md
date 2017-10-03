# Node.js for Mobile Apps Cordova plugin

## Installation

```bash
cordova plugin add nodejs-mobile-cordova
```

## Requirements

 - Cordova 7.0.0 or higher
 - for iOS apps: iOS 11 or higher

## Supported Platforms

- Android (ARMv7a, x86)
- iOS (ARM64)

## Reporting Issues

We have a [central repo](https://github.com/janeasystems/nodejs-mobile/issues) where we manage all the issues related to Node.js for Mobile Apps, including specific issues of the Node.js for Mobile Cordova plugin.
So please, open the issue [there](https://github.com/janeasystems/nodejs-mobile/issues).

## Cordova Methods

- `nodejs.start`
- `nodejs.startWithScript`
- `nodejs.channel.setListener`
- `nodejs.channel.send`


### nodejs.start

```js
  nodejs.start(scriptFileName, callback);
```

### nodejs.startWithScript

```js
  nodejs.startWithScript(scriptBody, callback);
```

### nodejs.channel.setListener

```js
  nodejs.channel.setListener(listenerCallback);
```

### nodejs.channel.send

```js
  nodejs.channel.send(message);
```

## Node.js Methods

```js
  var cordova = require('cordova-bridge');
```

- `cordova.channel.send`
- `cordova.channel.on`

### cordova.channel.send

```
 cordova.channel.send(message);
```

### cordova.channel.on

```
 cordova.channel.on('message', listnerCallback);
```


## Usage

This is an example to build an iOS app.  
In macOS, using `Terminal`:
```
 cordova create MyApp
 cd MyApp
 cordova platform add ios
 cordova plugin add nodejs-mobile-cordova
 cordova plugin add cordova-plugin-console
```
Copy the sample project files, you will be asked to overwrite the default `./www/js/index.js` file.
```
 plugins/nodejs-mobile-cordova/install/sample-project/copy-sample-project.sh
 overwrite www/js/index.js? (y/n [n]) y
```
Open the Cordova app project in Xcode:
```
 open platforms/ios/HelloCordova.xcodeproj
```
Switch to Xcode:  
 * select HelloCordova to view the project settings  
 * in the `General` settings:  
    * in the `Signing` section select a team to sign the app  
    * in `Deployment Info` section select `Deployment Targert` `11.0` or higher  
 
Go back to `Terminal` to build the Cordova app 
```
 cordova build ios --device
```
Switch to Xcode:
 * select a target device for the project
 * run the project
 * enlarge the `Console` area, at the end of the console log it should show:

```
2017-10-02 18:49:18.606100+0200 HelloCordova[2182:1463518] NodeJs Engine Started
[node] received: Hello from Cordova!
2017-10-02 18:49:18.690132+0200 HelloCordova[2182:1463518] [cordova] received: Replying to this message: Hello from Cordova!
```


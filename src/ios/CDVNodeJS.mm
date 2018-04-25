/*
  Node.js for Mobile Apps Cordova plugin.

  Implements the plugin APIs exposed to the Cordova layer and routes messages
  between the Cordova layer and the Node.js engine.
 */

#import <Cordova/CDV.h>
#import "CDVNodeJS.hh"
#import "NodeJSRunner.hh"
#import <NodeMobile/NodeMobile.h>
#import "cordova-bridge.h"

#ifdef DEBUG
  #define LOG_FN NSLog(@"%s", __PRETTY_FUNCTION__);
#else
  #define LOG_FN
#endif

static CDVNodeJS* activeInstance = nil;

const char* SYSTEM_CHANNEL = "_SYSTEM_";

@implementation CDVNodeJS

/**
 * A method that can be called from the C++ Node native module (i.e. cordova-bridge.ccp).
 */
void sendMessageToApplication(const char* channelName, const char* msg) {

  NSString* channelNameNS = [NSString stringWithUTF8String:channelName];
  NSString* msgNS = [NSString stringWithUTF8String:msg];

  if ([channelNameNS isEqualToString:[NSString stringWithUTF8String:SYSTEM_CHANNEL]]) {
    // If it's a system channel call, handle it in the plugin native side.
    handleAppChannelMessage(msgNS);
  } else {
    // Otherwise, send it to Cordova.
    sendMessageToCordova(channelNameNS,msgNS);
  }

}

void sendMessageToCordova(NSString* channelName, NSString* msg) {
  NSMutableArray* arguments = [NSMutableArray array];
  [arguments addObject: channelName];
  [arguments addObject: msg];

  CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:arguments];
  [pluginResult setKeepCallbackAsBool:TRUE];
  [activeInstance.commandDelegate sendPluginResult:pluginResult callbackId:activeInstance.allChannelsListenerCallbackId];
}

void handleAppChannelMessage(NSString* msg) {
  if([msg hasPrefix:@"release-pause-event"]) {
    // The nodejs runtime has signaled it has finished handling a pause event.
    NSArray *eventArguments = [msg componentsSeparatedByString:@"|"];
    // The expected format for this message is "release-pause-event|{eventId}"
    if (eventArguments.count >=2) {
      // Release the received eventId.
      [activeInstance ReleasePauseEvent:eventArguments[1]];
    }
  } else if ([msg isEqualToString:@"ready-for-app-events"]) {
    // The nodejs runtime is ready for APP events.
    nodeIsReadyForAppEvents = true;
  }
}

// The callback id of the Cordova channel listener
NSString* allChannelsListenerCallbackId = nil;

+ (CDVNodeJS*) activeInstance {
  return activeInstance;
}

- (void) pluginInitialize {
  LOG_FN

  NSString* const NODE_PATH = @"NODE_PATH";
  NSString* const BUILTIN_MODULES = @"/www/nodejs-mobile-cordova-assets/builtin_modules";
  NSString* const NODE_ROOT = @"/www/nodejs-project/";

  // The 'onAppTerminate', 'onReset' and 'onMemoryWarning' events are already
  // registered in the super class while 'onPause' and 'onResume' are not.
  [[NSNotificationCenter defaultCenter] addObserver:self
                                        selector:@selector(onPause)
                                        name:UIApplicationDidEnterBackgroundNotification object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                        selector:@selector(onResume)
                                        name:UIApplicationWillEnterForegroundNotification object:nil];

  RegisterBridgeCallback(sendMessageToApplication);

  // Register the Documents Directory as the node dataDir.
  NSString* nodeDataDir = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];
  RegisterNodeDataDirPath([nodeDataDir UTF8String]);

  NSString* nodePath = [[NSProcessInfo processInfo] environment][NODE_PATH];
  NSString* appPath = [[NSBundle mainBundle] bundlePath];
  NSString* builtinModulesPath = [appPath stringByAppendingString:BUILTIN_MODULES];
  NSString* nodeRootPath = [appPath stringByAppendingString:NODE_ROOT];

  if (nodePath == NULL) {
    nodePath = builtinModulesPath;
  } else {
    nodePath = [nodePath stringByAppendingString:@":"];
    nodePath = [nodePath stringByAppendingString:builtinModulesPath];
  }
  nodePath = [nodePath stringByAppendingString:@":"];
  nodePath = [nodePath stringByAppendingString:nodeRootPath];

  setenv([NODE_PATH UTF8String], (const char*)[nodePath UTF8String], 1);

  activeInstance = self;
}

/**
 * Handlers for pre-registered events:
 * - onAppTerminate
 * - onMemoryWarning
 * - onReset
 */

- (void) onAppTerminate {
  LOG_FN
}

- (void) onMemoryWarning {
  LOG_FN
}

- (void) onReset {
  LOG_FN
}

// Flag to indicate if node is ready to receive app events.
bool nodeIsReadyForAppEvents = false;

// Condition to wait on pause event handling on the node side.
NSCondition *appEventBeingProcessedCondition = [[NSCondition alloc] init];

// Set to keep ids for called pause events, so they can be unlocked later.
NSMutableSet* appPauseEventsManagerSet = [[NSMutableSet alloc] init];

// Lock to manipulate the App Pause Events Manager Set.
id appPauseEventsManagerSetLock = [[NSObject alloc] init];

/**
 * Handlers for events registered by the plugin:
 * - onPause
 * - onResume
 */

- (void) onPause {
  LOG_FN
  if(nodeIsReadyForAppEvents) {
    UIApplication *application = [UIApplication sharedApplication];
    // Inform the app intends do run something in the background.
    // In this case we'll try to wait for the pause event to be properly taken care of by node.
    __block UIBackgroundTaskIdentifier backgroundWaitForPauseHandlerTask =
      [application beginBackgroundTaskWithExpirationHandler: ^ {
        // Expiration handler to avoid app crashes if the task doesn't end in the iOS allowed background duration time.
        [application endBackgroundTask: backgroundWaitForPauseHandlerTask];
        backgroundWaitForPauseHandlerTask = UIBackgroundTaskInvalid;
      }];

    NSTimeInterval intendedMaxDuration = [application backgroundTimeRemaining]+1;
    // Calls the event in a background thread, to let this UIApplicationDidEnterBackgroundNotification
    // return as soon as possible.
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      NSDate * targetMaximumFinishTime = [[NSDate date] dateByAddingTimeInterval:intendedMaxDuration];
      // We should block the thread at most until a bit (1 second) after the maximum allowed background time.
      // The background task will be ended by the expiration handler, anyway.
      // SendPauseEventAndWaitForRelease won't return until the node runtime notifies it has finished its pause event (or the target time is reached).
      [self SendPauseEventAndWaitForRelease:targetMaximumFinishTime];
      // After SendPauseEventToNodeChannel returns, clean up the background task and let the Application enter the suspended state.
      [application endBackgroundTask: backgroundWaitForPauseHandlerTask];
      backgroundWaitForPauseHandlerTask = UIBackgroundTaskInvalid;
    });
  }
}

- (void) onResume {
  LOG_FN
  if(nodeIsReadyForAppEvents) {
    SendMessageToNodeChannel(SYSTEM_CHANNEL, "resume");
  }
}

// Sends the pause event to the node runtime and returns only after node signals
// the event has been handled explicitely or the background time is running out.
- (void) SendPauseEventAndWaitForRelease:(NSDate*)expectedFinishTime {
  // Get unique identifier for this pause event.
  NSString * eventId = [[NSUUID UUID] UUIDString];
  // Create the pause event message with the id.
  NSString * event = [NSString stringWithFormat:@"pause|%@", eventId];

  [appEventBeingProcessedCondition lock];

  @synchronized(appPauseEventsManagerSetLock) {
    [appPauseEventsManagerSet addObject:eventId];
  }

  SendMessageToNodeChannel(SYSTEM_CHANNEL, (const char*)[event UTF8String]);

  while (YES) {
    // Looping to avoid unintended spurious wake ups.
    @synchronized(appPauseEventsManagerSetLock) {
      if(![appPauseEventsManagerSet containsObject:eventId]) {
        // The Id for this event has been released.
        break;
      }
    }
    if([expectedFinishTime timeIntervalSinceNow] <= 0) {
      // We blocked the background thread long enough.
      break;
    }
    [appEventBeingProcessedCondition waitUntilDate:expectedFinishTime];
  }
  [appEventBeingProcessedCondition unlock];

  @synchronized(appPauseEventsManagerSetLock) {
    [appPauseEventsManagerSet removeObject:eventId];
  }
}

// Signals the pause event has been handled by the node side.
- (void) ReleasePauseEvent:(NSString*)eventId {
  [appEventBeingProcessedCondition lock];
  @synchronized(appPauseEventsManagerSetLock) {
    [appPauseEventsManagerSet removeObject:eventId];
  }
  [appEventBeingProcessedCondition broadcast];
  [appEventBeingProcessedCondition unlock];
}

/**
 * Methods available to be called by the Cordova layer using 'cordova.exec'.
 */

- (void) setAllChannelsListener:(CDVInvokedUrlCommand*)command
{
  LOG_FN
  self.allChannelsListenerCallbackId = command.callbackId;
}

- (void) sendMessageToNode:(CDVInvokedUrlCommand*)command {
  NSString* channelName = [command argumentAtIndex:0];
  NSString* msg = [command argumentAtIndex:1];
  // Call the Node bridge API
  SendMessageToNodeChannel((const char*)[channelName UTF8String], (const char*)[msg UTF8String]);
}

- (void) startEngine:(CDVInvokedUrlCommand*)command {
  LOG_FN

  NSString* errorMsg = nil;
  NSString* scriptPath = nil;
  CDVPluginResult* pluginResult = nil;
  NSString* scriptFileName = [command argumentAtIndex:0];
  NSDictionary* options = [command argumentAtIndex:1];

#ifdef DEBUG
  for (id key in [options allKeys]) {
    NSLog(@"Start engine option: %@ -> %@", key, [options objectForKey:key]);
  }
#endif

  if ([scriptFileName length] == 0) {
    errorMsg = @"Arg was null";
  } else {
    NSString* appPath = [[NSBundle mainBundle] bundlePath];
    scriptPath = [appPath stringByAppendingString:@"/www/nodejs-project/"];
    scriptPath = [scriptPath stringByAppendingString:scriptFileName];
    if ([[NSFileManager defaultManager] fileExistsAtPath:scriptPath] == FALSE) {
      errorMsg = @"File not found";
      NSLog(@"%@: %@", errorMsg, scriptPath);
    }
  }

  if (errorMsg == nil) {
    NSArray* arguments = [NSArray arrayWithObjects:
                          @"node",
                          scriptPath,
                          nil
                        ];

    [NodeJSRunner startEngineWithArguments:arguments];
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@""];
  } else {
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:errorMsg];
  }
  [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) startEngineWithScript:(CDVInvokedUrlCommand*)command {
  LOG_FN

  NSString* errorMsg = nil;
  CDVPluginResult* pluginResult = nil;
  NSString* scriptBody = [command argumentAtIndex:0];
  NSDictionary* options = [command argumentAtIndex:1];

#ifdef DEBUG
  for (id key in [options allKeys]) {
    NSLog(@"Start engine option: %@ -> %@", key, [options objectForKey:key]);
  }
#endif

  if ([scriptBody length] == 0) {
    errorMsg = @"Script is empty";
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:errorMsg];
  } else {
    NSArray* arguments = [NSArray arrayWithObjects:
                          @"node",
                          @"-e",
                          scriptBody,
                          nil
                        ];

    [NodeJSRunner startEngineWithArguments:arguments];
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@""];
  }
  [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

@end

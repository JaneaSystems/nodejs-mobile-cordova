#import <Cordova/CDVPlugin.h>

@interface CDVNodeJS : CDVPlugin
{}

@property NSString* messageListenerCallbackId;

+ (CDVNodeJS*) activeInstance;

- (void) setChannelListener:(CDVInvokedUrlCommand*)command;

- (void) sendMessageToNode:(CDVInvokedUrlCommand*)command;

- (void) startEngine:(CDVInvokedUrlCommand*)command;

- (void) startEngineWithScript:(CDVInvokedUrlCommand*)command;

@end

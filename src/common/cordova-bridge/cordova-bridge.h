/*
  Node.js for Mobile Apps Cordova plugin.

  The bridge APIs between the Cordova plugin and the Node.js engine.
 */

#ifndef CORDOVA_BRIDGE_H_
#define CORDOVA_BRIDGE_H_

typedef void (*t_bridge_callback)(const char* channelName, const char* message);
void RegisterBridgeCallback(t_bridge_callback);
void SendMessageToNodeChannel(const char* channelName, const char* message);
void RegisterNodeDataDirPath(const char* path);

#endif

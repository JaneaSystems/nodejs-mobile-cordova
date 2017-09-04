#ifndef CORDOVA_BRIDGE_H_
#define CORDOVA_BRIDGE_H_

typedef void (*t_bridge_callback)(char* arg);
void RegisterBridgeCallback(t_bridge_callback);
void SendToBridge(const char *message);

#endif

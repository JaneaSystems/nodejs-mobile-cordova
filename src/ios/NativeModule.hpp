#ifndef NativeModule_hpp
#define NativeModule_hpp

typedef void (*t_bridge_callback)(const char* arg);
void RegisterBridgeCallback(t_bridge_callback);
void SendToNode(const char* msg);

#endif /* NativeModule_hpp */

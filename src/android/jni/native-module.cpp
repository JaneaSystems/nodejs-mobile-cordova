#include <jni.h>
#include <string>
#include <stdlib.h>
#include <cstdlib>

#include "include/node/node.h"
#include "cordova-bridge.h"

#include <stdio.h>
#include <stdarg.h>
#include <android/log.h>
#define warn_console(...) __android_log_print(ANDROID_LOG_WARN, "JNI", __VA_ARGS__)

// cache the environment variable for the thread running node to call into java
JNIEnv* cacheEnvPointer = NULL;

extern "C"
JNIEXPORT void JNICALL
Java_com_janeasystems_cdvnodejsmobile_NodeJS_sendToNode(
        JNIEnv *env,
        jobject /* this */,
        jstring msg) {
    const char* nativeMessage = env->GetStringUTFChars(msg, 0);
    SendToBridge(nativeMessage);
    env->ReleaseStringUTFChars(msg, nativeMessage);
}

extern "C" int callintoNode(int argc, char *argv[])
{
    const int exit_code = node::Start(argc,argv);
    return exit_code;
}

#if defined(__arm__)
    #define CURRENT_ABI_NAME "armeabi-v7a"
#elif defined(__aarch64__)
    #define CURRENT_ABI_NAME "arm64-v8a"
#elif defined(__i386__)
    #define CURRENT_ABI_NAME "x86"
#elif defined(__x86_64__)
    #define CURRENT_ABI_NAME "x86_64"
#else
    #error "Trying to compile for an unknown ABI."
#endif

extern "C"
JNIEXPORT jstring JNICALL
Java_com_janeasystems_cdvnodejsmobile_NodeJS_getCurrentABIName(
    JNIEnv *env,
    jobject /* this */) {
    return env->NewStringUTF(CURRENT_ABI_NAME);
}

#define APPNAME "CORDOVABRIDGE"

void rcv_message_from_node(char* msg) {
  JNIEnv *env = cacheEnvPointer;
  if (!env) {
      return;
  }
  // Try to find the class
  jclass cls2 = env->FindClass("com/janeasystems/cdvnodejsmobile/NodeJS");
  if (cls2 != nullptr) {
    // Find method
    jmethodID m_sendMessage = env->GetStaticMethodID(cls2, "sendMessageToCordova", "(Ljava/lang/String;)V");
    if (m_sendMessage != nullptr) {
        jstring java_msg=env->NewStringUTF(msg);
        // Call method
        env->CallStaticVoidMethod(cls2, m_sendMessage, java_msg);
    }
  }
}

//node's libUV requires all arguments being on contiguous memory.
extern "C" jint JNICALL
Java_com_janeasystems_cdvnodejsmobile_NodeJS_startNodeWithArguments(
        JNIEnv *env,
        jobject /* this */,
        jobjectArray arguments,
        jstring nodePath) {

    const char* path_path = env->GetStringUTFChars(nodePath, 0);
    setenv("NODE_PATH", path_path, 1);
    env->ReleaseStringUTFChars(nodePath, path_path);

    // argc
    jsize argument_count = env->GetArrayLength(arguments);

    // Compute byte size need for all arguments in contiguous memory.
    int c_arguments_size = 0;
    for (int i = 0; i < argument_count ; i++) {
        c_arguments_size += strlen(env->GetStringUTFChars((jstring)env->GetObjectArrayElement(arguments, i), 0));
        c_arguments_size++; // for '\0'
    }

    // Stores arguments in contiguous memory.
    char* args_buffer = (char*)calloc(c_arguments_size, sizeof(char));

    // argv to pass into node.
    char* argv[argument_count];

    // To iterate through the expected start position of each argument in args_buffer.
    char* current_args_position = args_buffer;

    // Populate the args_buffer and argv.
    for (int i = 0; i < argument_count ; i++)
    {
        const char* current_argument = env->GetStringUTFChars((jstring)env->GetObjectArrayElement(arguments, i), 0);

        // Copy current argument to its expected position in args_buffer
        strncpy(current_args_position, current_argument, strlen(current_argument));

        // Save current argument start position in argv
        argv[i] = current_args_position;

        // Increment to the next argument's expected position.
        current_args_position += strlen(current_args_position)+1;
    }

    RegisterBridgeCallback(&rcv_message_from_node);

    cacheEnvPointer = env;

    // Start node, with argc and argv.
    return jint(callintoNode(argument_count, argv));
}

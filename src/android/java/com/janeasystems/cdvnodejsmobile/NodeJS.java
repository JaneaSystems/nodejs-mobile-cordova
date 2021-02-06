/*
  Node.js for Mobile Apps Cordova plugin.

  Implements the plugin APIs exposed to the Cordova layer and routes messages
  between the Cordova layer and the Node.js engine.
 */

package com.janeasystems.cdvnodejsmobile;

import org.apache.cordova.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;

import android.util.Log;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.res.AssetManager;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.SharedPreferences;
import android.system.Os;
import android.system.ErrnoException;

import java.io.*;
import java.lang.System;
import java.util.*;
import java.util.concurrent.Semaphore;

import org.zeroturnaround.zip.ZipUtil;
import org.zeroturnaround.zip.commons.FileUtils;

public class NodeJS extends CordovaPlugin {

  private static Activity activity = null;
  private static Context context = null;
  private static AssetManager assetManager = null;

  private static String filesDir;
  private static final String PROJECT_ROOT = "www/nodejs-project";
  private static final String PROJECT_ROOT_MODULES = "www/nodejs-project/node_modules";
  private static final String BUILTIN_ASSETS = "nodejs-mobile-cordova-assets";
  private static final String BUILTIN_MODULES = "nodejs-mobile-cordova-assets/builtin_modules";
  private static final String TRASH_DIR = "nodejs-project-trash";
  private static final String BUILTIN_NATIVE_ASSETS_PREFIX = "nodejs-native-assets-";
  private static String nodeAppRootAbsolutePath = "";
  private static String nodePath = "";
  private static String trashDir = "";
  private static String nativeAssetsPath = "";

  private static final String SHARED_PREFS = "NODEJS_MOBILE_PREFS";
  private static final String LAST_UPDATED_TIME = "NODEJS_MOBILE_APK_LastUpdateTime";
  private static final String FORCE_RESET = "NODEJS_MOBILE_RESET";
  private long lastUpdateTime = 1;
  private long previousLastUpdateTime = 0;

  private static Semaphore initSemaphore = new Semaphore(1);
  private static boolean initCompleted = false;
  private static IOException ioe = null;

  private static String LOGTAG = "NODEJS-CORDOVA";
  private static String SYSTEM_CHANNEL = "_SYSTEM_";

  private static boolean engineAlreadyStarted = false;

  private static CallbackContext allChannelListenerContext = null;

  private static final Object onlyOneEngineStartingAtATimeLock = new Object();

  // Flag to indicate if node is ready to receive app events.
  private static boolean nodeIsReadyForAppEvents = false;

  static {
    System.loadLibrary("nodejs-mobile-cordova-native-lib");
    System.loadLibrary("node");
  }

  public native Integer startNodeWithArguments(String[] arguments, String nodePath, boolean redirectOutputToLogcat);
  public native void sendMessageToNodeChannel(String channelName, String msg);
  public native void registerNodeDataDirPath(String dataDir);
  public native String getCurrentABIName();

  @Override
  public void pluginInitialize() {
    Log.d(LOGTAG, "pluginInitialize");

    activity = cordova.getActivity();
    context = activity.getBaseContext();
    assetManager = activity.getBaseContext().getAssets();

    // Sets the TMPDIR environment to the cacheDir, to be used in Node as os.tmpdir
    try {
      Os.setenv("TMPDIR", context.getCacheDir().getAbsolutePath(),true);
    } catch (ErrnoException e) {
      e.printStackTrace();
    }
    filesDir = context.getFilesDir().getAbsolutePath();

    // Register the filesDir as the Node data dir.
    registerNodeDataDirPath(filesDir);

    nodeAppRootAbsolutePath = filesDir + "/" + PROJECT_ROOT;
    nodePath = nodeAppRootAbsolutePath + ":" + filesDir + "/" + BUILTIN_MODULES;
    trashDir = filesDir + "/" + TRASH_DIR;
    nativeAssetsPath = BUILTIN_NATIVE_ASSETS_PREFIX + getCurrentABIName();

    asyncInit();
  }

  private void asyncInit() {
    if (wasAPKUpdated() || isReset()) {
      try {
        initSemaphore.acquire();
        new Thread(new Runnable() {
          @Override
          public void run() {
            emptyTrash();
            try {
              copyNodeJSAssets();
              initCompleted = true;
            } catch (IOException e) {
              ioe = e;
              Log.e(LOGTAG, "Node assets copy failed: " + e.toString());
              e.printStackTrace();
            }
            initSemaphore.release();
            emptyTrash();
          }
        }).start();
      } catch (InterruptedException ie) {
        initSemaphore.release();
        ie.printStackTrace();
      }
    } else {
      initCompleted = true;
    }
  }

  @Override
  public boolean execute(String action, JSONArray data, CallbackContext callbackContext) throws JSONException {
    if (action.equals("sendMessageToNode")) {
      String channelName = data.getString(0);
      String msg = data.getString(1);
      this.sendMessageToNode(channelName, msg);
    } else if (action.equals("setAllChannelsListener")) {
      this.setAllChannelsListener(callbackContext);
    } else if (action.equals("startEngine")) {
      String target = data.getString(0);
      JSONObject startOptions = data.getJSONObject(1);
      this.startEngine(target, startOptions, callbackContext);
    } else if (action.equals("startEngineWithScript")) {
      String scriptBody = data.getString(0);
      JSONObject startOptions = data.getJSONObject(1);
      this.startEngineWithScript(scriptBody, startOptions, callbackContext);
    } else if (action.equals("reset")) {
      this.setReset();
    } else {
      Log.e(LOGTAG, "Invalid action: " + action);
      return false;
    }

    return true;
  }

  @Override
  public void onPause(boolean multitasking) {
    super.onPause(multitasking);
    Log.d(LOGTAG, "onPause");
    if (nodeIsReadyForAppEvents) {
      sendMessageToNodeChannel(SYSTEM_CHANNEL, "pause");
    }
  }

  @Override
  public void onResume(boolean multitasking) {
    super.onResume(multitasking);
    Log.d(LOGTAG, "onResume");
    if (nodeIsReadyForAppEvents) {
      sendMessageToNodeChannel(SYSTEM_CHANNEL, "resume");
    }
  }

  private boolean sendMessageToNode(String channelName, String msg) {
    sendMessageToNodeChannel(channelName, msg);
    return true;
  }

  public static void sendMessageToApplication(String channelName, String msg) {
    if (channelName.equals(SYSTEM_CHANNEL)) {
      // If it's a system channel call, handle it in the plugin native side.
      handleAppChannelMessage(msg);
    } else {
      // Otherwise, send it to Cordova.
      sendMessageToCordova(channelName, msg);
    }
  }

  public static void sendMessageToCordova(String channelName, String msg) {
    final String channel = new String(channelName);
    final String message = new String(msg);
    NodeJS.activity.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        JSONArray args = new JSONArray();
        args.put(channel);
        args.put(message);
        PluginResult pluginResult = new PluginResult(PluginResult.Status.OK, args);
        pluginResult.setKeepCallback(true);
        NodeJS.allChannelListenerContext.sendPluginResult(pluginResult);
      }
    });
  }

  public static void handleAppChannelMessage(String msg) {
    if (msg.equals("ready-for-app-events")) {
      nodeIsReadyForAppEvents=true;
    }
  }

  private boolean setAllChannelsListener(final CallbackContext callbackContext) {
    Log.v(LOGTAG, "setAllChannelsListener");
    NodeJS.allChannelListenerContext = callbackContext;
    return true;
  }

  private void startEngine(final String scriptFileName, final JSONObject startOptions,
                           final CallbackContext callbackContext) {
    Log.d(LOGTAG, "StartEngine: " + scriptFileName);

    if (NodeJS.engineAlreadyStarted == true) {
      sendResult(false, "Engine already started", callbackContext);
      return;
    }

    if (scriptFileName == null || scriptFileName.isEmpty()) {
      sendResult(false, "Invalid filename", callbackContext);
      return;
    }

    final String scriptFileAbsolutePath = new String(NodeJS.nodeAppRootAbsolutePath + "/" + scriptFileName);
    Log.d(LOGTAG, "Script absolute path: " + scriptFileAbsolutePath);

    final boolean redirectOutputToLogcat = getOptionRedirectOutputToLogcat(startOptions);

    new Thread(new Runnable() {
      @Override
      public void run() {
        waitForInit();

        if (ioe != null) {
          sendResult(false, "Initialization failed: " + ioe.toString(), callbackContext);
          return;
        }

        synchronized(onlyOneEngineStartingAtATimeLock) {
          if (NodeJS.engineAlreadyStarted == true) {
            sendResult(false, "Engine already started", callbackContext);
            return;
          }
          File fileObject = new File(scriptFileAbsolutePath);
          if (!fileObject.exists()) {
            sendResult(false, "File not found", callbackContext);
            return;
          }
          NodeJS.engineAlreadyStarted = true;
        }

        sendResult(true, "", callbackContext);

        startNodeWithArguments(
            new String[]{"node", scriptFileAbsolutePath},
            NodeJS.nodePath,
            redirectOutputToLogcat);
      }
    }).start();
  }

  private void startEngineWithScript(final String scriptBody, final JSONObject startOptions,
                                        final CallbackContext callbackContext) {
    Log.d(LOGTAG, "StartEngineWithScript: " + scriptBody);

    if (NodeJS.engineAlreadyStarted == true) {
      sendResult(false, "Engine already started", callbackContext);
      return;
    }

    if (scriptBody == null || scriptBody.isEmpty()) {
      sendResult(false, "Script is empty", callbackContext);
      return;
    }

    final boolean redirectOutputToLogcat = getOptionRedirectOutputToLogcat(startOptions);
    final String scriptBodyToRun = new String(scriptBody);

    new Thread(new Runnable() {
      @Override
      public void run() {
        waitForInit();

        if (ioe != null) {
          sendResult(false, "Initialization failed: " + ioe.toString(), callbackContext);
          return;
        }

        synchronized(onlyOneEngineStartingAtATimeLock) {
          if (NodeJS.engineAlreadyStarted == true) {
            sendResult(false, "Engine already started", callbackContext);
            return;
          }
          NodeJS.engineAlreadyStarted = true;
        }

        sendResult(true, "", callbackContext);

        startNodeWithArguments(
            new String[]{"node", "-e", scriptBodyToRun},
            NodeJS.nodePath,
            redirectOutputToLogcat);
      }
    }).start();
  }

  /**
   * Sends a callback result to Cordova
   */
  private void sendResult(boolean result, final String errorMsg, final CallbackContext callbackContext) {
    if (result) {
      sendSuccess(callbackContext);
    } else {
      sendFailure(errorMsg, callbackContext);
    }
  }

  private void sendSuccess(final CallbackContext callbackContext) {
    cordova.getActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        callbackContext.success();
      }
    });
  }

  private void sendFailure(final String errorMsg, final CallbackContext callbackContext) {
    cordova.getActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        callbackContext.error(errorMsg);
      }
    });
  }

  /**
   * Private assets helpers
   */

  private void waitForInit() {
    if (!initCompleted) {
      try {
        initSemaphore.acquire();
        initSemaphore.release();
      } catch (InterruptedException ie) {
        initSemaphore.release();
        ie.printStackTrace();
      }
    }
  }

  private boolean isEmptyNodeModules(){
    File nodejsModulesFolder = new File(NodeJS.filesDir + "/" + PROJECT_ROOT_MODULES);
    return !nodejsModulesFolder.exists();
  }

  private void setReset() {
    SharedPreferences prefs = context.getSharedPreferences(SHARED_PREFS, Context.MODE_PRIVATE);
    SharedPreferences.Editor editor = prefs.edit();
    editor.putBoolean(FORCE_RESET, true);
    editor.commit();
    doColdRestart();
  }

  private void clearReset() {
    SharedPreferences prefs = context.getSharedPreferences(SHARED_PREFS, Context.MODE_PRIVATE);
    SharedPreferences.Editor editor = prefs.edit();
    editor.remove(FORCE_RESET);
    editor.commit();
  }

  private boolean isReset() {
    SharedPreferences prefs = context.getSharedPreferences(SHARED_PREFS, Context.MODE_PRIVATE);
    boolean result = prefs.getBoolean(FORCE_RESET, false);
    clearReset();
    return result;
  }

  private boolean wasAPKUpdated() {
    SharedPreferences prefs = context.getSharedPreferences(SHARED_PREFS, Context.MODE_PRIVATE);
    this.previousLastUpdateTime = prefs.getLong(LAST_UPDATED_TIME, 0);

    try {
      PackageInfo packageInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
      this.lastUpdateTime = packageInfo.lastUpdateTime;
    } catch (PackageManager.NameNotFoundException e) {
      e.printStackTrace();
    }
    return (this.lastUpdateTime != this.previousLastUpdateTime);
  }

  private void saveLastUpdateTime() {
    SharedPreferences prefs = context.getSharedPreferences(SHARED_PREFS, Context.MODE_PRIVATE);
    SharedPreferences.Editor editor = prefs.edit();
    editor.putLong(LAST_UPDATED_TIME, this.lastUpdateTime);
    editor.commit();
  }

  private void emptyTrash() {
    File trash = new File(NodeJS.trashDir);
    if (trash.exists()) {
      deleteFolderRecursively(trash);
    }
  }

  private void copyNativeAssets() throws IOException {
    // Load the additional asset folders and files lists
    ArrayList<String> nativeDirs = readFileFromAssets(nativeAssetsPath + "/dir.list");
    ArrayList<String> nativeFiles = readFileFromAssets(nativeAssetsPath + "/file.list");

    // Copy additional asset files to project working folder
    if (nativeFiles.size() > 0) {
      Log.d(LOGTAG, "Building folder hierarchy for " + nativeAssetsPath);
      for (String dir : nativeDirs) {
        new File(nodeAppRootAbsolutePath + "/" + dir).mkdirs();
      }
      Log.d(LOGTAG, "Copying assets using file list for " + nativeAssetsPath);
      for (String file : nativeFiles) {
        String src = nativeAssetsPath + "/" + file;
        String dest = nodeAppRootAbsolutePath + "/" + file;
        copyAssetFile(src, dest);
      }
    } else {
      Log.d(LOGTAG, "No assets to copy from " + nativeAssetsPath);
    }
  }

  private void copyNodeJSAssets() throws IOException {
    // Delete the existing plugin assets in the working folder
    File nodejsBuiltinModulesFolder = new File(NodeJS.filesDir + "/" + BUILTIN_ASSETS);
    if (nodejsBuiltinModulesFolder.exists()) {
      deleteFolderRecursively(nodejsBuiltinModulesFolder);
    }
    // Copy the plugin assets from the APK
    copyFolder(BUILTIN_ASSETS);

    // If present, move the existing node project root to the trash
    File nodejsProjectFolder = new File(NodeJS.filesDir + "/" + PROJECT_ROOT);
    if (nodejsProjectFolder.exists()) {
      Log.d(LOGTAG, "Moving existing project folder to trash");
      File trash = new File(NodeJS.trashDir);
      nodejsProjectFolder.renameTo(trash);
    }
    nodejsProjectFolder.mkdirs();

    // Load the nodejs project's folders and files lists
    ArrayList<String> dirs = readFileFromAssets("dir.list");
    ArrayList<String> files = readFileFromAssets("file.list");

    // Copy the node project files to the project working folder
    if (files.size() > 0) {
      Log.d(LOGTAG, "Copying node project assets using the files list");

      for (String dir : dirs) {
        new File(NodeJS.filesDir + "/" + dir).mkdirs();
      }

      for (String file : files) {
        String src = file;
        String dest = NodeJS.filesDir + "/" + file;
        NodeJS.copyAssetFile(src, dest);
      }
    } else {
      Log.d(LOGTAG, "Copying node project assets enumerating the APK assets folder");
      copyFolder(PROJECT_ROOT);
    }
    
    // Copy Custom Node Modules
    copyCustomNodeModules();

    // Copy native modules assets
    copyNativeAssets();

    Log.d(LOGTAG, "Node assets copied");
    saveLastUpdateTime();
  }

  private void copyCustomNodeModules(){
    File srcDir = new File(filesDir, "node_modules.zip");
    if(srcDir.exists()){
        Log.d(LOGTAG, "Custom Node Modules exists.");
        try {
            File nodejsModulesFolder = new File(NodeJS.filesDir + "/" + PROJECT_ROOT_MODULES);
            Log.d(LOGTAG, "Delete current nodejsModules Folder.");
            FileUtils.deleteDirectory(nodejsModulesFolder);
            Log.d(LOGTAG, "Custom Node Modules unpack.");
            ZipUtil.unpack(srcDir, nodejsModulesFolder);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
  }

  private ArrayList<String> readFileFromAssets(String filename){
    ArrayList lines = new ArrayList();
    try {
      BufferedReader reader = new BufferedReader(new InputStreamReader(context.getAssets().open(filename)));
      String line = reader.readLine();
      while (line != null) {
        lines.add(line);
        line = reader.readLine();
      }
      reader.close();
    } catch (FileNotFoundException e) {
      Log.d(LOGTAG, "File not found: " + filename);
    } catch (IOException e) {
      e.printStackTrace();
      lines = new ArrayList();
    }
    return lines;
  }

  private void copyFolder(String srcFolder) throws IOException {
    copyAssetFolder(srcFolder, NodeJS.filesDir + "/" + srcFolder);
  }

  // Adapted from https://stackoverflow.com/a/22903693
  private static void copyAssetFolder(String srcFolder, String destPath) throws IOException {
    String[] files = assetManager.list(srcFolder);
    if (files.length == 0) {
      // Copy the file
      copyAssetFile(srcFolder, destPath);
    } else {
      // Create the folder
      new File(destPath).mkdirs();
      for (String file : files) {
        copyAssetFolder(srcFolder + "/" + file, destPath + "/" + file);
      }
    }
  }

  private static void copyAssetFile(String srcFolder, String destPath) throws IOException {
    InputStream in = assetManager.open(srcFolder);
    new File(destPath).createNewFile();
    OutputStream out = new FileOutputStream(destPath);
    copyFile(in, out);
    in.close();
    in = null;
    out.flush();
    out.close();
    out = null;
  }

  private static void copyFile(InputStream in, OutputStream out) throws IOException {
    byte[] buffer = new byte[1024];
    int read;
    while ((read = in.read(buffer)) != -1) {
      out.write(buffer, 0, read);
    }
  }

  private static void deleteFolderRecursively(File file) {
    try {
      for (File childFile : file.listFiles()) {
        if (childFile.isDirectory()) {
          deleteFolderRecursively(childFile);
        } else {
          childFile.delete();
        }
      }
      file.delete();
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  private static boolean getOptionRedirectOutputToLogcat(final JSONObject startOptions) {
    if (BuildConfig.DEBUG) {
      if (startOptions.names() != null) {
        for (int i = 0; i < startOptions.names().length(); i++) {
          try {
            Log.d(LOGTAG, "Start engine option: " + startOptions.names().getString(i));
          } catch (JSONException e) {
          }
        }
      }
    }

    final String OPTION_NAME = "redirectOutputToLogcat";
    boolean result = true;
    if (startOptions.has(OPTION_NAME) == true) {
      try {
        result = startOptions.getBoolean(OPTION_NAME);
      } catch(JSONException e) {
        e.printStackTrace();
      }
    }
    return result;
  }

  /**
    * Performs a full cold app restart - restarts application
    * https://stackoverflow.com/a/22345538/777265
  */
  protected void doColdRestart() {
      String baseError = "Unable to cold restart application: ";
      try {
          Log.d(LOGTAG, "Cold restarting application");
          Context c = applicationContext;
          //check if the context is given
          if (c != null) {
              //fetch the packagemanager so we can get the default launch activity
              // (you can replace this intent with any other activity if you want
              PackageManager pm = c.getPackageManager();
              //check if we got the PackageManager
              if (pm != null) {
                  //create the intent with the default start activity for your application
                  Intent mStartActivity = pm.getLaunchIntentForPackage(
                          c.getPackageName()
                  );
                  if (mStartActivity != null) {
                      //mStartActivity.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                      //create a pending intent so the application is restarted after System.exit(0) was called.
                      // We use an AlarmManager to call this intent in 100ms
                      // int mPendingIntentId = 223344;
                      // PendingIntent mPendingIntent = PendingIntent
                      //         .getActivity(c, mPendingIntentId, mStartActivity,
                      //                 PendingIntent.FLAG_CANCEL_CURRENT);
                      // AlarmManager mgr = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
                      // mgr.set(AlarmManager.RTC, System.currentTimeMillis() + 100, mPendingIntent);
                      mStartActivity.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);
                      c.getApplicationContext().startActivity(mStartActivity);

                      Log.i(LOGTAG,"Killing application for cold restart");
                      //kill the application
                      System.exit(0);
                  } else {
                    Log.e(LOGTAG, baseError + "StartActivity is null");
                  }
              } else {
                  Log.e(LOGTAG, baseError + "PackageManager is null");
              }
          } else {
              Log.e(LOGTAG, baseError + "Context is null");
          }
      } catch (Exception ex) {
        ex.printStackTrace();
      }
  }
}

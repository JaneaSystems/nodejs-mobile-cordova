package com.janeasystems.cdvnodejsmobile;

import org.apache.cordova.*;
import org.json.JSONArray;
import org.json.JSONException;

import android.util.Log;
import android.app.Activity;
import android.content.Context;
import android.content.res.AssetManager;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.SharedPreferences;

import java.io.*;
import java.lang.System;
import java.util.*;

public class NodeJS extends CordovaPlugin {

  private static Activity activity = null;
  private static AssetManager assetManager = null;

  private static String filesDir;
  private static final String PROJECT_ROOT = "www/nodejs-project";
  private static final String BUILTIN_ASSETS = "nodejs-mobile-cordova-assets";
  private static final String BUILTIN_MODULES = "nodejs-mobile-cordova-assets/builtin_modules";
  private static final String TRASH_DIR = "nodejs-project-trash";
  private static final String BUILTIN_NATIVE_ASSETS_PREFIX = "nodejs-native-assets-";
  private static String nodeAppRootAbsolutePath = "";
  private static String nodePath = "";
  private static String trashDir = "";
  private static String nativeAssetsPath = "";

  private static final String LAST_UPDATED_TIME = "NODEJS_MOBILE_APK_LastUpdateTime";
  private long lastUpdateTime = 1;
  private long previousLastUpdateTime = 0;

  private static boolean appPaused = false;
  private static String LOGTAG = "NodeJS-Cordova";

  private static boolean engineAlreadyStarted = false;

  private static CallbackContext channelListenerContext = null;

  static {
    System.loadLibrary("native-module");
    System.loadLibrary("node");
  }

  public native Integer startNodeWithArguments(String[] arguments, String nodePath);
  public native void sendToNode(String msg);
  public native String getCurrentABIName();

  @Override
  public void pluginInitialize() {
    Log.v(LOGTAG, "pluginInitialize");

    this.activity = cordova.getActivity();
    this.assetManager = activity.getBaseContext().getAssets();

    NodeJS.filesDir = activity.getBaseContext().getFilesDir().getAbsolutePath();
    NodeJS.nodeAppRootAbsolutePath = filesDir + "/" + NodeJS.PROJECT_ROOT;
    NodeJS.nodePath = filesDir + "/" + NodeJS.BUILTIN_MODULES;
    NodeJS.trashDir = filesDir + "/" + NodeJS.TRASH_DIR;
    NodeJS.nativeAssetsPath = BUILTIN_NATIVE_ASSETS_PREFIX + getCurrentABIName();

    getLastUpdateTimes();
    copyAssetsIfRequired();
    emptyTrashAsync();
  }

  @Override
  public boolean execute(String action, JSONArray data, CallbackContext callbackContext) throws JSONException {
    boolean result = false;

    if (action.equals("sendMessageToNode")) {
      String msg = data.getString(0);
      result = this.sendMessageToNode(msg);
    } else if (action.equals("setChannelListener")) {
      result = this.setChannelListener(callbackContext);
    } else if (action.equals("startEngine")) {
      String target = data.getString(0);
      result = this.startEngine(target, callbackContext);
    } else if (action.equals("startEngineWithScript")) {
      String scriptBody = data.getString(0);
      result = this.startEngineWithScript(scriptBody, callbackContext);
    } else {
      Log.e(LOGTAG, "Invalid action: " + action);
      result = false;
    }

    return result;
  }

  @Override
  public void onPause(boolean multitasking) {
    super.onPause(multitasking);
    Log.v(LOGTAG, "onPause");
    // (todo) add call to node land through JNI method
    appPaused = true;
  }

  @Override
  public void onResume(boolean multitasking) {
    super.onResume(multitasking);
    Log.v(LOGTAG, "onResume");
    // (todo) add call to node land through JNI method
    appPaused = false;
  }

  private boolean sendMessageToNode(String msg) {
    Log.v(LOGTAG, "sendMessageToNode: " + msg);

    sendToNode(msg);

    return true;
  }

  public static void sendMessageToCordova(String msg) {
    final String message = new String(msg);
    NodeJS.activity.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        PluginResult pluginResult = new PluginResult(PluginResult.Status.OK, message);
        pluginResult.setKeepCallback(true);
        NodeJS.channelListenerContext.sendPluginResult(pluginResult);
      }
    });
  }

  private boolean setChannelListener(final CallbackContext callbackContext) {
    Log.v(LOGTAG, "setChannelListener");

    NodeJS.channelListenerContext = callbackContext;

    return true;
  }

  private boolean startEngine(String scriptFileName, final CallbackContext callbackContext) {
    Log.v(LOGTAG, "StartEngine: " + scriptFileName);

    if (NodeJS.engineAlreadyStarted == true) {
      sendResult(false, "Engine already started", callbackContext);
      return false;
    }

    if (scriptFileName == null && scriptFileName.isEmpty()) {
      sendResult(false, "Invalid filename", callbackContext);
      return false;
    }

    final String scriptFileAbsolutePath = new String(NodeJS.nodeAppRootAbsolutePath + "/" + scriptFileName);
    File fileObject = new File(scriptFileAbsolutePath);

    if (!fileObject.exists()) {
      sendResult(false, "File not found", callbackContext);
      return false;
    }

    NodeJS.engineAlreadyStarted = true;
    Log.v(LOGTAG, "Script absolute path: " + scriptFileAbsolutePath);
    new Thread(new Runnable() {
      @Override
      public void run() {
        startNodeWithArguments(
                new String[]{"node", scriptFileAbsolutePath},
                NodeJS.nodePath);
      }
    }).start();

    sendResult(true, "", callbackContext);
    return true;
  }

  private boolean startEngineWithScript(String scriptBody, final CallbackContext callbackContext) {
    Log.v(LOGTAG, "StartEngineWithScript: " + scriptBody);
    boolean result = true;
    String errorMsg = "";

    if (NodeJS.engineAlreadyStarted == true) {
      sendResult(false, "Engine already started", callbackContext);
      return false;
    }

    final String scriptBodyToRun = new String(scriptBody);
    Log.v(LOGTAG, "Script absolute path: " + scriptBody);
    new Thread(new Runnable() {
      @Override
      public void run() {
        startNodeWithArguments(
                new String[]{"node", "-e", scriptBodyToRun},
                NodeJS.nodePath);
      }
    }).start();

    NodeJS.engineAlreadyStarted = true;

    sendResult(true, null, callbackContext);
    return true;
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

  private void getLastUpdateTimes() {
    SharedPreferences prefs = this.activity.getPreferences(Context.MODE_PRIVATE);
    this.previousLastUpdateTime = prefs.getLong(LAST_UPDATED_TIME, 0);

    try {
      PackageInfo packageInfo = this.activity.getPackageManager().getPackageInfo(this.activity.getPackageName(), 0);
      this.lastUpdateTime = packageInfo.lastUpdateTime;
    } catch (PackageManager.NameNotFoundException e) {
      Log.e(LOGTAG, e.getMessage());
      e.printStackTrace();
    }
  }

  private void emptyTrashSync() {
    File trash = new File(NodeJS.trashDir);
    if (trash.exists()) {
      Log.v(LOGTAG, "Deleting the trash folder (sync)");
      deleteFolderRecursively(trash);
    }
  }

  private void emptyTrashAsync() {
    File trash = new File(NodeJS.trashDir);
    if (trash.exists()) {
      new Thread(new Runnable() {
        public void run() {
          Log.v(LOGTAG, "Deleting the trash folder (async)");
          File trash = new File(NodeJS.trashDir);
          deleteFolderRecursively(trash);
        }
      }).start();
    }
  }

  private boolean copyNativeAssetsFrom() {
    // Load the additional asset folder and files lists
    ArrayList<String> nativeDirs = readFileFromAssets(nativeAssetsPath + "/dir.list");
    ArrayList<String> nativeFiles = readFileFromAssets(nativeAssetsPath + "/file.list");
    // Copy additional asset files to project working folder
    boolean result = true;
    if (nativeFiles.size() > 0) {
      Log.v(LOGTAG, "Building folder hierarchy for " + nativeAssetsPath);
      for (String dir : nativeDirs) {
        new File(nodeAppRootAbsolutePath + "/" + dir).mkdirs();
      }
      Log.v(LOGTAG, "Copying assets using file list for " + nativeAssetsPath);
      for (String file : nativeFiles) {
        String src = nativeAssetsPath + "/" + file;
        String dest = nodeAppRootAbsolutePath + "/" + file;
        result &= copyAssetFile(src, dest);
      }
    } else {
      Log.v(LOGTAG, "No assets to copy from " + nativeAssetsPath);
    }
    return result;
  }

  private void copyAssetsIfRequired() {
    // The first time the app is executed and everytime the app is updated,
    // the nodejs-mobile assets are copied from the APK to a working folder.
    if (this.lastUpdateTime != this.previousLastUpdateTime) {
      // In case a previous startup went wrong, make sure the trash is cleaned up
      emptyTrashSync();

      File folderObject = new File(NodeJS.filesDir + "/" + PROJECT_ROOT);
      if (folderObject.exists()) {
        Log.v(LOGTAG, "Moving existing project folder to trash");
        File trash = new File(NodeJS.trashDir);
        folderObject.renameTo(trash);
      }

      // Delete the existing plugin assets in the working folder and copy them again from the APK
      folderObject = new File(NodeJS.filesDir + "/" + BUILTIN_ASSETS);
      deleteFolderRecursively(folderObject);
      boolean result = copyFolder(BUILTIN_ASSETS);

      // Load the nodejs project's folder and files lists
      ArrayList<String> dirs = readFileFromAssets("dir.list");
      ArrayList<String> files = readFileFromAssets("file.list");
      // Copy project files to project working folder
      if (dirs.size() > 0 && files.size() > 0) {
        Log.v(LOGTAG, "Building folder hierarchy");
        for (String dir : dirs) {
          new File(NodeJS.filesDir + "/" + dir).mkdirs();
        }

        Log.v(LOGTAG, "Copying assets using file list");
        for (String file : files) {
          String src = file;
          String dest = NodeJS.filesDir + "/" + file;
          NodeJS.copyAssetFile(src, dest);
        }
      } else {
        Log.v(LOGTAG, "Copying assets enumerating the APK assets folder");
        result &= copyFolder(PROJECT_ROOT);
      }

      result &= copyNativeAssetsFrom();

      if (result == false) {
        Log.e(LOGTAG, "Failed to copy assets");
      } else {
        Log.v(LOGTAG, "Assets copied");
        // Persist the APK last update time
        SharedPreferences prefs = this.activity.getPreferences(Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putLong(LAST_UPDATED_TIME, this.lastUpdateTime);
        editor.commit();
      }
    }
  }

  private ArrayList<String> readFileFromAssets(String filename){
    ArrayList lines = new ArrayList();
    final Context context = this.activity.getBaseContext();
    try {
      BufferedReader reader = new BufferedReader(new InputStreamReader(context.getAssets().open(filename)));
      String line = reader.readLine();
      while (line != null) {
        lines.add(line);
        line = reader.readLine();
      }
      reader.close();
    } catch (IOException e) {
      Log.e(LOGTAG, e.getMessage());
      lines = new ArrayList();
    }

    return lines;
  }

  private static boolean copyFolder(String srcFolder) {
    boolean result = true;
    String destFolder = NodeJS.filesDir + "/" + srcFolder;
    File folderObject = new File(destFolder);
    if (folderObject.exists()) {
      result &= deleteFolderRecursively(folderObject);
    }
    result &= copyAssetFolder(srcFolder, destFolder);

    return result;
  }

  // Adapted from https://stackoverflow.com/a/22903693
  private static boolean copyAssetFolder(String srcFolder, String destPath) {
    try {
      String[] files = assetManager.list(srcFolder);
      boolean result = true;

      if (files.length == 0) {
        result &= copyAssetFile(srcFolder, destPath);
      } else {
        new File(destPath).mkdirs();
        for (String file : files) {
          result &= copyAssetFolder(srcFolder + "/" + file, destPath + "/" + file);
        }
      }
      return result;
    } catch (Exception e) {
      e.printStackTrace();
      return false;
    }
  }

  private static boolean copyAssetFile(String srcFolder, String destPath) {
    InputStream in = null;
    OutputStream out = null;
    try {
      in = assetManager.open(srcFolder);
      new File(destPath).createNewFile();
      out = new FileOutputStream(destPath);
      copyFile(in, out);
      in.close();
      in = null;
      out.flush();
      out.close();
      out = null;
      return true;
    } catch(Exception e) {
      e.printStackTrace();
      return false;
    }
  }

  private static void copyFile(InputStream in, OutputStream out) throws IOException {
    byte[] buffer = new byte[1024];
    int read;
    while ((read = in.read(buffer)) != -1) {
      out.write(buffer, 0, read);
    }
  }

  private static boolean deleteFolderRecursively(File file) {
    try {
      boolean result = true;
      for (File childFile : file.listFiles()) {
        if (childFile.isDirectory()) {
          result &= deleteFolderRecursively(childFile);
        } else {
          result &= childFile.delete();
        }
      }
      result &= file.delete();
      return result;
    } catch (Exception e) {
      e.printStackTrace();
      return false;
    }
  }
}
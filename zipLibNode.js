const zlib = require("zlib");
const fs = require("fs");

const libFolderPath = "./libs/android/libnode/bin/";
const path_armv7 = libFolderPath + "armeabi-v7a/";
const path_arm64 = libFolderPath + "arm64-v8a/";
const path_x64 = libFolderPath + "x86_64/";
const lib_name = "libnode.so";
const lib_name_gz = lib_name + ".gz";

function zip(libFolderPath, callback) {
  const input_filename = libFolderPath + lib_name;
  const output_filename = libFolderPath + lib_name_gz;
  if (fs.existsSync(input_filename)) {
    const input = fs.createReadStream(input_filename);
    const output = fs.createWriteStream(output_filename);

    const gzip = zlib.createGzip();
    input
      .pipe(gzip)
      .pipe(output)
      .on("close", function () {
        console.log(`done => ${output_filename}`);
        fs.rmSync(input_filename);
      });
  }
}

zip(path_armv7);
zip(path_arm64);
zip(path_x64);

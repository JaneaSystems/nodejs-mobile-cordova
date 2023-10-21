import * as zlib from "zlib";
import * as fs from "fs";

const LIB_FOLDER_PATH = "./libs/android/libnode/bin/";
const LIB_NAME = "libnode.so";
const LIB_NAME_GZ = `${LIB_NAME}.gz`;

const paths = [
  `${LIB_FOLDER_PATH}armeabi-v7a/`,
  `${LIB_FOLDER_PATH}arm64-v8a/`,
  `${LIB_FOLDER_PATH}x86_64/`,
];

function compressLib(libFolderPath) {
  const inputFilename = `${libFolderPath}${LIB_NAME}`;
  const outputFilename = `${libFolderPath}${LIB_NAME_GZ}`;

  if (fs.existsSync(inputFilename)) {
    const input = fs.createReadStream(inputFilename);
    const output = fs.createWriteStream(outputFilename);

    const gzip = zlib.createGzip();

    input
      .pipe(gzip)
      .pipe(output)
      .on("close", () => {
        console.log(`done => ${outputFilename}`);
        fs.rmSync(inputFilename);
      });
  }
}

paths.forEach(compressLib);

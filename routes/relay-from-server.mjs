import { addRoute, removeRouts } from "./addRoute.mjs";
import EventEmitter from "node:events";
import { PassThrough } from "node:stream";
import { serverFile } from "../model/serveStatic.mjs";
import { createServer } from "node:http";
import parseURLquery from "../model/queryparser.mjs";
import { addEmoji, memtype } from "../model/memtype.mjs";

export const emitter = new EventEmitter();
export let State = Object.create(null)
export let PASSWORDS = Object.create(null);
let STREAMS = Object.create(null)
let server = createServer(async (req, res) => {
  req.setEncoding; res.socket.bytesWritten
  req.headers.cookie;
  await req.read();
  req.on("");
});
//------------------
addRoute("/relay-from-server/file-meta-data", async (req, res) => {
  req.setEncoding("utf-8");
  const deviceID = req.headers.cookie;
  State[deviceID] = Object.create(null);
  State[deviceID].name = req.headers.devicename
  PASSWORDS[deviceID] = req.headers.password;
  STREAMS[deviceID] = Object.create(null)
  console.log(PASSWORDS[deviceID])
  let metaData = "";
  req.on("data", (data) => {
    metaData += data;
  });
  req.on("end", () => {
    metaData = JSON.parse(metaData);
    addLinksRouts(deviceID, metaData);
  });

  res.end();
});

function addLinksRouts(deviceID, metaData) {
  let allFilesObj = Object.create(null);
  for (let file of metaData) {
    const url = `/relay-from-server/file?name=${encodeURIComponent(file.name)}$device-id=${encodeURIComponent(deviceID)}`;
    const fileKey = file.size + file.name;
    const fileInfo = Object.create(null);
    fileInfo.key = fileKey;
    fileInfo.name = file.name;
    fileInfo.size = file.size;
    fileInfo.status = "pending";
    fileInfo.link = url;
    fileInfo.downloading = 0

    allFilesObj[fileKey] = fileInfo;
    STREAMS[deviceID][fileKey] = null;

    addRoute(url, async (req, res) => {
      const file = allFilesObj[fileKey]
      let stream = STREAMS[deviceID][fileKey]

      if (!stream) {
        stream = await makeDownloadAble(deviceID, fileKey);
        if (stream === "busy") {
          res.end("Servr Busy")
          return;
        }
        stream = STREAMS[deviceID][fileKey]
      }
      const type = memtype(file.name); console.log(type)
      res.writeHead(200, "OK", {
        "content-disposition": `attachment; filename=${file.name}`,
        "content-type": type,
        "content-length": file.size
      });

      stream.pipe(res);
      file.status = "sending";
      file.downloading += 1;
      const receiveID = req.headers.cookie;

      emitUpdate("update", deviceID, receiveID, file.key, file.status);

      const sendPercent = setInterval(() => {
        let percent = res.socket.bytesWritten / file.size * 100;
        percent = percent.toFixed(0);
        emitUpdate("update", deviceID, receiveID, file.key, percent)
      }, 800);

      res.on("finish", () => {
        file.status = "completed";
        emitUpdate("update", deviceID, receiveID, file.key, file.status);
        if (file.downloading > 0) file.downloading -= 1;
        if (file.downloading === 0)
          emitter.emit("downloaded", deviceID, file.key);
      });

      res.on("close", () => {
        if (file.status != "completed") {
          file.status = "Canceled";
          if (file.downloading > 0) file.downloading -= 1
          if (file.downloading === 0)
            emitter.emit("downloaded", deviceID, file.key);
          emitUpdate("update", deviceID, receiveID, file.key, file.status);
          console.log(file.downloading)
        }
        clearInterval(sendPercent)
      })
    });
  }
  State[deviceID].filesObj = allFilesObj;
  if (PASSWORDS[deviceID] === "") {
    emitter.emit("newLiveShare", deviceID, State[deviceID]);
  } else {
    let sanitized = Object.create(null);
    sanitized["name"] = State[deviceID].name;
    sanitized["filesObj"] = "locked"
    emitter.emit("newLiveShare", deviceID, sanitized )
  }
  
}

async function makeDownloadAble(deviceID, file) {
  return new Promise((resolve, reject) => {
    emitter.emit("makeDownloadAble", deviceID, file);
    function listner(id, filekey) {
      if (id === deviceID && filekey === file) {
        resolve();
        emitter.removeListener("maded", listner)
      }
    }
    setTimeout(() => {
      resolve("busy");
      emitter.removeListener("maded", listner)
    }, 3000);
    emitter.on("maded", listner)
  })
}

addRoute("/relay-from-server/to-send", async (req, res) => {
  const deviceID = req.headers.cookie;
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  function listner(id, file) {
    if (deviceID === id) {
      res.write(`event: tosend\ndata: ${file}\n\n`)
    }
  }
  emitter.on("makeDownloadAble", listner);
  req.on("close", () => {
    emitter.removeListener("makeDownloadAble", listner);
    cleanupRouts(deviceID);
      State[deviceID] = null
  })
});
function cleanupRouts(deviceID) {
  if(!State[deviceID]) return;
  emitter.emit("update", deviceID)
  const fileInfo = State[deviceID]["filesObj"];
  for (let file of Object.values(fileInfo)) {
    removeRouts(file.link);
  }
}
addRoute("/relay-from-server/make", async (req, res) => {
  const { filename, filesize, devicename } = req.headers;
  const deviceID = req.headers.cookie;
  const fileKey = filesize + filename
  
  const stream = new PassThrough()
  res.writeHead(206, "OK", {
    connection: "keep-alive",
  });
  req.pipe(stream);

  STREAMS[deviceID][fileKey] = stream;
  emitter.emit("maded", deviceID, fileKey)
  async function listner(id, key) {
    if (id === deviceID && key === fileKey) {
      req.unpipe(stream);
      stream.destroy()
      res.end("ok");
      req.destroy();
      STREAMS[deviceID][fileKey] = null;
    }
  }
  emitter.on("downloaded", listner);
  req.on("close", () => {
    emitter.removeListener("downloaded", listner)
  })
});

function emitUpdate(event, sendID, receiveID, key, status) {
  emitter.emit(event, sendID, receiveID, key, status)
}

addRoute("/relay-from-server/status", (req, res) => {
  const deviceID = req.headers.cookie;
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  function listner(sendID, receiveID, key, status) {
    if (sendID === deviceID) {
      res.write(`event: update\ndata: ${JSON.stringify({ [key]: status })}\n\n`);
    }
  }
  emitter.on("update", listner);
  req.on("close", () => {
    emitter.removeListener("update", listner);
  });
});

function calcSize(size) {
  let fileSize = (size / (1024 * 1024)).toFixed(2) + "MB";
  if (size / (1024 * 1024) < 1) fileSize = (size / 1024).toFixed(2) + "KB";
  return fileSize;
}

addRoute("/server-send", async (req, res, isServer) => {
  if (isServer) {
    res.writeHead(200, "Ok", {
      "content-type": "text/html",
      "cache-control": "no-cache",
    });
    await serverFile(req, res, "public", "server-send.html");
    res.end();
  } else handle404(req, res);
});
addRoute("/receive", async (req, res, isServer) => {
  if (true) {
    res.writeHead(200, "Ok", {
      "content-type": "text/html",
      "cache-control": "no-cache",
    });
    await serverFile(req, res, "public", "receive.html");
    res.end();
  } else handle404(req, res);
});

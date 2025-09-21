import { addRoute, removeRouts } from "./addRoute.mjs";
import EventEmitter from "node:events";
import { PassThrough } from "node:stream";
import { serverFile } from "../model/serveStatic.mjs";
import { createServer } from "node:http";
import parseURLquery from "../model/queryparser.mjs";
import { addEmoji, memtype } from "../model/memtype.mjs";
const emitter = new EventEmitter();

let State = {}
let server = createServer(async (req, res) => {
  req.setEncoding;res.socket.bytesWritten
  req.headers.cookie;
  await req.read();
  req.on("");
});
//------------------
addRoute("/relay-from-server/file-meta-data", async (req, res) => {
  req.setEncoding("utf-8");
  const deviceID = req.headers.cookie;
  State[deviceID] = { "name": req.headers.devicename };
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
  let allFilesInfo = {};
  for (let file of metaData) {
    const url = `/relay-from-server/file?name=${encodeURIComponent(file.name)}$device-id=${encodeURIComponent(deviceID)}`;
    const fileKey = file.size + file.name;
    allFilesInfo[fileKey] = {
      key: fileKey,
      name: file.name,
      size: file.size,
      status: "pending",
      link: url,
      relayStream: null,
      downloading: 0
    };
    addRoute(url, async (req, res) => {
      const file = allFilesInfo[fileKey]
      let stream = file.relayStream;

      if (!file.relayStream) {
        stream = await makeDownloadAble(deviceID, fileKey);
        if (stream === "busy") {
          res.end("Servr Busy")
          return;
        }
        stream = file.relayStream
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
        let percent = res.socket.bytesWritten/file.size * 100;
        percent = percent.toFixed(0); 
        emitUpdate("update", deviceID, receiveID, file.key, percent)
      }, 300);

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
  State[deviceID]["fileObj"] = allFilesInfo;
  emitter.emit("newFiles", deviceID);
  
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
  if (State[deviceID] === null || State[deviceID] == {}) return;
  const fileObj = State[deviceID]["fileObj"];
  for (let file of Object.values(fileObj)) {
    removeRouts(file.link);
  }
}
addRoute("/relay-from-server/make", async (req, res) => {
  const { filename, filesize, devicename } = req.headers;
  const deviceID = req.headers.cookie;
  const fileKey = filesize + filename
  const filesInfo = State[deviceID].fileObj;
  const file = filesInfo[fileKey];
  const stream = new PassThrough()
  res.writeHead(206, "OK", {
    connection: "keep-alive",
  });
  req.pipe(stream);

  file.relayStream = stream;
  emitter.emit("maded", deviceID, fileKey)
  async function listner(id, key) {
    if (id === deviceID && key === fileKey) {
      req.unpipe(stream);
      stream.destroy()
      res.end("ok");
      req.destroy();
      file.relayStream = null;
    }
  }
  emitter.on("downloaded", listner);
  req.on("close", () => {
    emitter.removeListener("downloaded", listner)
  })
});

addRoute("/relay-from-server", (req, res) => {
  res.writeHead(200, {
    "Cache-Control": "no-cache",
  });
  res.end(JSON.stringify(State));
})
addRoute("/relay-from-server/live-receive", (req, res) => {
  res.writeHead(200, {
    "Cache-Control": "no-cache",
    "connection": "keep-alive"
  })
  function listner(id) {
    res.write(`event: newFiles\ndata: ${JSON.stringify({ id: State[id] })}`)
  }
  emitter.on("newFiles", listner);
  req.on("close", () => {
    emitter.removeListener("newFiles", listner)
  })
})

function emitUpdate(event, sendID, receiveID, key, status) {
  emitter.emit(event, sendID, key, status);
  emitter.emit(event, receiveID, key, status)
}

addRoute("/relay-from-server/status", (req, res) => {
  const deviceID = req.headers.cookie;
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  function listner(id, key, status) {
    if (id === deviceID) {
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

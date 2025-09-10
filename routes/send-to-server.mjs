import path from 'node:path';
import * as fs from "node:fs"
import { chkStat, varifyDir } from '../model/file-stat.mjs';
import { addRoute } from "./addRoute.mjs"
import EventEmitter from "node:events";

const emitter = new EventEmitter();
let allFileStatus = {};
addRoute("/send-to-server-status", async (req, res, isServer) => {
    emitter.on("updated", (key) => {
      let status = allFileStatus[key];
      res.write(JSON.stringify(status.toJson()));
    })
});

addRoute("/send-to-server", async (req, res, isServer) => {
  await varifyDir("temp", "to-receive");
  let { filename, filesize, lastmodified, chunksize, index, islast, status } =
    req.headers;
  filesize = Number(filesize);
  chunksize = Number(chunksize);
  index = Number(index);
  
  emitter.emit("req", filename, filesize, chunksize, index);
  const writePath = path.join(
    "temp",
    "to-receive",
    `${lastmodified}-${filesize}_${filename}`
  );
  let localstatus;
  let stream;
  if (index === 0) {
    localstatus = await chkStat(writePath);
    if (localstatus) {
      let resumeIndex = Math.floor(localstatus.size / chunksize);
      if (resumeIndex != 0) {
        res.writeHead(206, "ok", {
          index: resumeIndex,
        });
        res.end("Resumed");
        emitter.emit("resumed", filename, filesize, resumeIndex);
        return;
      } else stream = fs.createWriteStream(writePath);
    } else {
      stream = fs.createWriteStream(writePath);
    }
  } else {
    stream = fs.createWriteStream(writePath, {
      flags: "r+",
      start: index * chunksize,
    });
  };
  res.writeHead(206, "ok", {
    index: String(index + 1),
  });
  let length = 0
  req.on("data", (chunk) => {
    length = chunk.length + length;
    stream.write(chunk);
  });
  let emittingData  = setInterval(() => {
   emitter.emit("saving", filename, filesize, length, index); 
  }, 500)
  let completed = false;
  req.on("end", async () => {
    clearInterval(emittingData);
    completed = true;
    if (islast === "true") {
      emitter.emit("done", filename, filesize);
      res.end("Completed");
      let movePath = ["data", "received", `${filename}`];
      let readstream = fs.createReadStream(writePath);
      let moveWriteStream = fs.createWriteStream(path.join(...movePath));
      readstream.pipe(moveWriteStream);
      readstream.on("end", async () => {
        await fs.promises.unlink(writePath);
      });
    } else {
      res.end(String(index + 1));
    } ;
  });
  req.on("close" , () => {
    if (!completed) emitter.emit("stoped", filename, filesize, "stoped")
    clearInterval(emittingData)
  })
});
addEvents()
function addEvents() {
  emitter.on("req", (filename, filesize, chunksize, index) => {
    const key = filename + filesize;
    if (Object.hasOwn(allFileStatus, key)) return;
    let fileStatus = new FileStatus(
      "started",
      filename,
      filesize,
      0,
      chunksize,
      0
    );

    allFileStatus[filename + filesize] = fileStatus;
    
  });
  emitter.on("stoped", (filename, filesize, status) => {
    const key = filename + filesize;
    let fileStatus = allFileStatus[key];
    fileStatus.update(status, fileStatus.savedSize);
    allFileStatus[key] = fileStatus;
    emitter.emit("updated", key)
  })
  emitter.on("resumed", (filename, filesize, resumeIndex) => {
    const key = filename + filesize;
    let fileStatus = allFileStatus[key];
    fileStatus.update("resumed", resumeIndex * fileStatus.chunksize);
    allFileStatus[key] = fileStatus;
    emitter.emit("updated", key)
  });
  emitter.on("saving", (filename, filesize, length, index) => {
    const key = filename + filesize;
    let fileStatus = allFileStatus[key];
    let savedSize = index * fileStatus.chunksize + length;
    fileStatus.update("saving", savedSize);
    allFileStatus[key] = fileStatus;
    emitter.emit("updated", key);
    
  });
  emitter.on("done", (filename, filesize) => {
    const key = filename + filesize;
    let fileStatus = allFileStatus[key];
    fileStatus.update("completed", filesize);
    allFileStatus[key] = fileStatus;
    emitter.emit('updated', key)
  })
}
class FileStatus {
  constructor(status, name, size, percent, chunksize, savedSize) {
    this.status = status;
    this.name = name;
    this.size = size;
    this.percent = percent;
    this.chunksize = chunksize;
    this.savedSize = savedSize;
  }
  update(status, savedSize) {
    let per = calcPercent(savedSize, this.size);
    this.status = status;
    this.percent = per;
    this.savedSize = savedSize;
  }
  toJson() {
    return {
      status: this.status,
      name: this.name,
      size: this.size,
      percent: this.percent,
      chunksize: this.chunksize,
      savedSize: this.savedSize,
    };
  }
}

function calcPercent(savedSize, size) {
  return (savedSize / size) * 100;
}

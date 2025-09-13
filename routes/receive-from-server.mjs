import path from 'node:path';
import * as fs from "node:fs"
import { chkStat, varifyDir } from '../model/file-stat.mjs';
import { addRoute } from "./addRoute.mjs"
import EventEmitter from "node:events";
import { PassThrough } from 'node:stream';

const emitter = new EventEmitter();
let relayStreams = {};
let links = {};
let allStatus = {};
addRoute("/receive-from-server/make",async (req, res) => {
  const {filename, filesize} = req.headers;
  const key = filename + `(${calcSize(filesize)})`
  relayStreams[key] = new PassThrough()
  req.pipe(relayStreams[key])
let st = new PassThrough(); st.on("")
  addRoute("/receive-form-server/"+key, async (req, res) => {
    const stream = relayStreams[key];
    res.writeHead(200, "OK", {
      "content-disposition": `attachment: filename=${filename}`,
      "content-type": "application/octet-stream"
    })
    stream.pipe(res);
    stream.on("start")
    stream.on("end", ()=> {
      allStatus[key] = "completed"
    })
  })
  
  links[key] = "/receive-form-server/"+key
  setTimeout(() => {
    emitter.emit("newFile", key, links[key])
  }, 200);

  res.end("ready")
})

addRoute("/receive-from-server", (req, res) => {
  res.write(JSON.stringify(links))
  emitter.on("newFile", (filename, url) => {
    res.write(JSON.stringify({[filename] : url}))
  })
})

function calcSize(size) {
  let fileSize = (size / (1024 * 1024)).toFixed(2) + "MB";
  if (size / (1024 * 1024) < 1)
    fileSize = (size / 1024).toFixed(2) + "KB";
  return fileSize
}
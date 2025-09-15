
import { addRoute } from "./addRoute.mjs"
import EventEmitter from "node:events";
import { PassThrough } from 'node:stream';
import { URL } from "node:url";
import { serverFile } from "../model/serveStatic.mjs";
const emitter = new EventEmitter();
let relayStreams = {};

let links = {};
let allStatus = {};
addRoute('/server-send', async (req, res, isServer) => {
  if (isServer) {
    res.writeHead(200, 'Ok', {
      'content-type': 'text/html',
      'cache-control': 'no-cache'
    })
    await serverFile(req, res, 'public', 'server-send.html');
    res.end();
     relayStreams = {};
    links = {};
    allStatus = {};
  }
  else handle404(req, res)

})
addRoute('/receive', async (req, res, isServer) => {
  if (true) {
    res.writeHead(200, 'Ok', {
      'content-type': 'text/html',
      'cache-control': 'no-cache'
    })
    await serverFile(req, res, 'public', 'receive.html');
    res.end();
   
  }
  else handle404(req, res)

})
addRoute("/relay-from-server/make",async (req, res) => {
  const {filename, filesize} = req.headers;
  const key = filename + `(${calcSize(filesize)})`
  relayStreams[key] = new PassThrough()
  res.writeHead(206, "OK", {
      "connection": "keep-alive"
    })
  req.pipe(relayStreams[key])
  const url = encodeURIComponent(key)
  let downloaded = false;
  addRoute("/relay-from-server/"+url, async (req, res) => {
    const stream = relayStreams[key];
    res.writeHead(200, "OK", {
      "content-disposition": `attachment: filename=${filename}`,
      "content-type": "application/octet-stream"
    })
    stream.pipe(res);
    allStatus[key] = "sending";
    emitter.emit("update", key, allStatus[key])
    stream.on("end", ()=> {
      allStatus[key] = "completed"
      emitter.emit("update", key, allStatus[key])
      downloaded= true
      res.end()
    })
  })
  
  links[key] = "/relay-from-server/"+url
  allStatus[key] = "pending";
    
  emitter.emit("newFile", key, links[key])
  emitter.emit("update", key, allStatus[key])

  console.log("http://localhost:4000"+links[key])
  res.write("ok")
  let check  = setInterval(() => {
    if (downloaded) {
      res.end("completed");
      clearInterval(check);
      emitter.r
    }
  }, 1000);

})

addRoute("/relay-from-server", (req, res) => {
  res.writeHead(200, {
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });
  res.write(JSON.stringify(links))
  res.end();
})

addRoute("/relay-from-server/status", (req, res) => {
  res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });
  function listner (key, status) {
  console.log(key, status)
    res.write(`event: update\ndata: ${JSON.stringify({[key]: status})}\n\n`)
  }
  emitter.on("update", listner);
  req.on("close", () => {
    emitter.removeListener("update", listner)
  })
})

function calcSize(size) {
  let fileSize = (size / (1024 * 1024)).toFixed(2) + "MB";
  if (size / (1024 * 1024) < 1)
    fileSize = (size / 1024).toFixed(2) + "KB";
  return fileSize
}
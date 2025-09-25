import { addRoute } from "./addRoute.mjs";
import { State as liveShared } from "./relay-from-server.mjs";
import { PASSWORDS as livePasswords } from "./relay-from-server.mjs";
import { emitter as liveEmitter } from "./relay-from-server.mjs";

class State {
  constructor() {
    this.liveShared = liveShared;
    this.byPcShared;
    this.serverShared;
    this.livePasswords = livePasswords;
    this.byPcPasswords;
  }
  init() {
    addRoute("/shared-files", (req, res) => {
      res.writeHead(200, {
        "Cache-Control": "no-cache",
        "content-type": "application/json"
      });
      res.end(this.toJson());
    })
    addRoute("/shared-files/unlock", (req, res) => {
      const { id, pass, method } = req.headers;
      res.writeHead(200, {
        "Cache-Control": "no-cache",
        "content-type": "application/json"
      });
      if (method === "live") {
        if (this.livePasswords[id] === pass) {
          res.end(JSON.stringify(this.liveShared[id]["filesObj"]))
        } else {
          res.end("false")
        }
      }
    })
    addRoute("/shared-files/updates", (req, res) => {
      res.writeHead(200, {
        "Cache-Control": "no-cache",
        "connection": "keep-alive",
        "content-type": "text/event-stream"
      })
      function liveSharelistner(id, obj) {
        let toSend = Object.create(null);
        toSend[id] = obj; 
        res.write(`event: newLiveShare\ndata: ${JSON.stringify(toSend)}\n\n`)
      }
      liveEmitter.on("newLiveShare", liveSharelistner);
      req.on("close", () => {
        liveEmitter.removeListener("newLiveShare", liveSharelistner)
      })
    })
    addRoute("/shared-files/updates/status", (req, res) => {
      const deviceID = req.headers.cookie;
      res.writeHead(200, {
        "Cache-Control": "no-cache",
        "connection": "keep-alive",
        "content-type": "text/event-stream"
      })
      function liveStatuslistner(sendID, receiveID, key, status) {
        if (!key) {
          res.write(`event: liveShareCanceled\ndata: ${JSON.stringify({id: sendID})}\n\n`);
        }
        else if (receiveID === deviceID) {
          res.write(`event: liveFileUpdate\ndata: ${JSON.stringify({ id : sendID, filekey: key, status: status })}\n\n`);
        }
      }
      liveEmitter.on("update", liveStatuslistner);
      req.on("close", () => {
        liveEmitter.removeListener("update", liveStatuslistner);
      });
    })
  }
  toJson() {
    let allShared = Object.create(null)
    let sanitizedLiveShared = Object.create(null);
    for (let key of Object.keys(this.livePasswords)) {
      if (this.livePasswords[key] === "") {
        sanitizedLiveShared[key] = this.liveShared[key]
      } else {
        sanitizedLiveShared[key] = Object.create(null)
        sanitizedLiveShared[key]["name"] = this.liveShared[key].name;
        sanitizedLiveShared[key]["filesObj"] = "locked";
      }
    }
    allShared["liveShared"] = sanitizedLiveShared;
    return JSON.stringify(allShared)
  }
}
const receiveHandler = new State();
receiveHandler.init();
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
        "connection": "keep-alive"
      })
      function liveSharelistner(id, obj) {
        let toSend = Object.create(null);
        toSend[id] = obj
        res.write(`event: newLiveShare\ndata: ${JSON.stringify(toSend)}`)
      }
      liveEmitter.on("newLiveShare", liveSharelistner);
      req.on("close", () => {
        liveEmitter.removeListener("newLiveShare", liveSharelistner)
      })
    })
  }
  toJson() {
    let allShared = Object.create(null)
    let sanitizedLiveShared = Object.create(null);
    for (let key of Object.keys(this.livePasswords)) {
      if (this.livePasswords[key] === "") {
        sanitizedLiveShared[key] = this.liveShared[key]
      } else  {
        console.log(this.liveShared)
        console.log(this.liveShared[key].name);
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
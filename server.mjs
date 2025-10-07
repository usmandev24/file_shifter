import * as http from "node:http";
import { checkDevice, getIpv4 } from "./model/checkDevice.mjs";
import { routes } from "./routes/addRoute.mjs";
import { handle404 } from "./routes/mainRoutes.mjs";
import qrcode from "qrcode";
import { randomUUID } from "node:crypto";
import cookieParser from "./model/cookie_parser.mjs";
import { serverFile } from "./model/serveStatic.mjs";
import EventEmitter from "node:events";
import { createFile, varifyDir } from "./model/file-stat.mjs";

export let connectedDevices = new Map();
export const serverEmitter = new EventEmitter()
export const port = 4000;
export const server = http.createServer(async (req, res) => {
  const isServer = checkDevice(req.socket.address().address);

  for (let route of routes) {
    if (req.url === route.url) {
      const next = await identityCheck(req, res);
      if (next) {
        addToConnected(req, res)
        await route.handler(req, res, isServer);
      }
      return;
    }
  }
  handle404(req, res);
});

function addToConnected(req, res) {
  if (
    req.url === "/public/styles/main_styles.css" ||
    req.url === "/set-device-name"
  ) return;
  const cookie = cookieParser(req.headers.cookie);
  if (!connectedDevices.has(cookie.deviceid)) {
    connectedDevices.set(cookie.deviceid, cookie.devicename)

  }
   serverEmitter.emit("newDevice", cookie.deviceid, cookie.devicename)
}
async function identityCheck(req, res) {

  if (
    req.url === "/public/styles/main_styles.css" ||
    req.url === "/set-device-name"
  )
    return true;
  const cookie = cookieParser(req.headers.cookie);
  if (!cookie) {
    const deviceid = randomUUID();
    res.setHeader(
      "set-cookie",
      `deviceid=${deviceid}; httponly; path=/; max-age=23429384723984`
    );
    await serverFile(req, res, "public", "device-name.html");
    return false;
  } else if (!cookie.devicename) {
    await serverFile(req, res, "public", "device-name.html");
    return false;
  }
  return true;
}

server.listen(port);
server.on("error", (err) => {
  console.log(err);
});
server.on("listening", () => {
  console.log(`
----------------------------------------------------------------------------------

                Welcome to seemless file sharing Web-App.

          Copywrite 2025 "USMAN GHANI" https://github.com/usmandev24

----------------------------------------------------------------------------------
                                 
------>   On this PC enter http://localhost:${port} in browser `);
  if (!getIpv4()) {
    console.log(`
*****    !!!  NO Network connected  ***********`)
    return
  }
  console.log(`------>   On Other device Mobile/PC go to http://${getIpv4()}:${port}`);
  try {
    qrcode.toString(`http://${getIpv4()}:4000`, { "small": true, "type": "terminal" })
      .then(q => {
        console.log(`
Or Scan:
${q}`)
      })
    qrcode.toString(`http://${getIpv4()}:4000`, { "small": true, "type": "svg" })
      .then(svg => {
        varifyDir("public", "images")
          .then(v => {
            createFile(svg, "public", "images", "qrcode.svg")
          })
      })
  } catch (error) {
    console.error(error);
  }
});


process.on("uncaughtException", (err) => {
  console.error(`Error : ${err}
    Stack: ${err.stack}`);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandeld rejection : " + err);
  console.error("Stack: " + err.stack);
});

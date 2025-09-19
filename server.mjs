import * as http from "node:http";
import { checkDevice, getIpv4 } from "./model/checkDevice.mjs";
import { routes } from "./routes/addRoute.mjs";
import { handle404 } from "./routes/mainRoutes.mjs";
import qrcode from "qrcode-terminal";
import { randomUUID } from "node:crypto";
export const port = 4000;
export const server = http.createServer(async (req, res) => {
  const isServer = checkDevice(req.socket.address().address);
  if (!req.headers.cookie) {
    const deviceid = randomUUID()
    res.setHeader("set-cookie", `deviceid=${deviceid}; httponly; path=/; max-age=23429384723984`)
  }
  for (let route of routes) {
    if (req.url === route.url) {
      await route.handler(req, res, isServer);
      return;
    }
  }
  handle404(req, res);
});

server.listen(port);
server.on("error", (err) => {
  console.log(err)
})
server.on("listening", () => {
  console.log(`

------>   On this PC enter http://localhost:${port} in browser

------>   On Other device Mobile/PC go to http://${getIpv4()}:${port}`);
});

try {
  qrcode.generate(`http://${getIpv4()}:${port}`, { small: true }, (qcode) => {
    console.log(`
OR Scan:
${qcode}`);
  });
} catch (error) {
  console.error(error);
}
process.on("uncaughtException", (err) => {
  console.error(`Error : ${err}
    Stack: ${err.stack}`);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandeld rejection : " + err);
  console.error("Stack: " + err.stack);
});

import { addRoute } from "./addRoute.mjs";
import cookieParser from "../model/cookie_parser.mjs";
import { varifyFile, varifyDir } from "../model/file-stat.mjs";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as crpto from "node:crypto";

export function createHeaderId(req) {
  const ua = req.headers["user-agent"] || "";
  const accept = req.headers["accept"] || "";
  const acceptLang = req.headers["accept-language"] || "";
  const acceptEnc = req.headers["accept-encoding"] || "";
  const secChUa = req.headers["sec-ch-ua"] || "";
  const secChUaMobile = req.headers["sec-ch-ua-mobile"] || "";
  const secChUaPlatform = req.headers["sec-ch-ua-platform"] || "";

  const components = [
    ua,
    secChUa,
    secChUaPlatform,
    secChUaMobile,
    accept,
    acceptLang,
    acceptEnc,
  ].join("|");
  console.log(components);
  const hash = crpto.createHash("sha256").update(components).digest("hex");
  console.log(hash);
  return hash;
}
function generate4digitID() {
  let id = "";
  for (let v = 0; v < 4; v++) {
    let n = String(Math.floor(Math.random() * 10));
    id += n;
  }
  return id;
}
addRoute("/set-device-id", async (req, res) => {
  await varifyDir("appData");
  await varifyFile("appData", "devicesData.json");

  const filePath = path.join("appData", "devicesData.json");
  const readed = await fs.readFile(filePath, "utf-8");
  let devicesData = readed ? JSON.parse(readed) : Object.create(null);

  const hid = createHeaderId(req);
  const existingId = Object.keys(devicesData).find((id) => id === hid);

  if (existingId) {
    let deviceName = devicesData[hid].name;
    deviceName = deviceName.slice(0, deviceName.indexOf("("));
    deviceName = deviceName + `(${generate4digitID()})`;

    res.setHeader("set-cookie", [
      `deviceid=${hid}; httponly; path=/; max-age=${60 * 60 * 24 * 365}`,
      `devicename=${deviceName}; httponly; path=/; max-age=${60 * 60 * 24 * 365}`,
    ]);
    res.end(JSON.stringify({ status: "ok", name: deviceName }));
  } else {
    res.setHeader(
      "set-cookie",
      `deviceid=${hid}; httponly; path=/; max-age=${60 * 60 * 24 * 365}`
    );
    res.end(JSON.stringify({ status: "new" }));
  }
});

addRoute("/set-device-name", async (req, res) => {
  await varifyDir("appData");
  await varifyFile("appData", "devicesData.json");

  const reqDeviceName = req.headers.devicename;
  const cookie = cookieParser(req.headers.cookie);

  const filePath = path.join("appData", "devicesData.json");
  const readed = await fs.readFile(filePath, "utf-8");
  let devicesData = readed ? JSON.parse(readed) : Object.create(null);

  devicesData[cookie.deviceid] = { name: reqDeviceName };
  res.setHeader(
    "set-cookie",
    `devicename=${reqDeviceName}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 365}`
  );
  res.end("done");

  await fs.writeFile(filePath, JSON.stringify(devicesData), "utf-8");
});

addRoute("/clear-cookie", (req, res) => {
  res.setHeader("set-cookie", [
    `deviceid=; httponly; path=/; max-age=0`,
    "devicename=; httponly; path=/; max-age=0",
  ]);
  res.end("DONE CLeard");
});

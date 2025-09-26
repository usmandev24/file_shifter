import { addRoute } from "./addRoute.mjs";
import cookieParser from "../model/cookie_parser.mjs";
import { varifyFile, varifyDir } from "../model/file-stat.mjs";
import * as path from "node:path";
import * as fs from "node:fs/promises";


addRoute("/set-device-name", async (req, res) => {
  await varifyDir("appData");
  await varifyFile("appData", "devicesData.json");

  const reqDeviceName = req.headers.devicename;
  const cookie = cookieParser(req.headers.cookie);

  const filePath = path.join("appData", "devicesData.json");
  const readed = await fs.readFile(filePath, "utf-8");
  let devicesData = readed ? JSON.parse(readed) : Object.create(null);

  const existingId = Object.keys(devicesData).find(
    id => devicesData[id].name === reqDeviceName
  );

  if (existingId) {
    if (existingId === cookie.deviceid) {
      // Same device is updating its own name
      devicesData[cookie.deviceid].name = reqDeviceName;
      res.setHeader("set-cookie", `devicename=${reqDeviceName}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 365}`);
      res.end("done");
    } else {
      res.end("already present");
    }
  } else {
    devicesData[cookie.deviceid] = { name: reqDeviceName };
    res.setHeader("set-cookie", `devicename=${reqDeviceName}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 365}`);
    res.end("done");
  }
  await fs.writeFile(filePath, JSON.stringify(devicesData), "utf-8");
});

addRoute("/clear-cookie", (req, res) => {
  res.setHeader("set-cookie", [`deviceid=; httponly; path=/; max-age=0`, 'devicename=; httponly; path=/; max-age=0']);
  res.end("DONE CLeard")
})
import { addRoute } from "./addRoute.mjs";
import cookieParser from "../model/cookie_parser.mjs";
import { varifyFile, varifyDir } from "../model/file-stat.mjs";
import * as path from "node:path";
import * as fs from "node:fs/promises";


addRoute("/set-device-name", async (req, res) => {
  const reqDeviceName = req.headers.devicename;
  const cookie = cookieParser(req.headers.cookie);
  res.setHeader("set-cookie", `devicename=${reqDeviceName}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 365}`);
  res.end("done");

});

addRoute("/clear-cookie", (req, res) => {
  res.setHeader("set-cookie", [`deviceid=; httponly; path=/; max-age=0`, 'devicename=; httponly; path=/; max-age=0']);
  res.end("DONE CLeard")
})
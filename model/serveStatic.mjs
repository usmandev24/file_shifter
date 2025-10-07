import path from "node:path";
import {addRoute } from "../routes/addRoute.mjs";
import * as fs from "node:fs";
import { memtype } from "./memtype.mjs";
import { varifyDir } from "./file-stat.mjs";

export async function serveFolder(...paths) {
  await varifyDir(...paths)
  let safePath = path.join(...paths);
  let files = await fs.promises.readdir(safePath);
  for(let file of files) {
    const url = "/"+paths.join("/")+"/"+file;
    addRoute(url,async (req, res) => {
      res.writeHead(200, "OK", {
        'cache-control': 'no-cache',
        "content-type": memtype(file)
      })
      await serverFile(req, res, ...paths,file)
    })
  }
}
export async function serverFile(req, res, ...filePath) {
  const safePath = path.join(...filePath);
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
    stream.on("end", () => {
      res.end()
      resolve();
    })
    stream.on('error', (err) => {
      reject(err)
    })
  })
}

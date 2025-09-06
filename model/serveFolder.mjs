import path from "node:path";
import { serveStatic, addRout } from "../server.mjs";
import * as fs from "node:fs";

export async function serveFolder(...paths) {
  let safePath = path.join(...paths);
  let files = await fs.promises.readdir(safePath);
  for(let file of files) {
    paths.push(file);
    const url = "/"+paths.join("/");
    addRout(url,async (req, res) => {
      await serveStatic(req, res, ...paths)
    })
  }
}
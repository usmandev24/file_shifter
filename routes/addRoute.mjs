import { serverFile, serveFolder } from "../model/serveStatic.mjs";
export let routes = []
export function addRoute(url, handler) {
  routes.push({ url, handler })
}
serveFolder('public', "js");
import("./send-to-server.mjs")
import('./mainRoutes.mjs')
import('./receive-from-server.mjs')
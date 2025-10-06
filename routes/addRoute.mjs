import { serverFile, serveFolder } from "../model/serveStatic.mjs";
export let routes = []
export function addRoute(url, handler) {
  routes.push({ url, handler })
}
export function removeRouts(path) {
  let toremove = routes.findIndex(({url, handler}, index) => {
    if (path === url) return index;
  })
  routes.splice(toremove, 1);
}
serveFolder('public', "js");
serveFolder('public', "images");
import("./identityRouts.mjs")
import("./send-to-server.mjs")
import('./mainRoutes.mjs')
import('./relay-from-server.mjs')
import('./receiveRoutes.mjs')

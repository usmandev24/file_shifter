import { serverFile, serveFolder } from "../model/serveStatic.mjs";
export let routes = []
export function addRoute(url, handler) {
  routes.push({ url, handler })
}
export function removeRouts(path) {
  let toremove = routes.findIndex(({url, handler}, index) => {
    if (path === url) return index;
  })
  console.log(toremove);
  routes.splice(toremove, 1);
}
serveFolder('public', "js");
import("./send-to-server.mjs")
import('./mainRoutes.mjs')
import('./relay-from-server.mjs')
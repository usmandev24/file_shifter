import { serverFile, serveFolder } from "../model/serveStatic.mjs";
import { routes } from "./addRoute.mjs";

await serveFolder('public', "js");
await import("./send-to-server.mjs")
await import('./mainRoutes.mjs')
export let allRoutes = routes;



import { serverFile } from "../model/serveStatic.mjs";
import { addRoute } from "./addRoute.mjs";
import { connectedDevices } from "../server.mjs";
import { serverEmitter } from "../server.mjs";

addRoute('/', async (req, res, isServer) => {
  res.writeHead(200, 'Ok', {
    'content-type': 'text/html',
    'cache-control': 'no-cache'
  })
  if (isServer) await serverFile(req, res, 'public', 'server-index.html');
  else await serverFile(req, res, 'public', 'index.html')
  res.end();
})

addRoute('/send-to-main-pc', async (req, res, isServer) => {
  if (!isServer) {
    res.writeHead(200, 'Ok', {
      'content-type': 'text/html',
      'cache-control': 'no-cache'
    })
    await serverFile(req, res, 'public', 'send-to-server.html');
    res.end();
  }
  else handle404(req, res)
})

addRoute('/public/styles/main_styles.css', async (req, res) => {
  res.writeHead(200, 'Ok', {
    'cache-control': 'no-cache'
  })
  await serverFile(req, res, 'public', 'styles', 'main_styles.css');
})

addRoute("/edit-device-name", async (req, res) => {
  res.writeHead(200, 'Ok', {
    'cache-control': 'no-cache',
    "content-type": "text/html"
  })
  await serverFile(req, res, 'public', 'device-name.html');
})

addRoute("/connected-devices", async (req, res) => {
  let data = {}
  for (let key of connectedDevices.keys()) {
    data[key] = connectedDevices.get(key)
  }
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "connection": "keep-alive",
    "cache-control": "no-cache"
  })
  let eventEmitted = []
  setTimeout(() => {
    res.write(`event: devices\ndata: ${JSON.stringify(data)}\n\n`)
  }, 500);

  function listner(id, name) {
    if (eventEmitted.includes(id) || data[id]) return;
    res.write(`event: newDevice\ndata: ${JSON.stringify({ [id]: name })}\n\n`)
    eventEmitted.push(id)
  }
  function nameListner(id, name) {
    res.write(`event: newDevice\ndata: ${JSON.stringify({ [id]: name })}\n\n`)
  }
  serverEmitter.on("newDevice", listner);
  serverEmitter.on("nameChange", nameListner)
  req.on("close", () => {
    serverEmitter.removeListener("newDevice", listner)
    serverEmitter.removeListener("nameChange", nameListner)
  })
})

export function handle404(req, res) {
  res.writeHead(404, '404', {
    'content-type': 'text/html'
  });
  res.end(`
    <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="/public/styles/main_styles.css" />
    <title>404</title>
  </head>
  <body>
    <div
      class="flex flex-1 justify-between items-center border-b border-base-300 m-auto"
    >
      <div></div>
      <h1 class="text-xl lg:text-2xl p-2 ml-2 font-bold">
        <a href="/">File Shifter</a>
      </h1>
      <div></div>
    </div>
    <div class="text-center bg-base-300 rounded-2xl font-bold m-16">
      <h2 class="text-4xl text-error p-4">404</h2>
      <p class=" p-4" >No such page exit<br>Go back to <a class= "link link-info" href= "/">homepage</a></p>
    </div>
  </body>
</html>
    `)
}
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
  if (true) {
    res.writeHead(200, 'Ok', {
      'content-type': 'text/html',
      'cache-control': 'no-cache'
    })
    await serverFile(req, res, 'public', 'send-to-server.html');
    res.end();
  }
  else handle404(req, res)

})
addRoute('/send', async (req, res, isServer) => {
  if (true) {
    res.writeHead(200, 'Ok', {
      'content-type': 'text/html',
      'cache-control': 'no-cache'
    })
    await serverFile(req, res, 'public', 'send.html');
    res.end();
  }
  else handle404(req, res)

})
addRoute('/server-receive', async (req, res, isServer) => {
  if (isServer) {
    res.writeHead(200, 'Ok', {
      'content-type': 'text/html',
      'cache-control': 'no-cache'
    })
    await serverFile(req, res, 'public', 'server-receive.html');
    res.end();
  }
  else handle404(req, res)

})
addRoute('/live-send', async (req, res, isServer) => {
  if (true) {
    res.writeHead(200, 'Ok', {
      'content-type': 'text/html',
      'cache-control': 'no-cache'
    })
    await serverFile(req, res, 'public', 'live-send.html');
    res.end();
  }
  else handle404(req, res)

})
addRoute('/send-by-pc', async (req, res, isServer) => {
  if (true) {
    res.writeHead(200, 'Ok', {
      'content-type': 'text/html',
      'cache-control': 'no-cache'
    })
    await serverFile(req, res, 'public', 'send-by-pc.html');
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
addRoute("/edit-device-name", async(req , res) => {
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
  setTimeout(() => {
   res.write(`event: devices\ndata: ${JSON.stringify(data)}\n\n`) 
  }, 500);
  
  function listner(id, name) {
    res.write(`event: newDevice\ndata: ${JSON.stringify({[id]: name})}\n\n`)
  }
  serverEmitter.on("newDevice", listner);
  req.on("close", () => {
    serverEmitter.removeListener("newDevice", listner)
  })
})

export function handle404(req, res) {
  res.writeHead(404, '404', {
    'content-type': 'text/html'
  });
  res.end(`
    <html lang="en" >
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Data Shifter 404</title>
  </head>
  <body>
    <h1>404</h1>
  </body>
  </html>
    `)
}
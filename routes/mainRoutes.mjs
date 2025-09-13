import { serverFile } from "../model/serveStatic.mjs";
import { addRoute } from "./addRoute.mjs";

addRoute('/', async (req, res, isServer) => {
  res.writeHead(200, 'Ok', {
    'content-type': 'text/html',
    'cache-control': 'no-cache'
  })
  if (isServer) await serverFile(req, res, 'public', 'server-index.html');
  else await serverFile(req, res, 'public', 'index.html')
  res.end();
})
addRoute('/send-to-Main-PC', async (req, res, isServer) => {
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
addRoute('/server-send', async (req, res, isServer) => {
  if (isServer) {
    res.writeHead(200, 'Ok', {
      'content-type': 'text/html',
      'cache-control': 'no-cache'
    })
    await serverFile(req, res, 'public', 'server-send.html');
    res.end();
  }
  else handle404(req, res)

})
addRoute('/receive', async (req, res, isServer) => {
  if (true) {
    res.writeHead(200, 'Ok', {
      'content-type': 'text/html',
      'cache-control': 'no-cache'
    })
    await serverFile(req, res, 'public', 'receive.html');
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
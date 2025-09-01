import * as http from 'node:http';
import * as fs from "node:fs";
import path from 'node:path';
import * as util from 'node:util';
import { checkDevice, getIpv4 } from './model/checkDevice.mjs';

;

export const port = 4000
let Routs = [];

const server = http.createServer(async (req, res) => {
  const isServer = checkDevice(req.socket.address().address);
  console.log(isServer);
  for (let rout of Routs) {
    if (req.url === rout.url) {
      await rout.handler(req, res, isServer);
      return;
    }
  }
  handle404(req, res);
})

addRout('/public/styles/main_styles.css', async (req, res) => {
  await serveStatic(req, res, 'public', 'styles', 'main_styles.css');
})

addRout('/', async (req, res, isServer) => {
  res.writeHead(200, 'Ok', {
    'content-type': 'text/html'
  })
  if (isServer) await serveStatic(req, res, 'public', 'index.html');
  else await serveStatic(req, res, 'public', 'o-index.html')
  res.end();
})
addRout('/send', async (req, res, isServer) => {
  if (!isServer) {
    res.writeHead(200, 'Ok', {
      'content-type': 'text/html'
    })
    await serveStatic(req, res, 'public', 'o-send.html');
    res.end();
  }
  else handle404(req, res)

})
function handle404(req, res) {
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

function addRout(url, handler) {
  Routs.push({ url, handler })
}

async function serveStatic(req, res, ...filePath) {
  const safePath = path.join(...filePath);
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
    stream.on("end", () => {
      resolve();
    })
    stream.on('error', () => {
      reject()
    })
  })
}

server.listen(port);
server.on('listening', () => {
  console.log(`Server is listening to http://localhost:${port}
    On this PC enter http://localhost:${port} in browser

    On Other device Mobile/PC go to http://${getIpv4()}:${port}`)
});

process.on('uncaughtException', (err) => {
  console.error(`Error : ${err}
    Stack: ${err.stack}`)
});
process.on('unhandledRejection', (err) => {
  console.error("Unhandeld rejection : " + err + err.stack)
})

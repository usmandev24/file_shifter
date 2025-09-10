import * as http from 'node:http';
import { checkDevice, getIpv4 } from './model/checkDevice.mjs';
import { allRoutes } from './routes/index.mjs';
import { handle404 } from './routes/mainRoutes.mjs';

export const port = 4000
export const server = http.createServer(async (req, res) => {
  const isServer = checkDevice(req.socket.address().address);

  for (let route of allRoutes) {
    if (req.url === route.url) {
      await route.handler(req, res, isServer);
      return;
    }
  }
  handle404(req, res);
})

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
  console.error("Unhandeld rejection : " + err)
  console.error("Stack: " + err.stack)
})

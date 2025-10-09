//-------------------------------------------------------------------------------------
//   GNU GENERAL PUBLIC LICENSE  Version 3, 29 June 2007. see Licence file for detail.
//
//                Copyright (c) 2025 Usman Ghani (usmandev24) 
//--------------------------------------------------------------------------------------

import os from "os";
import { port } from "../server.mjs";
export function checkDevice(toMatch) {
  toMatch = normalizeIP(toMatch);
  const interfaces = os.networkInterfaces();

  // Always consider loopback addresses local
  if (toMatch === "127.0.0.1" || toMatch === "::1") {
    return true;
  }
  for (let values of Object.values(interfaces)) {
    for (let iface of values) {
      if (iface.address === toMatch && iface.internal) {
        console.log(toMatch)
        return true;
      }
    }
  }
  return false;
}

function normalizeIP(address = "") {
  return address.replace(/^::ffff:/, "");
}

export function getIpv4() {
  let interfaces = os.networkInterfaces();
  for (let values of Object.values(interfaces)) {
    for(let inface of values) {
      if (!inface.internal && inface.family === 'IPv4') {
        return inface.address;
      }
    }
  }
  return 
}
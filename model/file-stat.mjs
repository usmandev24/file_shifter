import * as fs from 'node:fs';
import path, { dirname } from 'node:path';
import * as os from 'os'

export async function varifyDir(...dirPath) {
  const safePath = path.join(...dirPath);
  const status = await fs.promises.stat(safePath, {"throwIfNoEntry": false});
  if (!status) {
    const newDir =await fs.promises.mkdir(safePath, {recursive: true})
  }
  return status;
}
export async function chkStat(...dirPath) {
  const safePath = path.join(...dirPath);
  const status = await fs.promises.stat(safePath, {"throwIfNoEntry": false});
  return status;
}
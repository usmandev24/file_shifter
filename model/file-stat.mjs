import * as fs from 'node:fs';
import path, { dirname } from 'node:path';
import * as os from 'os'

export async function varifyDir(...dirPath) {
  const safePath = path.join(...dirPath);
  let status;
  try {
    status = await fs.promises.stat(safePath, {"throwIfNoEntry": false});
    
  } catch (error) {
    status = undefined;
  } 
  if (!status) {
    const newDir =await fs.promises.mkdir(safePath, {recursive: true})
  }
  return status;
}
export async function chkStat(...dirPath) {
  const safePath = path.join(...dirPath);
  let status;
  try {
    status = await fs.promises.stat(safePath, {"throwIfNoEntry": false});
    return status;
  } catch (error) {
    return undefined;
  } 
}
export async function moveFile(oldpath = [], newPath = []) {
  await varifyDir(newPath.pop());
  let oldSafePath = path.join(...oldpath)
   let newSafePath = path.join(...newPath)
  const file = await fs.promises.rename(oldSafePath, newSafePath);
  return file;
}
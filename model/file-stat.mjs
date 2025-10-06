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
    const newDir =await fs.promises.mkdir(safePath, {recursive: true});
    return newDir;
  }
  return status
}
export async function varifyFile(...dirPath) {
  const safePath = path.join(...dirPath);
  let status;
  try {
    status = await fs.promises.stat(safePath, {"throwIfNoEntry": false});
    
  } catch (error) {
    status = undefined;
  } 
  if (!status) {
    const newFile =await fs.promises.writeFile(safePath, {"encoding" : "utf-8"})
    return newFile
  }
  return status
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

export async function createFile(data , ...dirPath) {
  const safePath = path.join(...dirPath)
  return await fs.promises.writeFile(safePath, data)
}
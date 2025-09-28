let memtype;
const show_files = document.getElementById("show-containers")
const emitter = new EventTarget();
const newFilesUpdates = new EventSource("/shared-files/updates")
const statusUpdate = new EventSource("/shared-files/updates/status")

let liveContainers = Object.create(null)
async function main() {
  await getMemtype()
  const Data = await getFileToDownload();
  const liveShared = Data["liveShared"];
  for (let key of Object.keys(liveShared)) {
    if (!liveShared[key]) continue;
    const newContainer = FilesContainer.create(key, liveShared[key], "live");
    liveContainers[key] = newContainer
  }
  newFilesUpdates.addEventListener("newLiveShare", (event) => {
    const data = JSON.parse(event.data);
    for (let key of Object.keys(data)) {
      if (liveContainers[key]) liveContainers[key].remove();
      const container = FilesContainer.create(key, data[key], "live");
      liveContainers[key] = container;
    }
  })
  statusUpdate.addEventListener("liveShareCanceled", (event) => {
    const data = JSON.parse(event.data);
    console.log(data + "hello");
    const toClear = liveContainers[data.id];
    toClear.remove();
  })
}

window.addEventListener("load", main)
class FilesContainer {
  constructor(id, obj, method) {
    this.deviceId = id
    this.deviceName = obj["name"]
    this.method = method;
    this.filesObj = obj["filesObj"]
    this.dom = document.createElement("div");
    this.dom.className = "w-full mt-3 p-1 md:p-4 bg-base-100 rounded-lg"
    this.allFileDatas = Object.create(null);
    this.lockUi = createLockUi();
    this.addTitle();
  }
  static create(id, obj, method) {
    const containerObj = new FilesContainer(id, obj, method);
    show_files.appendChild(containerObj.dom);
    if (obj["filesObj"] === "locked") containerObj.renderLock();
    else containerObj.renderFiles();
    containerObj.attchEvents();
    return containerObj;
  }
  renderFiles() {
    for (let fileKey of Object.keys(this.filesObj)) {
      const file = this.filesObj[fileKey]
      const fileData = new FileData(file.name, file.link, "pending")
      fileData.appendTo(this.dom)
      this.allFileDatas[fileKey] = fileData;
    }
  }
  renderLock() {
    const lockUi = this.lockUi
    this.dom.appendChild(lockUi.lockDiv);
    lockUi.btn.onclick = this.unlock.bind(this)
  }
  attchEvents() {
    if (this.method === "live") {
      statusUpdate.addEventListener("liveFileUpdate", (event) => {
        const data = JSON.parse(event.data);
        if (data.id === this.deviceId) {
          const filekey = data.filekey
          const fileData = this.allFileDatas[filekey];
          fileData.update(data.status);
          if (data.status === "completed" || data.status === "Canceled") {
            this.onComplete(filekey)
          } else if (Number(data.status) != NaN) {
            this.onDown(filekey)
          }
          console.log(data.status)
        }
      })
    } else if (this.method === "bypc") {

    }
  }
  async unlock(event) {
    event.stopPropagation();
    const lockUi = this.lockUi;
    const res = await fetch("/shared-files/unlock", {
      method: 'GET',
      headers: {
        "method": "live",
        "id": this.deviceId,
        "pass": lockUi.input.value
      }
    })
    const resText = await res.text();
    if (resText != "false") {
      lockUi.lockDiv.remove();
      this.filesObj = JSON.parse(resText)
      console.log(this.filesObj)
      this.renderFiles()
    } else {
      lockUi.labelText.textContent = "*Enter Password Again |"
    }
  }
  addTitle() {
    this.dom.appendChild(el("h2", {
      className: "text-center text-lg p-4"
    }, "🔴 Live Sharing :", el("span", {
      className: "font-bold pl-4 "
    }, this.deviceName)))
  }
  remove() {
    this.dom.remove()
  }
  onDown(filekey) {
    for (let key of Object.keys(this.allFileDatas)) {
      if (key === filekey) continue;
      const file = this.allFileDatas[key];
      file.setPending()
    }
  }
  onComplete(filekey) {
    for (let key of Object.keys(this.allFileDatas)) {
      if (key === filekey) continue;
      const file = this.allFileDatas[key];
      file.setReady()
    }
  }
}


class FileData {
  constructor(fileName, link, status = null) {
    this.name = fileName;
    this.link = link
    this.status = status
    this.ui = createFileUi(fileName, link);
    this.count = 0;
  }
  appendTo(dom) {
    dom.appendChild(this.ui.oneFileSet)
  }
  setPending() {
    const ui = this.ui;
    if (ui.statusText.textContent == "✅") return;
    this.setDisplay(ui.loading, "inline-block");
    this.setDisplay(ui.statusText, "none");
    this.setDisplay(ui.progress, "none");
    this.setDisplay(ui.downBtn, "none");
  }
  setReady() {
    const ui = this.ui;
    if (ui.statusText.textContent == "✅") return;
    this.setDisplay(ui.loading, "none");
    this.setDisplay(ui.statusText, "none");
    this.setDisplay(ui.progress, "none");
    this.setDisplay(ui.downBtn, "inline-block");
  }
  update(status) {
    const ui = this.ui;
    switch (status) {
      case "sending":
        this.setDisplay(ui.loading, "none");
        this.setText(ui.statusText, "sending...");
        this.setDisplay(ui.downBtn, 'none')
        break;
      case "completed":
        this.count += 1;
        this.setDisplay(ui.loading, "none");
        this.setDisplay(ui.progress, "none");
        this.setDisplay(ui.downBtn, "none")
        this.setText(ui.statusText, `✅`);
        break;
      case "Canceled":
        this.setDisplay(ui.loading, "none");
        this.setDisplay(ui.progress, "none");
        this.setText(ui.statusText, "⚠️ canceled");
        this.setDisplay(ui.downBtn, "inline-block")
        setTimeout(() => {
          this.setDisplay(ui.statusText, "none")
        }, 1000);
        break;
      default:
        this.setDisplay(ui.loading, "none");
        this.setDisplay(ui.downBtn, "none");
        this.setDisplay(ui.progress, "inline-block");
        this.setDisplay(ui.statusText, "inline")
        ui.progress.style.setProperty("--value", status)
        this.setText(ui.statusText, status+"%")
        
    }
  }
  setDisplay(ele, value) {
    ele.style.display = value;
  }
  setText(ele, text) {
    ele.textContent = text;
  }

}
async function getFileToDownload() {
  const res = await fetch("/shared-files");
  return JSON.parse(await res.text())
}
function createLockUi() {
  const input = document.createElement("input");
  input.type = "text";
  const labelText = el("span", {}, "Enter Password |")
  const lable = el("lable", {
    className: "input input-primary"
  }, labelText, input)

  const btn = el("div", {
    className: "btn btn-primary"
  }, "Ok")
  const lockDiv = el("div", {
    className: "flex flex-row justify-center items-center gap-2 pb-6"
  }, lable, btn)
  return { input, lable, labelText, btn, lockDiv }
}

function createFileUi(fileName, link) {
  //Dom Elements ;
  const oneFileSet = el("div", {
    className:
      "flex flex-col gap-1 shadow shadow-sm dark:shadow-md w-full p-2 mt-3   rounded-lg ",
  });
  const nameRow = el("div", {
    className: "flex w-full justify-between  break-all items-center",
  });
  const nameText = document.createElement("h3");
  nameText.className = "text-[0.85rem] font-bold md:text-[0.95rem]";

  const loading = el("span", {
    className: "hidden loading loading-dots"
  })
  const progress = el("div", {
    className: "radial-progress text-info ",
    ariaValueNow: "70",
    role: "progressbar"
  })
  progress.setAttribute(
    "style",
    "--value:0; --size:1.5rem;"
  );
  progress.style.display = "none"
  const statusText = el("span", {
    className: "w-max  text-[0.8rem] md:text-[1rem]",
  }, "");
  const downBtn = el("a", {
    href: link,
    className: "text-[1.2rem] md:text-[1.4rem]"
  }, "📥")

  const loadStatDiv = el("div", {
    className: "ml-auto pl-2 flex justify-between align-center-safe gap-2"
  }, loading, progress, statusText, downBtn)

  nameRow.appendChild(nameText);
  nameRow.appendChild(loadStatDiv);
  nameText.textContent = memtype.addEmoji(fileName) + fileName;
  oneFileSet.appendChild(nameRow);
  return {
    oneFileSet, nameRow, nameText, loadStatDiv, statusText, loading, progress
    , downBtn
  }
}

function el(tag, props = {}, ...children) {
  const e = document.createElement(tag);
  Object.assign(e, props);
  children.forEach((c) => {
    if (typeof c === "string") {
      e.appendChild(document.createTextNode(c));
    } else e.appendChild(c);
  });
  return e;

}
async function getMemtype() {
  if (!memtype) {
    memtype = await import('/public/js/memtype.js');
  }
}  

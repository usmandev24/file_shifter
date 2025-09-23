let memtype;
const show_files = document.getElementById("show-containers")
const emitter = new EventTarget();

let allContainers = []
async function main() {
  await getMemtype()
  const STATE = await getFileToDownload();
  const liveShared = STATE["liveShared"];
  for (let key of Object.keys(liveShared)) {
    if (!liveShared[key]) continue;
    FilesContainer.create(key, liveShared[key], "live");
  }
}

window.addEventListener("load", main)
class FilesContainer {
  constructor(id, obj, method) {
    this.deviceId = id
    this.deviceName = obj["name"]
    this.method = method;
    this.filesObj = obj["filesObj"]
    this.dom = document.createElement("div");
    this.dom.className = "w-full mt-3 border border-gray-300 rounded-lg"
    this.allFileStates = Object.create(null);
    this.lockUi = createLockUi();
    this.addTitle();
  }
  static create(id, obj, method) {
    const containerObj = new FilesContainer(id, obj, method);
    show_files.appendChild(containerObj.dom);
    if (obj["filesObj"] === "locked") containerObj.renderLock();
    else containerObj.renderFiles();
    return containerObj;
  }
  renderFiles() {
    for (let fileKey of Object.keys(this.filesObj)) {
      const file = this.filesObj[fileKey]
      const fileState = new FileSTATE(file.name, file.link, "pending")
      fileState.appendTo(this.dom)
      this.allFileStates[fileKey] = fileState;
    }
  }
  renderLock() {
    const lockUi = this.lockUi
    this.dom.appendChild(lockUi.lockDiv);
    lockUi.btn.onclick = this.unlock.bind(this)
  }
  async unlock(event) {
    event.stopPropagation();
    const lockUi = this.lockUi;
    const res = await fetch("/shared-files/unlock", {
      method: 'GET',
      headers: {
        "method": "live",
        "id" : this.deviceId,
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
    }, "🔴 Live Sharing :" + this.deviceName))
  }
  remove() {
    this.dom.remove()
  }
}
class FileSTATE {
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
  
}
async function getFileToDownload() {
  const res = await fetch("/shared-files");
  return JSON.parse(await res.text())
}
function createLockUi () {
  const input = document.createElement("input");
  input.type = "text";
  const labelText = el("span", {}, "Enter Password |")
  const lable = el("lable", {
    className:"input input-primary"
  }, labelText, input)
  
  const btn = el("div", {
    className : "btn btn-primary"
  }, "Ok")
  const lockDiv = el("div", {
    className : "flex flex-row justify-center items-center gap-2 pb-6"
  }, lable, btn)
  return {input , lable,labelText, btn, lockDiv}
}

function createFileUi(fileName, link) {
  //Dom Elements ;
  const oneFileSet = el("div", {
    className:
      "flex flex-col gap-1  w-full p-2 mt-3 border border-base-200 bg-base-100 rounded-lg ",
  });
  const nameRow = el("div", {
    className: "flex w-full justify-between  break-all items-center",
  });
  const nameText = document.createElement("h3");
  nameText.className = "text-[0.85rem] font-bold";

  const loading = el("span", {
    className: " loading loading-dots"
  })
  const progress = el("div", {
    className: "radial-progress text-info ",
    ariaValueNow: "70",
    role: "progressbar"
  })
  progress.setAttribute(
    "style",
    "--value:70; --size:1.3rem;"
  );
  progress.style.display = "none"
  const statusText = el("span", {
    className: "",
  }, "");
  const downBtn = el("a", {
    href: link
  }, "📥")
  
  const loadStatDiv = el("div", {
    className: "ml-auto mr-2 inline-flex justify-between align-center-safe gap-2"
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

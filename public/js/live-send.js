//-------------------------------------------------------------------------------------
//   GNU GENERAL PUBLIC LICENSE  Version 3, 29 June 2007. see Licence file for detail.
//
//                Copyright (c) 2025 Usman Ghani (usmandev24) 
//--------------------------------------------------------------------------------------

let memtype;
const file_input = document.getElementById("file-input");
const show_files = document.getElementById("show-files");
const device_name = document.getElementById("device-name");
const device_nameDiv = document.getElementById("device-name-div")
const select = document.getElementById("select");
const selectSkeleton = document.getElementById("select-skeleton")
const canclebtn = document.getElementById("cancel-btn")
const connectedDevices = new EventSource("/connected-devices");

const emitter = new EventTarget();
let DeviceToSend;
file_input.onchange = liveShare

window.onload = init;

async function init() {
  const deviceName = localStorage.getItem("deviceName");
  (deviceName) ? device_name.textContent = deviceName : null;
  await getMemtype();
  let allOptions = new Map();
  connectedDevices.addEventListener("devices", event => {
    const data = JSON.parse(event.data); console.log(data)
    for (let key of Object.keys(data)) {
      let option = document.createElement("option");
      allOptions.set(key, option)
      option.textContent = data[key];
      option.value = key;
      selectSkeleton.before(option)
    }
  })

  connectedDevices.addEventListener("newDevice", event => {
    const data = JSON.parse(event.data); console.log(data)
    for (let key of Object.keys(data)) {
      if (allOptions.has(key)) {
        let option = allOptions.get(key)
        option.textContent = data[key]
        return;
      }
      const option = document.createElement("option");
      allOptions.set(key, option)
      option.textContent = data[key];
      option.value = key;
      selectSkeleton.before(option)
    }
  })

  select.onchange = () => {
    for (let option of Array.from(select.options)) {
      if (option.selected) DeviceToSend = option.value;
    }
    file_input.disabled = false;
  }
}

async function getMemtype() {
  if (!memtype) {
    memtype = await import('/public/js/memtype.js');
  }
}
async function liveShare() {
  file_input.disabled = true;
  select.disabled = true;
  connectedDevices.close();
  const deviceName = localStorage.getItem("deviceName").replaceAll("-", "_")
  show_files.style.display = "block";
  canclebtn.style.display = "block"
  const app = new Share(file_input, deviceName, DeviceToSend);
  await app.init();
  window.onbeforeunload = app.close.bind(app)
}

class Share {
  constructor(fileInput, deviceName, toSend) {
    this.fileInput = fileInput;
    this.deviceName = deviceName;
    this.DeviceToSend = toSend;
    this.statusSource = new EventSource("/relay-from-server/status");
    this.filetoSend = new EventSource("/relay-from-server/to-send");
    this.allFileObjs = {};
    this.sendingCount = 0;
    this.matadata = []
  }

  async init() {
    const fileInput = this.fileInput
    Array.from(fileInput.files).forEach(async (file, index) => {
      const fileObj = new File(file, "pending");
      const fileName = file["name"].replaceAll(/\/|\\/ig, "_")
      const fileSize = calcSize(file.size)
      this.matadata.push({ name: fileName, size: file.size })
      const key = file.size + fileName
      this.allFileObjs[key] = fileObj;
    });
    this.addListeners()
    await this.sendMetaData()
  }

  async sendMetaData() {
    let res = await fetch("/relay-from-server/file-meta-data", {
      method: "POST",
      body: JSON.stringify(this.matadata),
      headers: {
        "devicetosend": this.DeviceToSend
      }
    })
    return await res.text()
  }

  addListeners() {
    this.filetoSend.addEventListener("tosend", async event => {
      this.sendingCount += 1; console.log("start" + this.sendingCount);
      if (this.sendingCount > 2) {
        return;
      }
      const tosend = event.data
      console.log(event.data)
      const res = await this.allFileObjs[tosend].liveSend();
      if (this.sendingCount > 0) this.sendingCount -= 1;
      console.log("end" + this.sendingCount);
    })
    this.statusSource.addEventListener("update", event => {
      const obj = JSON.parse(event.data)
      console.log(obj)
      const key = Object.keys(obj)[0];
      this.allFileObjs[key].update(obj[key]);
    })
  }

  close() {
    this.statusSource.close();
    this.filetoSend.close();
  }
}


class File {
  constructor(file, status = "") {
    this.file = file;
    this.status = status;
    this.ui = createFileUi(file);
    this.count = 0;
  }

  update(status) {
    const ui = this.ui;
    this.status = status;
    switch (status) {
      case "pending":
        this.setDisplay(ui.loading, "inline-block");
        this.setDisplay(ui.statusText, "none");
        this.setDisplay(ui.progress, "none")
        break;
      case "sending":
        this.setDisplay(ui.loading, "inline-block");
        this.setText(ui.statusText, " sending");
        break;
      case "completed":
        this.count += 1;
        this.setDisplay(ui.loading, "none");
        this.setDisplay(ui.progress, "none")
        if (this.count > 1) {
          this.setText(ui.statusText, `${this.count} times ✅`);
        } else {
          this.setText(ui.statusText, `✅`);
        }

        break;
      case "Canceled":
        this.setDisplay(ui.loading, "none");
        this.setDisplay(ui.progress, "none");
        this.setText(ui.statusText, "⚠️ canceled");
        break;
      default:
        this.setDisplay(ui.loading, "none");
        this.setDisplay(ui.progress, "inline-block")
        ui.progress.style.setProperty("--value", status)
        this.setText(ui.statusText, " " + status + "%");
    }
  }
  async liveSend() {
    try {
      const file = this.file;
      const filename = file["name"].replaceAll(/\/|\\/ig, "_")
      const res = await fetch('/relay-from-server/make', {
        method: "POST",
        body: file,
        headers: {
          "filename": filename,
          "filesize": file.size
        }
      });
      const textRes = await res.text()
      return textRes;
    } catch (error) {
      return "Closed"
    }

  }
  setDisplay(ele, value) {
    ele.style.display = value;
  }
  setText(ele, text) {
    ele.textContent = text;
  }
}
function createFileUi(file) {
  //Dom Elements ;
  const oneFileSet = el("div", {
    className:
      "flex flex-col gap-1  w-full p-2 mt-3 shadow shadow-sm dark:shadow-md rounded-lg ",
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
    className: "w-max  text-[0.8rem] md:text-[1rem]",
  }, "");
  const loadStatDiv = el("div", {
    className: "ml-auto pl-2  flex justify-between align-center-safe gap-2"
  }, loading, progress, statusText,)

  let fileSize = calcSize(file.size)

  nameRow.appendChild(nameText);
  nameRow.appendChild(loadStatDiv);
  const filename = file["name"].replaceAll(/\/|\\/ig, "_")
  nameText.textContent = memtype.addEmoji(filename) + filename + `(${fileSize})`;
  oneFileSet.appendChild(nameRow);
  show_files.appendChild(oneFileSet);
  return {
    oneFileSet, nameRow, nameText, loadStatDiv, statusText, loading, progress
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
function calcSize(size) {
  let fileSize = (size / (1024 * 1024)).toFixed(2) + "MB";
  if (size / (1024 * 1024) < 1)
    fileSize = (size / 1024).toFixed(2) + "KB";
  return fileSize
}
const show_files = document.getElementById("show-containers")
const emitter = new EventTarget();
function main() {
  getFileToDownload()
  emitter.addEventListener("new", (event) => {
    const State = event.detail;
    console.log(State)
    for (let deviceId of Object.keys(State)) {
      if (State[deviceId] === null) continue;
      const dname = State[deviceId].name;
      const filesObj = State[deviceId].fileObj;
      const dDiv = new FileContainer(dname)
      for (let file of Object.values(filesObj)
      ) {
        const linkObj = new FileLink(file.name, file.link)
        dDiv.appnedLink(linkObj.ui.oneFileSet)
      }
    }
  })
}

window.addEventListener("load", main)
class FileContainer {
  constructor(deviceName) {
    this.dom = document.createElement("div");
    show_files.appendChild(this.dom);
    this.dom.className = "w-full mt-3 border border-gray-300 rounded-lg"
    this.links = [];
    this.addTitle(deviceName);
  }
  appnedLink(link) {
    this.dom.appendChild(link);
    this.links.push(link)
  }
  addTitle(deviceName) {
    this.dom.appendChild(el("h2", {
      className: "text-center text-lg p-4"
    }, deviceName + ": Live Sharing"))
  }
  remove() {
    this.dom.remove()
  }
}
class FileLink {
  constructor(filename, link, status = null) {
    this.status = status
    this.ui = createFileUi();
    this.count = 0;
    this.name = filename;
    this.link = link
    this.create()
  }
  create() {
    const ui = this.ui;
    ui.link.textContent = this.name;
    ui.link.href = this.link
  }
  update(status) {
    const ui = this.ui
    if (status === "pending") {
      ui.loading.style.display = "none";
      ui.statusBtn.style.display = "inline-flex";
      ui.statusBtn.textContent = "pending";

    } else if (status === "sending") {
      ui.loading.style.display = "inline-block";

    } else if (status === "completed") {
      this.count += 1;
      ui.loading.style.display = "none";
      ui.statusBtn.textContent = `${this.count} ✅`;
    }
  }
}
async function getFileToDownload() {

  fetch("/relay-from-server").then(async (res) => {
    const reader = res.body.getReader();
    const decoder = new TextDecoder()
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const links = decoder.decode(value, { stream: true });
      emitter.dispatchEvent(new CustomEvent("new", { detail: JSON.parse(links) }))
    }
  })
    .catch(err => {
      emitter.dispatchEvent(new CustomEvent("error", { detail: err }))
    })

}

function createFileUi() {
  //Dom Elements ;
  const oneFileSet = el("div", {
    className:
      "flex flex-col gap-1  w-full p-2 mt-3 border border-base-200 bg-base-100 rounded-lg ",
  });
  const nameRow = el("div", {
    className: "flex justify-between  break-all items-center",
  });
  const link = el("a")
  const nameText = el("h3", {
    className: "text-[0.85rem] text-info font-bold md:text-[1rem]"
  }, link)
  const loading = el("span", {
    className: "loading loading-spinner text-success"
  })

  loading.style.display = "none";
  const statusBtn = el("button", {
    className: "btn btn-sm md:btn-md  btn-outline text-primary",
    disabled: true,
  }, "📥", loading);
  nameRow.appendChild(nameText);
  nameRow.appendChild(statusBtn);
  oneFileSet.appendChild(nameRow);
  return {
    oneFileSet, nameRow, nameText, link, statusBtn, loading
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

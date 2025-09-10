const emitter = new EventTarget();
const showDiv = document.getElementById('show-div');
const waiting = document.getElementById("waiting");
class FileUi {
  constructor(file) {
    this.file = file;
    this.ui = createFileUi(file);
    this.state = {
      info_Div_height :null
    }
    this.init()
  }
  update(file) {
    this.file = file;
    let percent = file.percent
    const ui = this.ui;
    ui.pBar.value = percent.toFixed(0)
    ui.percentEle.textContent = percent.toFixed(1) + "%"
    ui.statusBtn.textContent = file.status;
    if (percent === 100) {
      this.showOnSuccess()
    } 
    if (file.status === "canceled") this.showOnError();
    if (file.status === 'stoped') this.onCancel();
    if (file.status === "resumed" || file.status === "saving") this.showOnStart()
  }
  init () {
    this.setInfoDivHeight();
    this.ui.nameRow.onclick = (event) =>{
      this.showHide_info_Div(event) 
    }
  }
}
function showUpdates() {
  let allFileStatus = {};
  emitter.addEventListener("new", (event) => {
    waiting.style.display = "none"
    let file = event.detail;
    let key = file.name+file.size;
    if (!Object.hasOwn(allFileStatus, key)) {
      allFileStatus[key] = new FileUi(file);

    } else {
      allFileStatus[key].update(file);
    }
  })
}
function getStats() {
    fetch('/send-to-server-status').then(async (res) => {
    const reader =  res.body.getReader();
    const decoder = new TextDecoder()
    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      const status = decoder.decode(value, {stream: true});
      console.log(JSON.parse(status))
      emitter.dispatchEvent(new CustomEvent("new", {detail: JSON.parse(status)}))
    }
  })
  .catch(err => {
    emitter.dispatchEvent(new CustomEvent("error", {detail: err}))
  })
}
FileUi.prototype.statusBtnText = function (text) {
  this.ui.statusBtn.textContent = text
}
FileUi.prototype.infoAlertText = function (text) {
  this.ui.infoAlert.textContent = text
}
FileUi.prototype.replaceClassName = function (ele, from, to) {
  ele.className = ele.className.replace(from, to)
}
FileUi.prototype.replaceClassList = function (ele, from, to) {
  ele.classList.replace(from, to)
}
FileUi.prototype.setInfoDivHeight = function () {
  const info_Div = this.ui.info_Div;
  info_Div.style.display = "flex";
  const height = info_Div.getBoundingClientRect().height + "px";
  info_Div.style.height = height
  this.state.info_Div_height = height;
}
FileUi.prototype.hideInfo_Div = function (delay) {
  const info_Div = this.ui.info_Div;
  setTimeout(() => {
    info_Div.classList.replace("scale-y-100", "scale-y-0");
    info_Div.style.height = 0;
  }, delay);
}
FileUi.prototype.showHide_info_Div = function (event) {
  event.stopPropagation()
  const info_Div_height = this.state.info_Div_height;
  const info_Div = this.ui.info_Div;
  if (info_Div_height) {
    if (info_Div.style.height === "0px") {
      info_Div.classList.replace("scale-y-0", "scale-y-100");
      info_Div.style.height = info_Div_height;
    } else {
      info_Div.classList.replace("scale-y-100", "scale-y-0");
      info_Div.style.height = "0px";
    }
  }
}
FileUi.prototype.showOnStart = function () {
  const ui = this.ui;
  this.replaceClassName(ui.statusBtn,
    /text-primary|text-secondary|text-error|text-warning/,
    "text-info"
  );
  this.replaceClassName(ui.statusBtn, /btn-outline/, "btn-dash");
  this.replaceClassName(ui.pBar,
    /progress-primary|progress-error|progress-warning/,
    "progress-info"
  );
  this.infoAlertText("Receiving File from Sender...");
  this.replaceClassName(ui.infoAlert,
    /alert-error|alert-warning/,
    "alert-info"
  );
}
FileUi.prototype.onCancel = function () {
  const ui = this.ui;
  this.replaceClassName(ui.statusBtn,
    /text-primary|text-error|text-info/,
    "text-warning"
  );
  this.infoAlertText("⚠️ Stoped by Sender.");
  this.replaceClassName(ui.infoAlert,
    /alert-info|alert-error/,
    "alert-warning"
  );
  this.replaceClassName(ui.pBar,
    /progress-primary|progress-error|progress-info/,
    "progress-warning"
  );
  this.hideInfo_Div(1000)
}
FileUi.prototype.showOnSuccess = function (responseText) {
  const ui = this.ui
  this.replaceClassName(ui.statusBtn,
    /text-primary|text-secondary|text-info/,
    "text-success"
  );
  this.replaceClassName(ui.pBar,
    /progress-primary|progress-secondary|progress-info/,
    "progress-success"
  );
  this.infoAlertText("✅Successfully Received");
  this.replaceClassList(ui.infoRow, "alert-info", "alert-success");
  this.hideInfo_Div(1000)
}
FileUi.prototype.showOnError = function () {
  const ui = this.ui
  this.replaceClassName(ui.statusBtn,
    /text-primary|text-warning|text-info/,
    "text-error"
  );
  this.replaceClassName(ui.statusBtn, /btn-dash/, "btn-outline");
  this.replaceClassName(ui.pBar,
    /progress-primary|progress-warning|progress-info/,
    "progress-error"
  );
  this.replaceClassName(ui.infoAlert,
    /alert-info|alert-warning/,
    "alert-error"
  );
  this.infoAlertText("🚫Canceled By Sender");
  
}
FileUi.prototype.hideInfo_Div = function (delay) {
  const info_Div = this.ui.info_Div;
  setTimeout(() => {
    info_Div.classList.replace("scale-y-100", "scale-y-0");
    info_Div.style.height = 0;
  }, delay);
}
function createFileUi(file) {
  //Dom Elements ;
  const oneFileSet = el("div", {
    className:
      "flex flex-col gap-1  w-full p-2 mt-3 border border-base-200 rounded-lg bg-base-100",
  });
  const nameRow = el("div", {
    className: "flex justify-between  break-all items-center",
  });
  const nameText = document.createElement("h3");
  nameText.className = "text-[0.85rem] font-bold md:text-[1rem]";
  const statusBtn = el("button", {
    className: "btn btn-sm md:btn-md  btn-outline text-primary",
    disabled: true,
  });
  const pRow = el("div", {
    className: "flex flex-row justify-center items-center",
  });
  const pBar = el("progress", {
    max: 100,
    value: 0,
    className: " progress progress-info  h-2 mr-8",
  });
  const percentEle = el("p", { className: "p-1 ", textContent: "0%" });

  const infoAlert = el("div", {
    className: "alert alert-info alert-soft alert-horizontal p-2 text-[0.85rem] md:text-[1rem] ",
    textContent: "Receiving File from Sender...",
  });

  

  const infoRow = el(
    "div",
    {
      className: "hidden flex flex-row justify-center gap-4 items-center",
    },
    infoAlert,
  );

  const info_Div = el("div", {
    className:
      "flex flex-col justify-start align-start transition-all  ease-in-out duration-[500ms] scale-y-100",
  });

  let fileSize = (file.size / (1024 * 1024)).toFixed(2) + "MB";
  if (file.size / (1024 * 1024) < 1)
    fileSize = (file.size / 1024).toFixed(2) + "KB";

  pRow.appendChild(pBar);
  pRow.appendChild(percentEle)

  nameRow.appendChild(nameText);
  nameRow.appendChild(statusBtn);
  nameText.textContent = file.name + `(${fileSize})`;
  oneFileSet.appendChild(nameRow);


  info_Div.appendChild(pRow);
  info_Div.appendChild(infoRow);
  oneFileSet.appendChild(info_Div);
  showDiv.appendChild(oneFileSet);
  return {
    oneFileSet, nameRow, nameText, statusBtn, pRow,
    pBar, percentEle,
    infoAlert, infoRow, info_Div
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
window.addEventListener("load" , () => {
  getStats();
  showUpdates()
})

//-------------------------------------------------------------------------------------
//   GNU GENERAL PUBLIC LICENSE  Version 3, 29 June 2007. see Licence file for detail.
//
//                Copyright (c) 2025 Usman Ghani (usmandev24) 
//--------------------------------------------------------------------------------------

let memtype;
const file_input = document.getElementById("file-input");
const show_files = document.getElementById("show-files");
file_input.onchange = show;

async function getMemtype() {
  if (!memtype) {
    memtype = await import('/public/js/memtype.js');
  }
}
window.onload = async () => { await getMemtype() }
function show() {
  let allSendFunctions = [];
  let allSendBtns = [];
  Array.from(file_input.files).forEach((file, index) => {

    const file_transfer = new FileTransfer(file);
    file_transfer.renderUIinside(show_files)
    file_transfer.attachEvents();

    file_transfer.ui.cancelBtn.onclick = async (event) => {
      await file_transfer.onCancelBtn(event, index, allSendBtns, allSendFunctions)
    }
    allSendFunctions.push(file_transfer.OnSendBtn.bind(file_transfer))
    allSendBtns.push(file_transfer.ui.sendBtn);

    const totalFiles = Array.from(file_input.files).length;
    if (index + 1 === totalFiles) {
      const sendAllbtn = el("button", {
        textContent: "Send All Above Files",
        className: "btn btn-primary w-max m-auto",
      });
      const sendAllBtnDIV = el("div", {
        className: "flex flex-row justify-center mt-4",
      }, sendAllbtn);
      show_files.appendChild(sendAllBtnDIV);
      sendAllbtn.onclick = async () => {
        sendAllbtn.disabled = true;
        for (let fun of allSendFunctions) {
          await fun();
        }
        const isSended = allSendBtns.every((btn, index) => {
          if (btn.textContent === "Completed") return true;
        });
        if (isSended) {
          sendAllbtn.textContent = "✅ All Above Files Sended Successfully";
          sendAllbtn.className = "alert alert-success alert-soft";
          sendAllbtn.role = "alert";
        }
      };
    }
  })
}
class FileTransfer {
  constructor(file) {
    this.file = file
    this.state = {
      cancelBtnCliked: false,
      info_Div_height: null,
      Paused: false,
      canceled: false,
      chunk: 20 * 1024 * 1024,
      smallChunk: 5 * 1024 * 1024,
      xhr: new XMLHttpRequest()
    }
    this.ui = createFileUi(file)
  }

}
FileTransfer.prototype.renderUIinside = function (mainEle) {
  mainEle.appendChild(this.ui.oneFileSet);
}
FileTransfer.prototype.sendBtnText = function (text) {
  this.ui.sendBtn.textContent = text
}
FileTransfer.prototype.infoAlertText = function (text) {
  this.ui.infoAlert.textContent = text
}
FileTransfer.prototype.replaceClassName = function (ele, from, to) {
  ele.className = ele.className.replace(from, to)
}
FileTransfer.prototype.replaceClassList = function (ele, from, to) {
  ele.classList.replace(from, to)
}
FileTransfer.prototype.setInfoDivHeight = function () {
  if (this.state.info_Div_height === null ) {
  const info_Div = this.ui.info_Div;
  const state = this.state;
  info_Div.style.display = "flex";
  const height = info_Div.getBoundingClientRect().height + "px";
  info_Div.style.height = height
  this.state.info_Div_height = height;
  }
}
FileTransfer.prototype.hideInfo_Div = function (delay) {
  const info_Div = this.ui.info_Div;
  setTimeout(() => {
    info_Div.classList.replace("scale-y-100", "scale-y-0");
    info_Div.style.height = 0;
  }, delay);
}
FileTransfer.prototype.OnSendBtn = async function (event) {
  const ui = this.ui;
  const file = this.file;
  const state = this.state;
  const sendBtn = ui.sendBtn;
  const xhr = state.xhr
  if (event) event.stopPropagation();
  let chunkSize = state.chunk;
  if (file.size < 100 * 1024 * 1024) chunkSize = state.smallChunk;
  const totalchunk = Math.ceil(file.size / chunkSize);
  //Show pBar , info'
  this.setInfoDivHeight();
  if (
    (sendBtn.textContent === "Send" && !state.cancelBtnCliked) ||
    (sendBtn.textContent === "Resume" && !state.cancelBtnCliked) ||
    (sendBtn.textContent === "Retry" && !state.cancelBtnCliked)
  ) {
    let index = 0;
    if (sendBtn.textContent === "Resume") state.Paused = false;
    for (; index < totalchunk;) {
      if (state.canceled || state.Paused) {
        break;
      }
      state.Paused = false;
      let lastPart = false;
      let from = index * chunkSize;
      let to = (index + 1) * chunkSize;

      if (index + 1 === totalchunk) lastPart = true;

      const filePart = file.slice(from, to);
      let receivedIndex = await this.sendFile(
        file,
        filePart,
        xhr,
        chunkSize,
        totalchunk,
        index,
        lastPart
      );
      index = receivedIndex;
    }
  } else if (sendBtn.textContent === "Pause") {
    state.Paused = true;
    await cancelSending(xhr);
    sendBtn.textContent = "Resume";
    sendBtn.classList.replace("btn-dash", "btn-outline");
    ui.infoAlert.textContent = "▶ Sending Paused...";
  }
}
FileTransfer.prototype.sendFile = async function (
  file,
  filePart,
  xhr,
  chunkSize,
  totalchunk,
  index,
  isLastchunk
) {
  return new Promise((reslove, reject) => {
    const ui = this.ui;
    const state = this.state;
    xhr.open("POST", "/send-to-server");
    const fileName = file["name"].replaceAll(/\/|\\/ig, "_");
    xhr.setRequestHeader("filename", fileName);
    xhr.setRequestHeader("filesize", file.size);
    xhr.setRequestHeader("lastmodified", file.lastModified);
    xhr.setRequestHeader("index", index);
    xhr.setRequestHeader("chunksize", chunkSize);
    xhr.setRequestHeader("islast", isLastchunk);
    xhr.setRequestHeader("status", "sending")
    xhr.onloadstart = () => {
      this.showOnStart();
    };

    const startTime = Date.now();
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        let percent = ((index * chunkSize + event.loaded) / file.size) * 100;
        ui.pBar.value = percent;
        ui.percentEle.textContent = percent.toFixed(1) + "%";
        let speed =
          event.loaded / (1024 * 1024) / ((Date.now() - startTime) / 1000);
        ui.speedEle.textContent = speed.toFixed(2) + "MB/s";
      }
    };
    xhr.onerror = () => {
      this.showOnError();
      reject();
    };
    xhr.onabort = () => {
      reslove(totalchunk);
      console.log("canceled")
    };

    xhr.onload = () => {
      if (isLastchunk) {
        this.showOnSuccess(state.xhr.responseText);
        reslove(state.xhr.responseText);
        this.hideInfo_Div(1000);
      } else {
        reslove(Number(state.xhr.getResponseHeader("index")));
      }
    };
    xhr.send(filePart);
  });
};
FileTransfer.prototype.onCancelBtn = async function (event) {
  event.stopPropagation();
  const state = this.state;
  const ui = this.ui;
  const file = this.file;
  await cancelSending(state.xhr);
  ui.cancelBtn.disabled = true;
  ui.cancelBtn.style.display = "none";
  this.sendBtnText("Canceled")
  this.replaceClassName(ui.sendBtn,
    /text-primary|text-error|text-info/,
    "text-warning"
  );
  this.infoAlertText("⚠️ Canceled By User.");
  this.replaceClassName(ui.infoAlert,
    /alert-info|alert-error/,
    "alert-warning"
  );
  this.replaceClassName(ui.pBar,
    /progress-primary|progress-error|progress-info/,
    "progress-warning"
  );
  ui.sendBtn.disabled = true;
  state.canceled = true;
  this.hideInfo_Div(1000)
}
FileTransfer.prototype.attachEvents = function () {
  const ui = this.ui;
  const state = this.state;

  ui.sendBtn.onclick = (event) => {
    this.OnSendBtn(event)
  }
  ui.nameRow.onclick = this.showHide_info_Div.bind(this);
}


FileTransfer.prototype.showHide_info_Div = function (event) {
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

FileTransfer.prototype.showOnSuccess = function (responseText) {
  const ui = this.ui
  this.replaceClassName(ui.sendBtn,
    /text-primary|text-secondary|text-info/,
    "text-success"
  );
  this.replaceClassName(ui.pBar,
    /progress-primary|progress-secondary|progress-info/,
    "progress-success"
  );
  this.sendBtnText(responseText)
  this.infoAlertText("✅Successfully Sended");
  this.replaceClassList(ui.infoRow, "alert-info", "alert-success");
  ui.cancelBtn.className = "hidden";
  ui.sendBtn.disabled = true;
}
FileTransfer.prototype.showOnError = function () {
  const ui = this.ui
  this.sendBtnText("Retry");
  this.replaceClassName(ui.sendBtn,
    /text-primary|text-secondary|text-info/,
    "text-error"
  );
  this.replaceClassName(ui.sendBtn, /btn-dash/, "btn-outline");
  this.replaceClassName(ui.pBar,
    /progress-primary|progress-secondary|progress-info/,
    "progress-error"
  );
  this.infoAlertText("🚫Error While Sending");
  this.replaceClassList(ui.infoAlert, "alert-info", "alert-error");
}
FileTransfer.prototype.showOnStart = function () {
  const ui = this.ui;
  this.sendBtnText("Pause");
  this.replaceClassName(ui.sendBtn,
    /text-primary|text-secondary|text-error/,
    "text-info"
  );
  this.replaceClassName(ui.sendBtn, /btn-outline/, "btn-dash");
  this.replaceClassName(ui.pBar,
    /progress-primary|progress-error/,
    "progress-info"
  );
  this.infoAlertText("Sending To PC");
  this.replaceClassName(ui.infoAlert,
    /alert-error/,
    "alert-info"
  );
  ui.cancelBtn.disabled = false;
}

//xhr = xmlHttpReq, pBar = progress bar Element, percentEle = percent Elemet

async function cancelSending(xhr) {
  return new Promise((reslove, reject) => {
    if (!xhr) {
      reject();
    }
    xhr.abort();
    reslove()
  });
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

  const sendBtn = el("button", {
    className: "btn btn-sm  btn-outline text-primary",
  }, "Send");
  const pRow = el("div", {
    className: "flex flex-row justify-center items-center",
  });
  const pBar = el("progress", {
    max: 100,
    value: 0,
    className: " progress progress-info  h-2 md:h-3  mr-4",
  });
  const percentEle = el("p", { className: "p-1", textContent: "0%" });

  const speedEle = el("p", { className: "p-1", textContent: "0.00MB/s" });

  const infoAlert = el("div", {
    className: "alert alert-info alert-soft alert-horizontal p-2 text-[0.85rem] md:text-[0.9rem]",
    textContent: "Uploading file to Server",
  });

  const cancelBtn = el(
    "button",
    {
      className: "btn btn-dash btn-sm text-error",
    },
    "Cancle"
  );

  const infoRow = el(
    "div",
    {
      className: "flex flex-row justify-center gap-4 items-center",
    },
    infoAlert,
    el("div", {}, cancelBtn)
  );

  const info_Div = el("div", {
    className:
      " flex-col justify-start align-start transition-all  ease-in-out duration-[500ms] scale-y-100",
  });

  let fileSize = (file.size / (1024 * 1024)).toFixed(2) + "MB";
  if (file.size / (1024 * 1024) < 1)
    fileSize = (file.size / 1024).toFixed(2) + "KB";

  pRow.appendChild(pBar);
  pRow.appendChild(percentEle);
  pRow.appendChild(speedEle);

  nameRow.appendChild(nameText);
  nameRow.appendChild(sendBtn);
  nameText.textContent = memtype.addEmoji(file.name) + file.name + `(${fileSize})`;
  oneFileSet.appendChild(nameRow);

  info_Div.style.display = "none";

  info_Div.appendChild(pRow);
  info_Div.appendChild(infoRow);
  oneFileSet.appendChild(info_Div);
  return {
    oneFileSet, nameRow, nameText, sendBtn, pRow,
    pBar, percentEle, speedEle,
    infoAlert, cancelBtn, infoRow, info_Div
  }
}
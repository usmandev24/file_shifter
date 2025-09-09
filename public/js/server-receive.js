const emitter = new EventTarget();
const showDiv = document.getElementById('show-div')
class FileUi {
  constructor(file) {
    this.file = file;
    this.ui = createFileUi(file);
  }
  update(file) {
    this.file = file;
    let percent = file.percent
    const ui = this.ui;
    ui.pBar.value = percent.toFixed(0)
    ui.percentEle.textContent = percent.toFixed(1)
    ui.statusBtn.textContent = file.status;
  }
}
function showUpdates() {
  let allFileStatus = {};
  emitter.addEventListener("new", (event) => {
    let file = event.detail;
    let key = file.name+file.size;
    if (!Object.hasOwn(allFileStatus, key)) {
      allFileStatus[key] = new FileUi(file);

    } else {
      allFileStatus[key].update(file);
    }
  })
}
async function getStats() {
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
  const statusBtn = el("button", {
    className: "btn btn-sm md:btn-md  btn-outline text-primary",
  });
  const pRow = el("div", {
    className: "flex flex-row justify-center items-center",
  });
  const pBar = el("progress", {
    max: 100,
    value: 0,
    className: " progress progress-info  h-3 md:h-4  mr-4",
  });
  const percentEle = el("p", { className: "p-1 md:p-2", textContent: "0%" });

  const speedEle = el("p", { className: "p-1 md:p-2", textContent: "0.00MB/s" });

  const infoAlert = el("div", {
    className: "alert alert-info alert-soft alert-horizontal",
    textContent: "Uploading file to Server",
  });

  

  const infoRow = el(
    "div",
    {
      className: "flex flex-row justify-center gap-4 items-center",
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
  pRow.appendChild(percentEle);
  pRow.appendChild(speedEle);

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
    pBar, percentEle, speedEle,
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
getStats();
showUpdates()
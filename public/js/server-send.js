const file_input = document.getElementById("file-input");
const show_files = document.getElementById("show-files");
const emitter = new EventTarget()
file_input.onchange = show;

function show() {
  Array.from(file_input.files).forEach(async (file, index) => {
    const fileClass = new File(file);
    await makeShareAble(file, fileClass);
    
  })
}

class File {
  constructor(file, status = null) {
    this.file = file;
    this.status = status
    this.ui = createFileUi(file);
  }
  update(status) {
    const ui = this.ui
    if (status === "loaded") {
      ui.loading.style.display = "none";
      ui.statusBtn.style.display = "inline-flex"
    }
  }
  setDisplay(ele, value) {
    
  }
}

async function makeShareAble(file, fileClass) {
  const stream = file.stream();
  await fetch('/receive-from-server/make', {
    method: "POST", 
    body: stream,
    headers: {
      "filename": file.name,
      "filesize": file.size
    }
  })
}
function createFileUi(file) {
  //Dom Elements ;
  const oneFileSet = el("div", {
    className:
      "flex flex-col gap-1  w-full p-2 mt-3 border border-base-200 bg-base-100 rounded-lg ",
  });
  const nameRow = el("div", {
    className: "flex justify-between  break-all items-center",
  });
  const nameText = document.createElement("h3");
  nameText.className = "text-[0.85rem] text-info font-bold md:text-[1rem]";
  const statusBtn = el("button", {
    className: "btn btn-sm md:btn-md  btn-outline text-primary",
    disabled: true,
  });
  statusBtn.style.display = "none";
  const loading = el("span", {
    className: "loading loading-spinner text-success"
  })
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
  nameRow.appendChild(loading)
  nameText.textContent = file.name + `(${fileSize})`;
  oneFileSet.appendChild(nameRow);


  info_Div.appendChild(pRow);
  info_Div.appendChild(infoRow);
  oneFileSet.appendChild(info_Div);
  show_files.appendChild(oneFileSet);
  return {
    oneFileSet, nameRow, nameText, statusBtn, loading, pRow,
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
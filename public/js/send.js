const file_input = document.getElementById("file-input");
const show_files = document.getElementById("show-files");
const emitter = new EventTarget();
const source = new EventSource("/relay-from-server/status")
file_input.onchange = show;

let allFileSets = {}

function show() {
  Array.from(file_input.files).forEach(async (file, index) => {
    const fileSet = new File(file, "");
    const key = file.name + `(${calcSize(file.size)})`
    allFileSets[key] = fileSet;
    let made = new Make(file);
    made.makeShareAble();
    
  })
}

class File {
  constructor(file, status = null) {
    this.file = file;
    this.status = status
    this.ui = createFileUi(file);
    this.count = 0;
  }
  update(status) {
    const ui = this.ui
    if (status === "pending") {
      ui.loading.style.display = "none";
      ui.statusBtn.style.display = "inline-flex";
      ui.statusBtn.textContent = "pending";

    } else if (status === "sending") {
      ui.loading.style.display = "inline-block";
      ui.statusBtn.textContent = "sending";

    } else if (status === "completed") {
      this.count += 1;
      ui.loading.style.display = "none";
      ui.statusBtn.textContent = `${this.count}_✅`;
    }

  }
  setDisplay(ele, value) {
    [ele].style.display = value
  }
  setText(ele, text) {
    [ele].textContent = text
  }
}

class Make {
  constructor(file) {
    this.file = file
  }
  async makeShareAble() {
    let file = this.file
    const stream = file.stream();
    fetch('/relay-from-server/make', {
      method: "POST",
      body: file,
      headers: {
        "filename": file.name,
        "filesize": file.size
      }
    });
  }
}


source.addEventListener("update", (event) => {
  const obj = JSON.parse(event.data)
  console.log(obj)
  const key = Object.keys(obj)[0];
  allFileSets[key].update(obj[key]);
})

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
  const loading = el("span", {
    className: "loading loading-spinner text-success"
  })
  const statusBtn = el("button", {
    className: "btn btn-sm md:btn-md  btn-outline text-primary",
    disabled: true,
  }, loading);

  let fileSize = (file.size / (1024 * 1024)).toFixed(2) + "MB";
  if (file.size / (1024 * 1024) < 1)
    fileSize = (file.size / 1024).toFixed(2) + "KB";

  nameRow.appendChild(nameText);
  nameRow.appendChild(statusBtn);
  nameText.textContent = file.name + `(${fileSize})`;
  oneFileSet.appendChild(nameRow);
  show_files.appendChild(oneFileSet);
  return {
    oneFileSet, nameRow, nameText, statusBtn, loading
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
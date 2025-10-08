
async function getfpId() {
  const fp = FingerprintJS;
  let load = await fp.load()
  let data = await load.get();
  console.log(data)
  return data
}
const link = document.createElement("a");
const info = document.getElementById("p");

async function sendID() {
  const id = await getfpId()
  let res = await fetch("/set-device-id", {
    headers: {
      "id": id.visitorId
    }
  });
  res = JSON.parse(await res.text())
  if (res.status === "ok") {
    localStorage.setItem("deviceName", res.name)
    link.href = "/"
    info.textContent = "✅ complete"
    setTimeout(() => {
      link.click()
    }, 2000);
  } else {
    link.href = "/edit-device-name"
    info.textContent = "ℹ️ You have to Set device name first"
    setTimeout(() => {
      link.click()
    }, 2000);
  }
}

window.onload = sendID
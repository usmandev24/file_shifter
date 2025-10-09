//-------------------------------------------------------------------------------------
//   GNU GENERAL PUBLIC LICENSE  Version 3, 29 June 2007. see Licence file for detail.
//
//                Copyright (c) 2025 Usman Ghani (usmandev24) 
//--------------------------------------------------------------------------------------


const link = document.createElement("a");
const info = document.getElementById("p");

async function verify() {
  
  let res = await fetch("/set-device-id");
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

window.onload = verify;
export default function queryParser(link) {
  let q = link.slice(link.indexOf("?") + 1);
  let qlist = q.split("&");
  let obj = {}
  qlist.forEach((v, i) => {
    let key = v.slice(0, v.indexOf("="));
    let value = v.slice(v.indexOf("=") + 1)
    obj[key] = decodeURIComponent(value)
  });
  return obj;
}

export default function cookieParser(cookie) {
  if (!cookie) return undefined;
  let parsered = Object.create(null)
  let items = cookie.split(";");
  items.forEach(v => {
    v = v.trim()
    let r = v.split("=")
    parsered[r[0]] = r[1];
  });
  return parsered
};
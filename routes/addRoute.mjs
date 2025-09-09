export let routes = []
export function addRoute(url, handler) {
  routes.push({ url, handler })
}

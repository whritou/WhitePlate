// Process-local DNS for browser acceptance fixtures; never load in deployment.
// Node's --require preloader contract requires this CommonJS module.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dns = require("node:dns")
const lookup = dns.lookup
dns.lookup = function (hostname, options, callback) {
  if (hostname === "bistro.localhost" || hostname === "harbor.localhost") {
    if (typeof options === "function") callback = options
    if (options?.all) callback(null, [{ address: "127.0.0.1", family: 4 }])
    else callback(null, "127.0.0.1", 4)
    return
  }
  return lookup.apply(this, arguments)
}

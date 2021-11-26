import { getConfig, validateToken, convertConfigIntoParameters } from "./env"
import fs from "fs"
import { spawn } from "child_process"
import { chalker } from "chalk-with-markers"

console.log()
console.log(chalker.colorize("[g]Starting Hubot..."))
console.log()

// load config for .env file - they are optional
const config = getConfig("./.env")

// will exit with error message when invalid!
validateToken(config)

// convert config into Hubot start
const params = convertConfigIntoParameters(config)
params.push("hubot")
params.push("--adapter")
params.push("slack")
params.push("--disable-httpd")

function startHubot() {
  // dist directory must be available
  if (params.indexOf("ENVIRONMENT=local") != -1) {
    fs.copyFileSync("./external-scripts.json", "./dist/external-scripts.json")
  }

  // change directory because of Typescript, must be done
  // after loading config, because the config is located in
  // the root!
  process.chdir("dist/")

  // feed it to cross env - this will start Hubot with Slack
  require("cross-env")(params)
}

if (process.env.TS_NODE_DEV) {
  let npm = /^win/.test(process.platform) ? "npm.cmd" : "npm"
  spawn(npm, ["run", "build", "--silent"], { stdio: "inherit" }).on(
    "close",
    () => startHubot()
  )
} else {
  startHubot()
}

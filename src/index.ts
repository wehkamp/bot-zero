import {
  getConfig,
  validateToken,
  convertConfigIntoCrossEnvParameters,
} from "./env"
import fs from "fs"
import { spawn } from "child_process"
import { chalker } from "chalk-with-markers"

function startHubot(params: string[]) {
  // dist directory must be available, it is after building
  if (process.env.TS_NODE_DEV) {
    fs.copyFileSync("./external-scripts.json", "./dist/external-scripts.json")
  }

  // change directory because of Typescript, must be done
  // after loading config, because the config is located in
  // the root!
  process.chdir("dist/")

  console.log(chalker.colorize("[b]Starting..."))

  // feed it to cross env - this will start Hubot with Slack
  require("cross-env")(params)
}

// load config for .env file - they are optional
const config = getConfig("./.env")

// will exit with error message when invalid!
validateToken(config)

// convert config into Hubot start
const params = convertConfigIntoCrossEnvParameters(config)
params.push("hubot")
params.push("--adapter")
params.push("slack")
params.push("--disable-httpd")

// if we are started by ts-node-dev, we need to
// do a build first, so we have a filled scripts
// directory for Hubot
if (process.env.TS_NODE_DEV) {
  console.log()
  console.log(chalker.colorize("[p]Compiling..."))

  let npm = /^win/.test(process.platform) ? "npm.cmd" : "npm"
  spawn(npm, ["run", "build", "--silent"], { stdio: "inherit" }).on(
    "close",
    () => startHubot(params)
  )
} else {
  startHubot(params)
}

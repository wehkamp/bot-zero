import dotenv from "dotenv"
import { validateConfig } from "./env"
dotenv.config()
validateConfig()

import path from "path"
import removeMarkDown from "remove-markdown"
import { asciiArtChalker, chalker } from "chalk-with-markers"
import {
  removeTrailingBotWhitespaceCharactersFromIncomingMessages,
  removeTrailingWhitespaceCharactersFromIncomingMessages
} from "hubot-command-mapper"
import { start } from "./common/BotZero"

// start bot async
;(async () => {
  process.on("SIGTERM", () => process.exit())

  let scriptsPath = path.join(__dirname, "scripts")
  let externalScriptsJsonFile = process.env.TS_NODE_DEV
    ? path.join(__dirname, "..", "external-scripts.json")
    : path.join(__dirname, "..", "..", "external-scripts.json")

  let { info, robot } = await start(scriptsPath, externalScriptsJsonFile)

  // register middleware
  removeMarkdownFromInput(robot)
  removeTrailingWhitespaceCharactersFromIncomingMessages(robot)
  removeTrailingBotWhitespaceCharactersFromIncomingMessages(robot)

  splash()

  console.log(
    // debug info
    chalker.colorize(`
[q]Bot name: [y]@${info.botName}
[q]App URL:  [y]${info.appUrl}
[q]Version:  [y]${process.env.npm_package_version}
[q]PID:      [y]${process.pid}

[g]Started!`)
  )
})()

function splash() {
  console.log(
    asciiArtChalker.colorize(`
ppp__________        __    __________
b\\______   \\ _____/  |_  \\____    /___________  bbb____
cc |    |  _//  _ \\   __\\   /     // __ \\_  __ \\/  _ \\
pp |    |   (  <_> )  |    pp/     /p\\  ___/|  | \\(  <_> )
b |______  /\\____/|__|   pp/_______b \\___  >__|   \\____/  y[v4]
ccc        \\/            c          \\/   \\/
  `)
  )

  console.log("⚡ Powered with Slack Bolt + Hubot Command Mapper ⚡")
}

function removeMarkdownFromInput(robot: Hubot.Robot) {
  if (!robot) throw "Argument 'robot' is empty."

  robot.receiveMiddleware(async context => {
    const text = context.response.message.text
    if (text) {
      let newText = removeMarkDown(text)
      if (text != newText) {
        context.response.message.text = newText
      }
    }

    return true
  })
}

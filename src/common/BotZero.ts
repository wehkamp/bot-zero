import fs from "fs"
import path from "path"
import pino from "pino"
import { createUpdatableMessage, UpdatableMessage } from "./UpdatableMessage"
import { createWebClient, uploadByContext } from "./slack"
import { IContext } from "hubot-command-mapper"
import { Message } from "hubot"
import { Robot } from "hubot/es2015"
import { SocketModeReceiver } from "@slack/bolt"
import { WebAPICallResult, WebClient } from "@slack/web-api"

export type BotZero = Hubot.Robot & {
  readonly app: SocketModeReceiver
  readonly client: WebClient

  upload(
    context: IContext,
    comment: string,
    fileName: string,
    data: Buffer | string,
    thread_ts?: string,
    filetype?: string
  ): Promise<WebAPICallResult>

  createUpdatableMessage(channel: IContext | string): UpdatableMessage
  createUpdatableMessage(channel: IContext | string, initialMessage: Message | string): UpdatableMessage
}

const HUBOT_SLACK_ADAPTER = "@hubot-friends/hubot-slack"

class MyBotZero extends Robot {
  app: SocketModeReceiver
  client: WebClient

  constructor(name: string) {
    super(HUBOT_SLACK_ADAPTER, false, name)
  }

  async start(scriptsDir: string, externalScriptsJsonFile: string) {
    let bot = <any>this

    await bot.loadAdapter()

    if (process.env.TS_NODE_DEV || process.env.ENVIRONMENT == "local") {
      bot.logger = pino({
        name: bot.name,
        level: process.env.HUBOT_LOG_LEVEL || "warn",
        transport: {
          target: "pino-pretty",
        },
      })

      Reflect.defineProperty(bot.logger, "warning", {
        value: bot.logger.warn,
        enumerable: true,
        configurable: true,
      })
    }

    this.app = bot.adapter.socket
    this.client = bot.adapter.client.web

    // Read all files in the scripts directory
    let files = await fs.promises.readdir(scriptsDir)
    files
      .filter(file => path.extname(file) == ".ts" || path.extname(file) == ".js")
      .sort()
      .map(file => path.resolve(scriptsDir, file))
      .forEach(file => {
        // Load and run the default export from the TypeScript file

        try {
          const script = require(file)

          if (script.default) {
            script.default(this)
          } else {
            script(this)
          }

          // TODO: add to Hubot typings?
          bot.parseHelp(file)
        } catch (ex) {
          ;(bot as Hubot.Robot).logger.error(ex, "Could not load script: " + file)
          throw ex
        }
      })

    //

    let externalScriptsExists = await fs.promises
      .access(externalScriptsJsonFile)
      .then(() => true)
      .catch(() => false)

    if (!externalScriptsExists) return

    let externalJsonBuffer = await fs.promises.readFile(externalScriptsJsonFile)
    try {
      require("coffeescript/register")
      bot.loadExternalScripts(JSON.parse(externalJsonBuffer.toString()))
    } catch (error) {
      console.error(`Error parsing JSON data from external-scripts.json: ${error}`)
      process.exit(1)
    }

    bot.run()
  }

  upload(
    context: IContext,
    comment: string,
    fileName: string,
    data: Buffer | string,
    thread_ts?: string,
    filetype?: string
  ) {
    return uploadByContext(context, comment, fileName, data, thread_ts, filetype)
  }

  createUpdatableMessage(channel: string | IContext, initialMessage: Message | string = null) {
    return createUpdatableMessage(channel, initialMessage)
  }

  asBotZero() {
    return this as unknown as BotZero
  }
}

export async function start(scriptsDir: string, externalScriptsJsonFile: string) {
  // So we need to get the name of the bot
  // when we start the bot, otherwise command
  // mapping will not be successful
  let client = createWebClient()
  let info = await getBotInfo(client)

  // init bot
  var robot = new MyBotZero(info.botName)
  await robot.start(scriptsDir, externalScriptsJsonFile)

  return {
    robot: robot as unknown as BotZero,
    info
  }
}

async function getBotInfo(client: WebClient): Promise<BotInfo> {
  const auth = await client.auth.test()
  const info = await client.bots.info({
    bot: auth.bot_id
  })

  return {
    botId: auth.bot_id,
    botUserId: info.bot?.user_id,
    botName: auth.user,
    appId: info.bot?.app_id,
    appUrl: "https://api.slack.com/apps/" + info.bot?.app_id
  }
}

type BotInfo = {
  botId: string
  botUserId: string
  botName: string
  appId: string
  appUrl: string
}

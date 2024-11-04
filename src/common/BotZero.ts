import fs from "fs"
import path from "path"
import pino from "pino"
import { createUpdatableMessage, UpdatableMessage } from "./UpdatableMessage"
import { createWebClient, uploadByContext } from "./slack"
import { IContext } from "hubot-command-mapper"
import { Message } from "hubot"
import { Robot } from "hubot/es2015"
import { App, SocketModeReceiver } from "@slack/bolt"
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
  client: WebClient
  app: App

  constructor(name: string) {
    super(HUBOT_SLACK_ADAPTER, false, name)
  }

  async start(scriptsDir: string, externalScriptsJsonFile: string) {
    let bot = <any>this

    await bot.loadAdapter()

    this.initLogging()
    await this.loadLocalScripts(scriptsDir)
    await this.loadExternalScripts(externalScriptsJsonFile)

    bot.run()

    this.app = await this.startBoltApp();
    this.client = bot.adapter.client.web
  }

  private initLogging() {
    const isLocal = process.env.TS_NODE_DEV || process.env.ENVIRONMENT == "local"
    if (!isLocal) return

    const bot = this as any

    bot.logger = pino({
      name: bot.name,
      level: process.env.HUBOT_LOG_LEVEL || "warn",
      transport: {
        target: "pino-pretty"
      }
    })

    Reflect.defineProperty(bot.logger, "warning", {
      value: bot.logger.warn,
      enumerable: true,
      configurable: true
    })
  }

  private async loadLocalScripts(scriptsDir: string) {

    // todo: check if we can use the default from Hubot
    const bot = this.asHubot();

    // Read all files in the scripts directory
    let files = await fs.promises.readdir(scriptsDir)
    files
      .filter(file => path.extname(file) == ".ts" || path.extname(file) == ".js")
      .sort()
      .map(file => path.resolve(scriptsDir, file))
      .forEach(file => {
        try {
          const script = require(file)

          // Load and run the default export from the TypeScript file
          if (script.default) {
            script.default(this)
          } else {
            script(this)
          }

          (bot as any).parseHelp(file)
        } catch (ex) {
          bot.logger.error(ex, "Could not load script: " + file)
          throw ex
        }
      })
  }

  private async loadExternalScripts(externalScriptsJsonFile: string) {
    let externalScriptsExists = await fs.promises
      .access(externalScriptsJsonFile)
      .then(() => true)
      .catch(() => false)

    if (!externalScriptsExists) return

    let bot = this.asHubot();

    let externalJsonBuffer = await fs.promises.readFile(externalScriptsJsonFile)
    try {
      require("coffeescript/register")
      let json = JSON.parse(externalJsonBuffer.toString())
      bot.loadExternalScripts(json)
    } catch (ex) {
      bot.logger.error(ex, "Could not load external scripts from: " + externalScriptsJsonFile)
      throw ex
    }
  }

  private async startBoltApp() {
    return new Promise<App>(resolve => {
      const adapter = <any>this.asBotZero().adapter

      // when the adapter connects we can init the app:
      adapter.on("connected", async () => {
        const socket = adapter.client.socket

        // when the app is created, an init is called; there is
        // none on the socket, so add one:
        socket.init = (app: App) => {
          socket.on("slack_event", app.processEvent, app)
        }

        // create the Bolt app and reuse the socket from the adapter:
        this.app = new App({
          receiver: socket,
          deferInitialization: true, // socket does the init
          token: process.env.HUBOT_SLACK_BOT_TOKEN,
          appToken: process.env.HUBOT_SLACK_APP_TOKEN,
          signingSecret: process.env.SLACK_SIGNING_SECRET
        })

        // we need to init manually:
        await this.app.init()

        resolve(this.app)
      })
    })
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

  asHubot() {
    return this as unknown as Hubot.Robot
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

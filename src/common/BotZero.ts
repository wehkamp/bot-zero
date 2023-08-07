import fs from "fs"
import path from "path"
import { alias, IContext, IOptions, IParameter, ITool, map_command, map_tool } from "hubot-command-mapper"
import { FilesUploadArguments, WebClient, WebAPICallResult } from "@slack/web-api"
import { Message } from "hubot"
import { Robot } from "hubot/es2015"
import { SocketModeReceiver } from "@slack/bolt"
import { UpdatableMessage } from "./UpdatableMessage"

export type BotZero = Hubot.Robot & {
  readonly app: SocketModeReceiver
  readonly client: WebClient

  mapCommand(command: string, ...args: (IParameter | ChatCallback | IOptions)[]): void
  mapTool(tool: ChatTool, options?: IOptions): void
  mapAlias(map: Record<string, string>, options?: IOptions): void
  upload(context: ChatContext, comment: string, fileName: string, data: Buffer | string, thread_ts?: string, filetype?: string): Promise<WebAPICallResult>

  createUpdatableMessage(channel: ChatContext | string): UpdatableMessage
  createUpdatableMessage(channel: ChatContext | string, initialMessage: Message | string): UpdatableMessage
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

    await bot.loadAdapter(HUBOT_SLACK_ADAPTER)

    this.app = bot.adapter.socket
    this.client = bot.adapter.client.web

    // Read all files in the scripts directory
    let files = await fs.promises.readdir(scriptsDir)
    files
      .filter(file => path.extname(file) == ".ts")
      .sort()
      .map(file => path.resolve(scriptsDir, file))
      .forEach(file => {
        // Load and run the default export from the TypeScript file
        const script = require(file)
        script(this)

        // TODO: add to Hubot typings?
        bot.parseHelp(file)
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

  mapCommand(command: string, ...args: (IParameter | ChatCallback | IOptions)[]): void {
    let callback = args.find(a => a instanceof Function) as ChatCallback
    if (!callback) throw "Missing callback function."

    let applyArgs = []
    applyArgs.push(this)
    applyArgs.push(command)
    applyArgs = applyArgs.concat(args.filter(a => !(a instanceof Function)))
    applyArgs.push((context: IContext) => callback(new HubotChatContext(context, this.asBotZero())))

    map_command.apply(this, applyArgs)
  }

  mapTool(tool: ChatTool, options?: IOptions) {
    // map the ChatTool to a ITool
    var theTool = <ITool>{
      name: tool.name,
      commands: tool.commands.map(command => ({
        name: command.name,
        auth: command.auth,
        parameters: command.parameters,
        alias: command.alias,
        execute: context => command.execute(new HubotChatContext(context, this.asBotZero())),
      })),
      auth: tool.auth,
    }

    map_tool(this as any, theTool, options)
  }

  mapAlias(map: Record<string, string>, options?: IOptions) {
    alias(this as any, map, options)
  }

  upload(context: ChatContext, comment: string, fileName: string, data: Buffer | string, thread_ts?: string, filetype?: string) {
    let options: FilesUploadArguments = {
      filename: fileName,
      channel_id: context.channel,
      initial_comment: comment,
      title: fileName,
    }

    if (data instanceof Buffer) {
      options.file = data
    } else {
      options.content = data
      options.filetype = filetype
    }

    if (thread_ts != null) {
      options.thread_ts = thread_ts.toString()
    } else if (context.thread_ts != null) {
      options.thread_ts = context.thread_ts.toString()
    }

    return this.client.files.uploadV2(options)
  }

  createUpdatableMessage(channel: string | ChatContext, initialMessage: Message | string = null) {
    let channelId = ""
    let thread_ts = null

    if (typeof channel === "string") {
      channelId = channel
    } else {
      channelId = channel.channel
      thread_ts = channel.thread_ts
    }

    let msg = new UpdatableMessage(this.client, channelId, null, thread_ts)
    if (initialMessage) {
      msg.send(initialMessage)
    }
    return msg
  }

  asBotZero() {
    return this as unknown as BotZero
  }
}

class HubotChatContext implements ChatContext {
  readonly values: Record<string, any>
  readonly channel: string
  readonly thread_ts: string
  readonly message: Message

  constructor(private context: IContext, public robot: BotZero) {
    this.values = context.values
    this.channel = context.res.message.room
    this.thread_ts = (<any>context.res.message).thread_ts
    this.message = context.res.message
  }

  reply(str: string): void {
    this.context.res.reply(str)
  }
  emote(str: string): void {
    this.context.res.emote(str)
  }

  createUpdatableMessage(initialMessage: Message | string = null): UpdatableMessage {
    return this.robot.createUpdatableMessage(this, initialMessage)
  }

  upload(comment: string, fileName: string, data: string | Buffer, thread_ts?: string, filetype?: string): Promise<WebAPICallResult> {
    return this.robot.upload(this, comment, fileName, data, thread_ts, filetype)
  }
}

export type ChatTool = {
  name: string
  commands: ChatCommand[]
  auth?: string[]
}

export type ChatCommand = {
  name: string
  auth?: string[]
  parameters?: IParameter[]
  alias?: string[]
  execute(context: ChatContext): void
}

export type ChatContext = {
  reply(str: string): void
  emote(str: string): void
  readonly values: Record<string, any>
  readonly channel: string
  readonly thread_ts: string
  readonly message: Message
  readonly robot: BotZero
  createUpdatableMessage(): UpdatableMessage
  createUpdatableMessage(initialMessage: Message | string): UpdatableMessage
  upload(comment: string, fileName: string, data: Buffer | string, thread_ts?: string, filetype?: string): Promise<WebAPICallResult>
}

export type ChatCallback = {
  (context: ChatContext): void
}

export type ChatMessage = {
  text: string
}

export type ChatMiddleware = {
  (message: ChatMessage): Promise<void>
}

export async function start(scriptsDir: string, externalScriptsJsonFile: string) {
  // So we need to get the name of the bot
  // when we start the bot, otherwise command
  // mapping will not be successful
  let client = new WebClient(process.env.HUBOT_SLACK_BOT_TOKEN)
  let info = await getBotInfo(client)

  // init bot
  var robot = new MyBotZero(info.botName)
  await robot.start(scriptsDir, externalScriptsJsonFile)

  return {
    robot: robot as unknown as BotZero,
    info,
  }
}

async function getBotInfo(client: WebClient): Promise<BotInfo> {
  const auth = await client.auth.test()
  const info = await client.bots.info({
    bot: auth.bot_id,
  })

  return {
    botId: auth.bot_id,
    botUserId: info.bot?.user_id,
    botName: auth.user,
    appId: info.bot?.app_id,
    appUrl: "https://api.slack.com/apps/" + info.bot?.app_id,
  }
}

export type BotInfo = {
  botId: string
  botUserId: string
  botName: string
  appId: string
  appUrl: string
}

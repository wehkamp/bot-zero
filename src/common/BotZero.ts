import fs from "fs"
import path from "path"
import { alias, IContext, IOptions, IParameter, ITool, map_command, map_tool } from "hubot-command-mapper"
import { FilesUploadArguments, WebClient, WebAPICallResult } from "@slack/web-api"
import { Message } from "hubot"
import { Robot } from "hubot/es2015"
import { SocketModeReceiver } from "@slack/bolt"
import { UpdatableMessage } from "./UpdatableMessage"

export type BotZero = Hubot.Robot & {
  mapCommand(command: string, ...args: (IParameter | ChatCallback | IOptions)[]): void
  mapTool(tool: ChatTool, options?: IOptions): void
  mapAlias(map: Record<string, string>, options?: IOptions): void
  upload(
    context: ChatContext,
    comment: string,
    fileName: string,
    data: Buffer | string,
    filetype?: string
  ): Promise<WebAPICallResult>
  createUpdatableMessage(ChatContext): UpdatableMessage
  createUpdatableMessage(ChatContext, initialMessage: Message): void
}

const HUBOT_SLACK_ADAPTER = "@hubot-friends/hubot-slack"

class MyBotZero extends Robot {
  app: SocketModeReceiver
  client: WebClient

  constructor(name: string) {
    super(HUBOT_SLACK_ADAPTER, false, name)
  }

  async start(scriptsDir: string) {
    let bot = <any>this

    await bot.loadAdapter(HUBOT_SLACK_ADAPTER)

    this.app = bot.adapter.socket
    this.client = bot.adapter.client.web

    // Read all files in the directory
    let files = await fs.promises.readdir(scriptsDir)
    files
      .filter(file => path.extname(file) == ".ts")
      .map(file => path.resolve(scriptsDir, file))
      .forEach(file => {
        // Load and run the default export from the TypeScript file
        const script = require(file)
        script(this)

        // TODO: add to Hubot typings?
        bot.parseHelp(file)
      })

    bot.run()
  }

  mapCommand(command: string, ...args: (IParameter | ChatCallback | IOptions)[]): void {
    let callback = args.find(a => a instanceof Function) as ChatCallback
    if (!callback) throw "Missing callback function."

    let applyArgs = []
    applyArgs.push(this)
    applyArgs.push(command)
    applyArgs = applyArgs.concat(args.filter(a => !(a instanceof Function)))
    applyArgs.push((context: IContext) => callback(new HubotChatContext(context)))

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
        execute: context => command.execute(new HubotChatContext(context))
      })),
      auth: tool.auth
    }

    map_tool(this as any, theTool, options)
  }

  mapAlias(map: Record<string, string>, options?: IOptions) {
    alias(this as any, map, options)
  }

  upload(context: ChatContext, comment: string, fileName: string, data: Buffer | string, filetype?: string) {
    let options: FilesUploadArguments = {
      filename: fileName,
      channel_id: context.channel,
      initial_comment: comment,
      title: fileName
    }

    if (data instanceof Buffer) {
      options.file = data
    } else {
      options.content = data
      options.filetype = filetype
    }

    if (context.thread_ts != null) {
      options.thread_ts = context.thread_ts.toString()
    }

    return this.client.files.uploadV2(options)
  }

  createUpdatableMessage(channel: string | ChatContext, initialMessage: Message = null) {
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
}

class HubotChatContext implements ChatContext {
  values: Record<string, any>
  channel: string
  thread_ts: string

  constructor(private context: IContext) {
    this.values = context.values
    this.channel = context.res.message.room
    this.thread_ts = (<any>context.res.message).thread_ts
  }

  reply(str: string): void {
    this.context.res.reply(str)
  }
  emote(str: string): void {
    this.context.res.emote(str)
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
  values: Record<string, any>
  channel: string
  thread_ts: string
}

export type ChatCallback = {
  (context: ChatContext): void
}

export type ChatMessage = {
  text: string
}

export type ChatMiddleware = {
  (mesage: ChatMessage): Promise<void>
}

export async function start(scriptsDir: string) {
  var robot = new MyBotZero("baymax")
  await robot.start(scriptsDir)

  let info = await getBotInfo(robot.client)
  ;(<any>robot).name = info.botName

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

export type BotInfo = {
  botId: string
  botUserId: string
  botName: string
  appId: string
  appUrl: string
}

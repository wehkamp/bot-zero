import { IContext } from "hubot-command-mapper"
import {
  WebClient,
  WebAPICallResult,
  ChatUpdateArguments,
  ChatPostMessageArguments,
  KnownBlock,
  Block,
} from "@slack/web-api"

export interface ProfileWebAPICallResult extends WebAPICallResult {
  profile: {
    email: string
    real_name: string
    bot_id?: string
    api_app_id?: string
    real_name_normalized?: string
  }
}

export interface ChannelWebAPICallResult extends WebAPICallResult {
  channel: {
    name: string
  }
}

export interface ChatPostMessageWebAPICallResult extends WebAPICallResult {
  channel: string
  ts: string
  message: {
    test: string
    username: string
    bot_id?: string
    attachments: [
      {
        text: string
        id: number
        fallback: string
      }
    ]
    type: string
    subtype: string
    ts: string
  }
}

export interface ChatUpdateMessageWebAPICallResult extends WebAPICallResult {
  channel: string
  ts: string
  text: string
}

export type BlockMessage = {
  text?: string
  blocks?: (KnownBlock | Block)[]
}

type Message =
  | BlockMessage
  | ChatPostMessageArguments
  | ChatUpdateArguments
  | string

type SlackAdapters = {
  web: WebClient
  getBotInfo(): Promise<BotInfo>
}

type BotInfo = {
  botId: string
  botName: string
  appId: string
  appUrl: string
}

export function start(token: string) {
  return <SlackAdapters>{
    web: new WebClient(token),
    getBotInfo: async function () {
      const auth = await this.web.auth.test()
      const info = await this.web.bots.info({
        bot: auth.bot_id,
      })

      return {
        botId: auth.bot_id,
        botName: auth.user,
        appId: info.bot.app_id,
        appUrl: "https://api.slack.com/apps/" + info.bot.app_id,
      }
    },
  }
}

export function createWebClient(token: string = null): WebClient {
  token = token || process.env.HUBOT_SLACK_TOKEN
  return new WebClient(token)
}

export function createUpdatableMessage(channel: string | IContext) {
  let channelId = ""
  let thread_ts = null

  if (isString(channel)) {
    channelId = channel
  } else {
    channelId = (<IContext>channel).res.message.room
    thread_ts = (<any>channel).res.message.thread_ts
  }

  return new UpdatableMessage(createWebClient(), channelId, null, thread_ts)
}

export function upload(
  comment: string,
  fileName: string,
  channel: string,
  buffer: Buffer,
  thread_ts: string,
  filetype: "jpg",
  token: string = null
) {
  return createWebClient(token).files.upload({
    filename: fileName,
    file: buffer,
    channels: channel,
    filetype: filetype,
    initial_comment: comment,
    title: fileName,
    thread_ts: thread_ts,
  })
}

export async function sendMessage(
  webClient: WebClient,
  msg: ChatPostMessageArguments | ChatUpdateArguments
) {
  if (msg.ts) {
    let args = msg as ChatUpdateArguments
    let result = await webClient.chat.update(args)
    return result as ChatUpdateMessageWebAPICallResult
  } else {
    msg.thread_ts = msg.thread_ts || ""
    let args = msg as ChatPostMessageArguments
    let result = await webClient.chat.postMessage(args)
    return result as ChatPostMessageWebAPICallResult
  }
}

function isString(x: any): x is string {
  return typeof x === "string"
}

export class UpdatableMessage {
  private _message: Message
  private _nextMessage: Message
  private _sendingProm: Promise<void> | null
  private _sending = false

  constructor(
    private readonly webClient: WebClient,
    private channel: string,
    private ts: string | null = null,
    private readonly threadTs: string | null = null
  ) {}

  async wait(): Promise<string | null> {
    if (this._sendingProm) {
      await this._sendingProm
    }

    return await delay(500, this.ts)
  }

  async send(msg: Message): Promise<void> {
    // don't send empty or the same message
    if (!msg || msg === this._message) {
      return
    }

    // when sending, add to later
    if (this._sending) {
      this._nextMessage = msg
      await Promise.resolve(this._sendingProm)
      return
    }

    if (isString(msg)) {
      msg = <any>{
        ts: this.ts,
        channel: this.channel,
        text: msg,
        as_user: true,
        thread_ts: this.threadTs,
      }
    } else {
      ;(<any>msg).ts = this.ts
      ;(<any>msg).channel = this.channel
      ;(<any>msg).as_user = true
      ;(<any>msg).thread_ts = this.threadTs
    }

    this._sending = true
    this._message = msg
    this._sendingProm = sendMessage(this.webClient, <any>msg).then(x => {
      this.ts = this.ts || x.ts
      this.channel = this.channel || x.channel
      this._sending = false

      const msg = this._nextMessage
      this._nextMessage = null
      return this.send(msg)
    })

    await this._sendingProm
  }

  getTs() {
    return this.ts
  }

  getChannel() {
    return this.channel
  }

  async delete() {
    if (this._sendingProm) {
      await this._sendingProm
    }

    await this.webClient.chat.delete({
      ts: this.ts,
      channel: this.channel,
    })
  }
}

export function delay<T>(ms: number, val: T = null): Promise<T> {
  return new Promise<T>(r => {
    setTimeout(() => {
      r(val)
    }, ms)
  })
}

import { IContext } from "hubot-command-mapper"
import {
  WebClient,
  WebAPICallResult,
  ChatUpdateArguments,
  ChatPostMessageArguments,
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

interface ISlackAdapters {
  port: string
  web: WebClient
  getBotInfo(): Promise<IBotInfo>
}

interface IBotInfo {
  botId: string
  botName: string
  appId: string
  appUrl: string
}

export function start(token: string): ISlackAdapters {
  const result: ISlackAdapters = <any>{
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

  return result
}

export function createWebClient(token: string = null): WebClient {
  token = token || process.env.HUBOT_SLACK_TOKEN
  return new WebClient(token)
}

export function createUpdatableMessage(channel: string | IContext) {
  let channelId = ""
  let thread_ts = null

  if ((<any>channel).res) {
    channelId = (<IContext>channel).res.message.room
    thread_ts = (<any>channel).res.message.thread_ts
  } else {
    channelId = <string>channel
  }

  return new UpdatableMessage(createWebClient(), channelId, null, thread_ts)
}

export async function upload(
  comment: string,
  fileName: string,
  channel: string,
  buffer: Buffer,
  thread_ts: string
) {
  const web = createWebClient()
  await web.files.upload({
    filename: fileName,
    file: buffer,
    channels: channel,
    filetype: "jpg",
    initial_comment: comment,
    title: fileName,
    thread_ts: thread_ts,
  })
}

export async function sendMessage(
  webClient: WebClient,
  msg: ChatPostMessageArguments | ChatUpdateArguments
): Promise<
  ChatPostMessageWebAPICallResult | ChatUpdateMessageWebAPICallResult
> {
  if (msg.ts) {
    return (await webClient.chat.update(
      msg as ChatUpdateArguments
    )) as ChatUpdateMessageWebAPICallResult
  }

  msg.thread_ts = msg.thread_ts || ""

  return (await webClient.chat.postMessage(
    msg as ChatPostMessageArguments
  )) as ChatPostMessageWebAPICallResult
}

function isString(value) {
  return typeof value === "string" || value instanceof String
}

export class UpdatableMessage {
  private _channel: string
  private _ts: string | null
  private _message: any
  private _nextMessage: any
  private _sendingProm: Promise<void> | null
  private _sending: boolean
  private _webClient: WebClient
  private _threadTs: string

  constructor(
    webClient: WebClient,
    channel: string,
    ts: string | null = null,
    threadTs: string | null = null
  ) {
    this._channel = channel
    this._ts = ts
    this._threadTs = threadTs
    this._message = null
    this._nextMessage = null
    this._sendingProm = null
    this._sending = false
    this._webClient = webClient
  }

  async wait(): Promise<string | null> {
    if (this._sendingProm != null) {
      await this._sendingProm
    }

    return await delay(500, this._ts)
  }

  async send(
    msg: ChatPostMessageArguments | ChatUpdateArguments | string
  ): Promise<void> {
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
        ts: this._ts,
        channel: this._channel,
        text: msg,
        as_user: true,
        thread_ts: this._threadTs,
      }
    } else {
      ;(<any>msg).ts = this._ts
      ;(<any>msg).channel = this._channel
      ;(<any>msg).as_user = true
      ;(<any>msg).thread_ts = this._threadTs
    }

    this._sending = true
    this._message = msg
    this._sendingProm = sendMessage(this._webClient, <any>msg).then(x => {
      this._ts = this._ts || x.ts
      this._channel = this._channel || x.channel
      this._sending = false

      const msg = this._nextMessage
      this._nextMessage = null
      return this.send(msg)
    })

    await this._sendingProm
  }

  getTs() {
    return this._ts
  }

  getChannel() {
    return this._channel
  }

  async delete() {
    if (this._sendingProm) {
      await this._sendingProm
    }

    await this._webClient.chat.delete({
      ts: this._ts,
      channel: this._channel,
    })
  }
}

export function delay<T>(ms: number, val: T): Promise<T> {
  return new Promise<T>(r => {
    setTimeout(() => {
      r(val)
    }, ms)
  })
}

import {
  Block,
  ChatPostMessageArguments,
  ChatUpdateArguments,
  KnownBlock,
  WebAPICallResult,
  WebClient,
} from "@slack/web-api"
import { IContext } from "hubot-command-mapper"
import { createWebClient } from "./slack"

export type ChatPostMessageWebAPICallResult = WebAPICallResult & {
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

export type ChatUpdateMessageWebAPICallResult = WebAPICallResult & {
  channel: string
  ts: string
  text: string
}

export type BlockMessage = {
  text?: string
  blocks?: (KnownBlock | Block)[]
}

export type Message =
  | BlockMessage
  | ChatPostMessageArguments
  | ChatUpdateArguments
  | string

export async function sendMessage(
  webClient: WebClient,
  msg: ChatPostMessageArguments | ChatUpdateArguments
) {
  if (msg.ts) {
    let args = msg as ChatUpdateArguments
    let result = await webClient.chat.update(args)
    return result as ChatUpdateMessageWebAPICallResult
  }

  msg.thread_ts = msg.thread_ts || ""
  let args = msg as ChatPostMessageArguments
  let result = await webClient.chat.postMessage(args)
  return result as ChatPostMessageWebAPICallResult
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
      msg = {
        text: msg,
      }
    }

    // save orignal message for comparison
    this._message = msg

    // combine with fields for the new object
    msg = {
      ...msg,
      ...{
        ts: this.ts,
        channel: this.channel,
        as_user: true,
        thread_ts: this.threadTs,
      },
    }

    this._sending = true
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

export function createUpdatableMessage(channel: string | IContext) {
  let channelId = ""
  let thread_ts = null

  if (isString(channel)) {
    channelId = channel
  } else {
    channelId = channel.res.message.room
    thread_ts = (<any>channel).res.message.thread_ts
  }

  return new UpdatableMessage(createWebClient(), channelId, null, thread_ts)
}

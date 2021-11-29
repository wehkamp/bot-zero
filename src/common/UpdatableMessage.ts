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

async function sendMessage(
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
  private message?: Message
  private nextMessage?: Message
  private sending?: Promise<void>
  private isSending = false

  constructor(
    private readonly webClient: WebClient,
    private channel: string,
    private ts: string,
    private readonly threadTs: string
  ) {}

  async wait(): Promise<string | null> {
    if (this.sending) {
      await this.sending
      await delay(500)
    }

    return this.ts
  }

  async send(msg: Message): Promise<void> {
    // don't send empty or the same message
    if (!msg || msg === this.message) {
      return
    }

    // when sending, add to later
    if (this.isSending) {
      this.nextMessage = msg
      await Promise.resolve(this.sending)
      return
    }

    // save orignal message for comparison
    this.message = msg

    if (isString(msg)) {
      msg = {
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: msg,
            },
          },
        ],
        text: msg,
      }
    }

    // combine with fields for the message update
    msg = {
      ...msg,
      ...{
        ts: this.ts,
        channel: this.channel,
        as_user: true,
        thread_ts: this.threadTs,
      },
    }

    this.isSending = true
    this.sending = sendMessage(this.webClient, <any>msg).then(x => {
      this.ts = this.ts || x.ts
      this.channel = this.channel || x.channel
      this.isSending = false

      const msg = this.nextMessage
      this.nextMessage = null
      return this.send(msg)
    })

    await this.sending
  }

  getTs() {
    return this.ts
  }

  getChannel() {
    return this.channel
  }

  async delete() {
    // wait for last message to complete
    let ts = await this.wait()

    // reset any updates
    this.ts = null

    // delete this message
    await this.webClient.chat.delete({
      ts: ts,
      channel: this.channel,
    })
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise(r => {
    setTimeout(() => {
      r()
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

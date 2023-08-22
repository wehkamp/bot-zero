import removeMarkDown from "remove-markdown"
import {
  Block,
  ChatPostMessageArguments,
  ChatUpdateArguments,
  KnownBlock,
  WebAPICallResult,
  WebClient
} from "@slack/web-api"
import { IContext } from "hubot-command-mapper"

type ChatPostMessageWebAPICallResult = WebAPICallResult & {
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

type ChatUpdateMessageWebAPICallResult = WebAPICallResult & {
  channel: string
  ts: string
  text: string
}

type BlockMessage = {
  text?: string
  blocks?: (KnownBlock | Block)[]
}

type Message = BlockMessage | ChatPostMessageArguments | ChatUpdateArguments | string

async function sendMessage(webClient: WebClient, msg: ChatPostMessageArguments | ChatUpdateArguments) {
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
  private message?: Message | null
  private nextMessage?: Message | null
  private sending?: Promise<any>
  private isSending = false

  constructor(
    private readonly webClient: WebClient,
    private channel: string,
    private ts: string | null,
    private readonly threadTs: string | null = null
  ) {}

  async waitForAllToBenSent() {
    if (this.sending) {
      await this.sending
      await delay(500)
    }

    return this.ts
  }

  async send(msg: Message): Promise<string | null> {
    // don't send empty or the same message
    if (!msg || msg === this.message) {
      return this.getTs()
    }

    // when sending, add to later
    if (this.isSending) {
      this.nextMessage = msg
      await Promise.resolve(this.sending)
      return this.getTs()
    }

    // save original message for comparison
    this.message = msg

    if (isString(msg)) {
      if (msg.length >= 3000) {
        msg = {
          text: msg
        }
      } else {
        msg = {
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: msg
              }
            }
          ],
          text: removeMarkDown(msg)
        }
      }
    }

    // combine with fields for the message update
    msg = {
      ...msg,
      ...{
        ts: this.ts,
        channel: this.channel,
        as_user: true,
        thread_ts: this.threadTs
      }
    }

    // clear blocks from previous message is we have to
    if (!msg.blocks) {
      msg.blocks = []
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

    return await this.sending
  }

  getTs() {
    return this.ts
  }

  getChannel() {
    return this.channel
  }

  async delete() {
    // wait for last message to complete
    let ts = await this.waitForAllToBenSent()

    // reset any updates
    this.ts = null

    // delete this message
    if (ts) {
      await this.webClient.chat.delete({
        ts,
        channel: this.channel
      })
    }
  }

  async executeWithErrorHandling<T>(errorMessageOnFail: string, handler: (msg: UpdatableMessage) => Promise<T>) {
    try {
      return await handler(this)
    } catch (ex) {
      console.error(errorMessageOnFail, ex)
      await this.send(errorMessageOnFail + "\n```" + ex + "\n```\n")
      return null
    }
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise(r => {
    setTimeout(() => {
      r()
    }, ms)
  })
}

export function createUpdatableMessage(
  channel: string | IContext | Hubot.Response,
  initialMessage: Message | string = null
) {
  let channelId = ""
  let thread_ts = null
  let ts = null

  if (typeof channel === "string") {
    channelId = channel
  } else if ("message" in channel) {
    channelId = channel.message.room
    thread_ts = (<any>channel).message.thread_ts
  } else {
    channelId = channel.res.message.room
    thread_ts = (<any>channel).res.message.thread_ts
  }

  let client = new WebClient(process.env.HUBOT_SLACK_BOT_TOKEN as string)
  let msg = new UpdatableMessage(client, channelId, ts, thread_ts)
  if (initialMessage) {
    msg.send(initialMessage)
  }
  return msg
}

import {
  Block,
  ChatPostMessageArguments,
  ChatUpdateArguments,
  KnownBlock,
  WebAPICallResult,
  WebClient,
} from "@slack/web-api"

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

type ChannelWebAPICallResult = WebAPICallResult & {
  channel: {
    name: string
  }
}

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

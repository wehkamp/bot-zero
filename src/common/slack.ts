import { WebClient, WebAPICallResult } from "@slack/web-api"

export type ChannelWebAPICallResult = WebAPICallResult & {
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

export function upload(
  comment: string,
  fileName: string,
  channel: string,
  buffer: Buffer,
  thread_ts: string = null,
  filetype = "jpg",
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

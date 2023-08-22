import { FilesUploadArguments, WebClient } from "@slack/web-api"
import { IContext } from "hubot-command-mapper"

export function createWebClient(token: string = null): WebClient {
  token = token || process.env.HUBOT_SLACK_BOT_TOKEN
  return new WebClient(token)
}

export function uploadByContext(
  context: IContext,
  comment: string,
  fileName: string,
  data: Buffer | string,
  thread_ts?: string,
  filetype?: string,
  token: string = null
) {
  let channel = context.res.message.room
  thread_ts = thread_ts || (<any>context.res.message).thread_ts

  return upload(comment, fileName, channel, data, thread_ts, filetype, token)
}

export function upload(
  comment: string,
  fileName: string,
  channel: string,
  data: Buffer | string,
  thread_ts: string = null,
  filetype: string = null,
  token: string = null
) {
  let options: FilesUploadArguments = {
    filename: fileName,
    channel_id: channel,
    initial_comment: comment,
    title: fileName
  }

  if (data instanceof Buffer) {
    options.file = data
  } else {
    options.content = data
    options.filetype = filetype
  }

  if (thread_ts != null) {
    options.thread_ts = thread_ts.toString()
  }

  return createWebClient(token).files.uploadV2(options)
}

import { chalker } from "chalk-with-markers"

export function validateConfg() {
  validateToken("HUBOT_SLACK_BOT_TOKEN", "xoxb-")
  validateToken("HUBOT_SLACK_APP_TOKEN", "xapp-")
}

function validateToken(name: string, format: "xoxb-" | "xapp-") {
  const envMsg =
    "your environment variables (for production) or to your .env file (for local development). You can find your Slack apps here: https://api.slack.com/apps"

  const token = process.env[name]

  if (!token || token.length == 0) {
    errorAndExit(`No ${name} found.`, "Please add it to " + envMsg)
    return
  }

  if (token.length < 10) {
    errorAndExit(`Invalid ${name}.`, "Please add the whole token to " + envMsg)
  }

  if (!token.startsWith(format)) {
    errorAndExit(`Invalid ${name} type.`, `Please add the '${format}' token to ${envMsg}`)
  }

  return token
}

function errorAndExit(problem: string, details: string) {
  console.log()
  console.log(chalker.colorize("[y]" + problem + "[q] " + details))
  console.log()
  process.exit()
}

import fs from "fs"
import { chalker } from "chalk-with-markers"

export function getConfig(envFile) {
  if (fs.existsSync(envFile)) {
    return fs
      .readFileSync(envFile, "utf-8")
      .split("\n")
      .filter(l => l && l.indexOf("=") !== -1 && l.indexOf("#") !== 0)
      .concat([
        `HUBOT_SLACK_RTM_CLIENT_OPTS='{"dataStore": false, "useRtmConnect": true }`,
      ])
  }

  return [
    "ENVIRONMENT=production",
    "INSTALLED_TEAM_ONLY=true",
    "HUBOT_HELP_DISABLE_HTTP=true",
    "HUBOT_LOG_LEVEL=error",
    `HUBOT_SLACK_RTM_CLIENT_OPTS='{"dataStore": false, "useRtmConnect": true }`,
  ]
}

function errorAndExit(problem: string, details: string) {
  console.log()
  console.log(chalker.colorize("[y]" + problem + "[q] " + details))
  console.log()
  process.exit()
}

export function validateToken(config: string[]) {
  const envMsg =
    "your environment variables (for production) or to your .env file (for local development)."

  let token =
    config
      .map(x => x.split("="))
      .filter(x => x[0] == "HUBOT_SLACK_TOKEN")
      .map(x => x[1].trim())
      .find(Boolean) || process.env.HUBOT_SLACK_TOKEN

  if (token.startsWith('"') && token.endsWith('"')) {
    token = token.substr(1, token.length - 2)
  }

  if (!token || token.length == 0) {
    errorAndExit("No HUBOT_SLACK_TOKEN found.", "Please add it to " + envMsg)
  }

  if (token.length < 10) {
    errorAndExit(
      "Invalid HUBOT_SLACK_TOKEN.",
      "Please add the whole token to" + envMsg
    )
  }
  const tokenStart = "xoxb-"
  if (!token.startsWith(tokenStart)) {
    errorAndExit(
      "Invalid HUBOT_SLACK_TOKEN type.",
      "Please add the 'xoxb-' token to" + envMsg
    )
  }

  return token
}

export function convertConfigIntoParameters(config) {
  const params = []

  config.forEach((c, index) => {
    c = c.trim()

    // should the parameter be quoted?
    if (c.indexOf(" ") !== -1 && c.indexOf('="') === -1) {
      c = c.replace("=", '="') + '"'
    }

    params.push(c)

    // add cross-env
    if (index !== config.length - 1) {
      params.push("cross-env")
    }
  })

  return params
}

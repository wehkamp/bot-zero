// Description:
//  Scripts that should be executed first.
//
// Author:
//  KeesCBakker

import { start } from "../common/slack"
import { asciiArtChalker, chalker } from "chalk-with-markers"
import {
  removeTrailingWhitespaceCharactersFromIncommingMessages,
  removeTrailingBotWhitespaceCharactersFromIncommingMessages,
} from "hubot-command-mapper"

module.exports = async (robot: Hubot.Robot) => {
  // make sure command mapper behaves
  removeTrailingWhitespaceCharactersFromIncommingMessages(robot)
  removeTrailingBotWhitespaceCharactersFromIncommingMessages(robot)

  // setup adapters
  const port = Number(process.env.PORT) || 5000
  const adapters = start(process.env.HUBOT_SLACK_TOKEN, port)
  const info = await adapters.getBotInfo()

  // splash screen
  splash()

  // debug info
  console.log(
    chalker.colorize(`
[q]Bot name: [y]@${info.botName}
[q]App URL:  [y]${info.appUrl}
[q]Port:     [y]${port}

[g]Started!`)
  )
}

function splash() {
  console.log(
    asciiArtChalker.colorize(`
p__________        __    __________                    p.___b.___ 
b\\______   \\ _____/  |_  \\____    /___________  ____   p|   b|   |
w |    |  _//  _ \\   __\\   /     // __ \\_  __ \\/  _ \\  p|   b|   |
p |    |   (  <_> )  |    /     /\\  ___/|  | \\(  <_> ) p|   b|   |
b |______  /\\____/|__|   /_______ \\___  >__|   \\____/  p|___b|___|
w        \\/                      \\/   \\/                        `)
  )
}

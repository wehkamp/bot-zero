// Description:
//  Shows how to build a message that's updatable showing progress.
//
// Commands:
//  hubot progress - shows an example message with progress.
//
// Author:
//  KeesCBakker (kbakker@wehkamp.nl)
"strict"

import { map_command } from "hubot-command-mapper"
import { createUpdatableMessage, SimpleMessage } from "../common/slack"

const steps = [
  "Preparing environment...",
  "Adding some love...",
  "Contacting support...",
  "Building relationships...",
  "Shipping code...",
  "Testing. Testing. Testing...",
  "Testing some more...",
  "Preparing for launch...",
  "Validating details...",
  "Organizing a pre-launch party...",
  "Done!",
]

module.exports = robot => {
  map_command(robot, "progress", context => {
    // the channel is needed for interaction by the Slack
    // API - this works also for private messages to the bot
    const msg = createUpdatableMessage(context)

    msg.send("Showing an example of a progress indicator... *0%*")

    // careful with flooding the Slack API with too many
    // messages. Consider that a single command might be
    // executed by multiple users.
    const ms = 750

    let i = 1
    const x = setInterval(() => {
      if (i > 100) {
        i = 100
        clearInterval(x)
      }

      const step = Math.floor(i / (steps.length - 1))
      const message: SimpleMessage = {
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${steps[step]} *${i}*%`,
            },
          },
        ],
        text: `${steps[step]} ${i}%`,
      }

      msg.send(message)

      i += 3
    }, ms)
  })
}

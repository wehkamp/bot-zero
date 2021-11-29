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
import {
  BlockMessage,
  createUpdatableMessage,
  delay,
} from "../common/UpdatableMessage"

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
  map_command(robot, "progress", async context => {
    // the channel is needed for interaction by the Slack
    // API - this works also for private messages to the bot
    const msg = createUpdatableMessage(context)

    msg.send("Showing an example of a progress indicator... *0%*")

    // careful with flooding the Slack API with too many
    // messages. Consider that a single command might be
    // executed by multiple users.
    const ms = 750

    let i = 1
    while (true) {
      const step = Math.floor(i / (steps.length - 1))
      msg.send(`${steps[step]} *${i}*%`)

      i += 3

      if (i > 100) {
        i = 100
        break
      }
      await delay(ms)
    }
  })
}

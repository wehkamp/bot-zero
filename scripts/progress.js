// Description:
//  Shows how to build a message that's updatable showing progress.
//
// Commands:
//  hubot progress - shows an example message with progress.
//
// Author:
//  KeesCBakker (kbakker@wehkamp.nl)
'strict'

const { tool } = require('hubot-command-mapper')
const axios = require('axios')

const steps = [
  'Preparing environment...',
  'Adding some love...',
  'Contacting support...',
  'Building relationships...',
  'Shipping code...',
  'Testing. Testing. Testing...',
  'Testing some more...',
  'Preparing for launch...',
  'Validating details...',
  'Organizing a pre-launch party...',
  'Done!'
]

module.exports = robot =>
  tool('progress')
    .command('show')
    .alias('')
    .invoke((tool, robot, res) => {
      // the channel is needed for interaction by the Slack
      // API - this works also for private messages to the bot
      const channel = res.message.room

      const msg = new UpdatableMessage(
        process.env.HUBOT_SLACK_TOKEN,
        channel
      )

      msg.send('Showing an example of a progress indicator... *0%*')

      // careful with flooding the Slack API with too many
      // messages. Consider that a single command might be
      // executed by multiple users.
      const ms = 1000

      let i = 1
      const x = setInterval(() => {
        if (i > 100) {
          i = 100
          clearInterval(x)
        }

        const step = Math.floor(i / 10)
        const message = `${steps[step]} *${i}%*`
        msg.send(message)

        i += 3
      }, ms)
    })
    .map(robot)

// This will create an object that stores all the details of the
// message and the channel. Because the message can be updated
// it show that you can build powerfull progress messages or
// status indicators. We're not using Hubot, but the Slack API.
// Hubot doesn't give the ts back that's needed to update the
// message.
const UpdatableMessage = class {
  constructor (token, channel) {
    this.token = token
    this.channel = channel
    this.ts = null
    this.message = null
    this.nextMessage = null
    this.sending = false
  }

  send (msg) {
    // don't send empty or the same message
    if (!msg || msg === this.message) { return }

    // if a message is being send, set is as the next message
    if (this.sending) {
      this.nextMessage = msg
      return
    }

    this.sending = true
    this.message = msg

    sendMessage(this.token, this.channel, this.ts, msg)
      .catch(ex => console.log('Something went wrong: ' + ex))
      .then(ts => {
        this.ts = ts || this.ts
        this.sending = false
        const msg = this.nextMessage
        this.nextMessage = null
        this.send(msg)
      })
  }
}

function sendMessage (token, channel, ts, msg) {
  token = encodeURIComponent(token)
  channel = encodeURIComponent(channel)
  msg = encodeURIComponent(msg)

  const action = ts ? 'update' : 'postMessage'
  const url = `https://slack.com/api/chat.${action}?token=${token}` +
              `&channel=${channel}&text=${msg}&as_user=true&ts=${ts}`

  return axios.post(url).then(response => response.data.ts)
}

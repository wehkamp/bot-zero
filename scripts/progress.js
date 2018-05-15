// Description:
//  Shows how to build a message that's updatable showing progress.
//
// Commands:
//  hubot progress - shows an example message with progress.
//
// Author:
//  KeesCBakker (kbakker@wehkmap.nl)
"strict";

const { mapper, tool } = require("hubot-command-mapper");
const axios = require("axios");

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
  "Done!"
];

module.exports = robot =>
  tool("progress")
    .command("show")
    .alias("")
    .invoke((tool, robot, res) => {

      // the channel is needed for interaction by the Slack
      // API - this works also for private messages to the bot
      const channel = res.message.room;

      const updater = new UpdatableMessage(
        channel,
        "Showing an example of a progress indicator... *0%*"
      );

      // careful with flooding the Slack API with too many
      // messages. Consider that a single command might be
      // executed by multiple users.
      const ms = 1000;

      let i = 1;
      const x = setInterval(() => {

        if (i > 100){
          i = 100;
          clearInterval(x);
        }

        const step = Math.floor(i / 10);
        const message = `${steps[step]} *${i}%*`;
        updater.update(message);

        i += 3;
      }, ms);
    })
    .map(robot);


// This will create an object that stores all the details of the
// message and the channel. Because the message can be updated
// it show that you can build powerfull progress messages or
// status indicators. We're not using Hubot, but the Slack API.
// Hubot doesn't give the ts back that's needed to update the
// message.
function UpdatableMessage(channel, initialMessage) {

  // use the same token as the bot.
  const token = process.env.HUBOT_SLACK_TOKEN;
  let ts = null;

  this.update = function(msg) {

    // a new message is created by chat.postMessage an update
    // by chat.update
    const action = ts == null ? "postMessage" : "update";
    const text = encodeURIComponent(msg);
    const url = `https://slack.com/api/chat.${action}?token=${token}&channel=${channel}&text=${text}&as_user=true&ts=${ts}`;

    axios
      .post(url)
      .then(response => {
        if (ts == null) ts = response.data.ts;
      })
      .catch(ex => console.log("Something went wrong: " + ex));
  };

  //use the initial messag to set the ts
  this.update(initialMessage);
}

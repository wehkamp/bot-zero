// Description:
//  Quotes from the Internet Chuck Norris Database.
//
// Commands:
//  hubot norris - shows a Chuck Norris quote.
//  hubot norris impersonate {first-name} {last-name} - shows a Chuck Norris quote for the given name.
//  hubot norris nr {number} - shows the numbered quote.
//
// Author:
//  KeesCBakker (kbakker@wehkamp.nl)

import {
  map_tool,
  StringParameter,
  NumberParameter,
} from "hubot-command-mapper"
import fetch from "node-fetch"
import Hubot from "../Hubot"

const idQuoteUrl = "https://api.icndb.com/jokes/"
const randomQuoteUrl =
  "https://api.icndb.com/jokes/random?escape=javascript&exlude=[explicit]"

module.exports = (robot: Hubot.Robot) => {
  map_tool(robot, {
    name: "norris",
    commands: [
      {
        name: "cmd",
        alias: [""],
        execute: async context => {
          try {
            let joke = await getJoke(randomQuoteUrl)
            context.res.reply(joke)
          } catch (err) {
            context.res.reply(
              "Not even Chuck Norris can deal with this one: " + err
            )
          }
        },
      },
      {
        name: "nr",
        parameters: [new NumberParameter("id")],
        execute: async context => {
          const id = context.values.id
          const url = `${idQuoteUrl}/${id}/?escape=javascript`
          try {
            let joke = await getJoke(url)
            context.res.reply(joke)
          } catch (err) {
            context.res.reply("Sorry, that on doesn't exist.")
          }
        },
      },
      {
        name: "impersonate",
        parameters: [
          new StringParameter("firstName"),
          new StringParameter("lastName"),
        ],
        execute: async context => {
          const firstName = encodeURIComponent(context.values.firstName)
          const lastName = encodeURIComponent(context.values.lastName)
          const url = `${randomQuoteUrl}&firstName=${firstName}&lastName=${lastName}`

          try {
            let joke = await getJoke(url)
            context.res.reply(joke)
          } catch (err) {
            context.res.reply(
              "Not even Chuck Norris can deal with this one: " + err
            )
          }
        },
      },
    ],
  })
}

async function getJoke(url: string) {
  let response = await fetch(url)
  let json = await response.json()

  if (json.value.joke) {
    return json.value.joke as string
  }

  // error is in the value
  throw json.value
}

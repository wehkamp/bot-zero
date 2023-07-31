// Description:
//  Creates a small global todo list.
//
// Commands:
//  hubot todo - shows the todo list.
//  hubot todo {description} - adds a new item to the list.
//  hubot todo remove {input} - removes items that match the input.
//
// Author:
//  KeesCBakker (kbakker@wehkamp.nl)

import { AnyParameter } from "hubot-command-mapper"
import { BotZero } from "../common/BotZero"

module.exports = (robot: BotZero) => {
  let todos = []

  robot.mapTool({
    name: "todo",
    commands: [
      {
        name: "secret",
        alias: ["scrt"],
        auth: ["kz"],
        execute: context => {
          context.reply("⚡ You've found the secret! ⚡")
        }
      },
      {
        name: "add",
        alias: [""],
        parameters: [new AnyParameter("item")],
        execute: context => {
          const item = context.values.item
          todos.push(item)
          context.reply(`Added _${item}_ to the list.`)
        }
      },
      {
        name: "remove",
        alias: ["rm", "del"],
        parameters: [new AnyParameter("item")],
        execute: context => {
          let item = context.values.item.toLowerCase()
          let length = todos.length
          todos = todos.filter(f => f.toLowerCase().indexOf(item) === -1)
          let i = length - todos.length
          if (i === 1) {
            context.reply("1 item was removed.")
          } else {
            context.reply(`${i} items were removed.`)
          }
        }
      },
      {
        name: "list",
        alias: ["", "lst", "ls"],
        execute: context => {
          if (todos.length === 0) {
            context.reply("The list is empty.")
            return
          }

          let i = 0
          let str = "The following items are on the list:\n"
          str += todos.map(t => `${++i}. ${t}`).join("\n")
          context.reply(str)
        }
      }
    ]
  })
}

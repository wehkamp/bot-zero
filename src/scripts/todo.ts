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

import { RestParameter } from "hubot-command-mapper"
import { BotZero } from "../common/BotZero"
import { Tool } from "../common/fluent"

module.exports = (robot: BotZero) => {
  let todos = new Array<string>()
  let tool = new Tool("todo")

  tool
    .addCommand("secret")
    .alias("scrt")
    .auth("kz")
    .onExecute(context => context.res.reply("⚡ You've found the secret! ⚡"))

  tool
    .addCommand("add")
    .alias("")
    .addParameter(new RestParameter("item"))
    .onExecute(context => {
      const item = context.values.item
      todos.push(item)
      context.res.reply(`Added _${item}_ to the list.`)
    })

  tool
    .addCommand("remove")
    .alias("rm", "del")
    .addParameter(new RestParameter("item"))
    .onExecute(context => {
      let item = context.values.item.toLowerCase()
      let length = todos.length
      todos = todos.filter(f => f.toLowerCase().indexOf(item) === -1)
      let i = length - todos.length
      if (i === 1) {
        context.res.reply("1 item was removed.")
      } else {
        context.res.reply(`${i} items were removed.`)
      }
    })

  tool
    .addCommand("list")
    .alias("", "lst", "ls")
    .onExecute(context => {
      if (todos.length === 0) {
        context.res.reply("The list is empty.")
        return
      }

      let i = 0
      let str = "The following items are on the list:\n"
      str += todos.map(t => `${++i}. ${t}`).join("\n")
      context.res.reply(str)
    })

  tool.map(robot)
}

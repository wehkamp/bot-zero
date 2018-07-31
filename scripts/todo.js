// Description:
//  Creates a small global todo list.
//
// Commands:
//  hubot todo - shows the todo list.
//  hubot todo {description} - adds a new item to the list.
//  hubot todo remove {description} - removed items from the list that match the description.
//
// Author:
//  KeesCBakker (kbakker@wehkmap.nl)

const { mapper, RestParameter } = require('hubot-command-mapper')

module.exports = robot => {

  let todos = []

  mapper(robot, {
    name: "todo",
    commands: [{
      name: "add",
      alias: [""],
      parameters: [new RestParameter("item")],
      invoke: (tool, robot, res, match, values) => {
        const item = values.item
        todos.push(item)
        res.reply(`Added _${item}_ to the list.`)
      }
    },
    {
      name: "remove",
      alias: ["rm", "del"],
      parameters: [new RestParameter("item")],
      invoke: (tool, robot, res, match, values) => {

        let item = values.item.toLowerCase()
        let length = todos.length
        todos = todos.filter(f => f.toLowerCase().indexOf(item) === -1)
        let i = length - todos.length
        if (i === 1) {
          res.reply('1 item was removed.')
        } else {
          res.reply(`${i} items were removed.`)
        }

      }
    },
    {
      name: "list",
      alias: ["", "lst", "ls"],
      invoke: (tool, robot, res, match, values) => {

        if (todos.length === 0) {
          res.reply('The list is empty.')
          return
        }

        let i = 0
        let str = 'The following items are on the list:\n'
        str += todos.map(t => `${++i}. ${t}`).join('\n')
        res.reply(str)

      }
    }]
  })
}


/*
      const item = values.item
      todos.push(item)
      res.reply(`Added _${item}_ to the list.`)
*/

/*
*/

/*

*/
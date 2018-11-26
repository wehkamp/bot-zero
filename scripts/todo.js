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

const { mapper, AnyParameter } = require('hubot-command-mapper')

const environment = process.env.ENVIRONMENT || 'production'
console.log(`Running on: ${environment}`)

module.exports = robot => {
  let todos = []

  mapper(robot, {
    name: 'todo',
    commands: [
      {
        name: 'add',
        alias: [''],
        parameters: [new AnyParameter('item')],
        invoke: (tool, bot, res, match, values) => {
          const item = values.item
          todos.push(item)
          res.reply(`Added _${item}_ to the list.`)
        }
      },
      {
        name: 'remove',
        alias: ['rm', 'del'],
        parameters: [new AnyParameter('item')],
        invoke: (tool, bot, res, match, values) => {
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
        name: 'list',
        alias: ['', 'lst', 'ls'],
        invoke: (tool, bot, res, match, values) => {
          if (todos.length === 0) {
            res.reply('The list is empty.')
            return
          }

          let i = 0
          let str = 'The following items are on the list:\n'
          str += todos.map(t => `${++i}. ${t}`).join('\n')
          res.reply(str)
        }
      }
    ]
  })
}

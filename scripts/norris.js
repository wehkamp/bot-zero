// Description:
//  Quotes from the Internet Chuck Norris Database.
//
// Commands:
//  hubot norris - shows a Chuck Norris quote.
//  hubot norris impersonate {first-name} {last-name} - shows a Chuck Norris quote for the given name.
//  hubot norris nr {number} - shows the numbered quote.
//
// Author:
//  KeesCBakker (kbakker@wehkmap.nl)

const axios = require('axios')
const { mapper, StringParameter, NumberParameter } = require('hubot-command-mapper')

const idQuoteUrl = 'https://api.icndb.com/jokes/'
const randomQuoteUrl = 'https://api.icndb.com/jokes/random?escape=javascript&exlude=[explicit]'

module.exports = robot => {
  mapper(robot, {
    name: 'norris',
    commands: [
      {
        name: 'quote',
        alias: [''],
        invoke: (tool, robot, res) => {
          getJoke(randomQuoteUrl)
            .then(joke => res.reply(joke))
            .catch(err => res.reply('Not even Chuck Norris can deal with this one: ' + err))
        }
      },
      {
        name: 'nr',
        parameters: [new NumberParameter('id')],
        invoke: (tool, robot, res, match, values) => {
          const id = values.id
          const url = `${idQuoteUrl}/${id}/?escape=javascript`

          getJoke(url)
            .then(joke => res.reply(joke))
            .catch(err => {
              console.log(err)
              res.reply('Sorry, that one doesn\'t exist.')
            })
        }
      },
      {
        name: 'impersonate',
        parameters: [new StringParameter('firstName'), new StringParameter('lastName')],
        invoke: (tool, robot, res, match, values) => {
          const firstName = encodeURIComponent(values.firstName)
          const lastName = encodeURIComponent(values.lastName)
          const url = `${randomQuoteUrl}&firstName=${firstName}&lastName=${lastName}`

          getJoke(url)
            .then(joke => res.reply(joke))
            .catch(err => res.reply(`Not even Chuck Norris can deal with this one: ${err}`))
        }
      }
    ]
  })
}

function getJoke (url) {
  return axios
    .get(url)
    .then(resp => resp.data)
    .then(json => {
      if (json.value && json.value.joke) { return json.value.joke }
      throw json.value
    })
}

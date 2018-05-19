'strict'

// don't let the Hubot Command Mapper echo through the
// test results - set this before loading any tool.
process.env.HCM_VERBOSE = 'false'

const pretend = require('hubot-pretend')
const { expect } = require('chai')

require('mocha')

describe('Hubot-help', () => {
  it('Display query for help.', done => {
    pretend.read('./node_modules/hubot-help/src/help.coffee').start()
    pretend.user('kees')
      .send('@hubot help help')
      .then(x => {
        expect(pretend.messages).to.eql(
          [
            ['kees', '@hubot help help'],
            ['hubot', 'hubot help - Displays all of the help commands that this bot knows about.\nhubot help <query> - Displays all help commands that match <query>.']
          ]
        )
      })
      .then(x => pretend.shutdown())
      .then(x => done())
      .catch(ex => done(ex))
  })
})

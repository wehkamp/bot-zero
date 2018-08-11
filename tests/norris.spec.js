// don't let the Hubot Command Mapper echo through the
// test results - set this before loading any tool.
process.env.HCM_VERBOSE = 'false'

const pretend = require('hubot-pretend')
const { expect } = require('chai')
const norris = require('./../scripts/norris')

require('mocha')

describe('Norris tool', () => {
  // initializes a new version of the
  // robot before each test (the it's)
  beforeEach(() => {
    pretend.name = 'hubot'
    pretend.alias = 'hubot'
    pretend.start()
    norris(pretend.robot)
  })

  // shut the bot down after each test
  afterEach(() => pretend.shutdown())

  it('Norris should show a random comment.', done => {
    pretend
      .user('kees')
      .send('@hubot norris')
      .then(() => delay(1500))
      .then(() => {
        expect(pretend.messages.length).to.eql(2)
        expect(pretend.messages[1][1]).to.not.match(/Not even Chuck Norris/)
        done()
      })
      .catch(ex => done(ex))
  })

  it('Norris quote should show a random comment.', done => {
    pretend
      .user('kees')
      .send('@hubot norris quote')
      .then(() => delay(1500))
      .then(() => {
        expect(pretend.messages.length).to.eql(2)
        expect(pretend.messages[1][1]).to.not.match(/Not even Chuck Norris/)
        done()
      })
      .catch(ex => done(ex))
  })

  it('Norris nr 6 should show quote 6.', done => {
    pretend
      .user('kees')
      .send('@hubot norris nr 6')
      .then(() => delay(1500))
      .then(() => {
        expect(pretend.messages).to.eql([
          ['kees', '@hubot norris nr 6'],
          ['hubot', '@kees Since 1940, the year Chuck Norris was born, roundhouse kick related deaths have increased 13,000 percent.']
        ])

        done()
      })
      .catch(ex => done(ex))
  })

  it('Norris nr 10 should show an exception message.', done => {
    pretend
      .user('kees')
      .send('@hubot norris nr 10')
      .then(() => delay(2000))
      .then(() => {
        expect(pretend.messages).to.eql([
          ['kees', '@hubot norris nr 10'],
          ['hubot', '@kees Sorry, that one doesn\'t exist.']
        ])
        done()
      })
      .catch(ex => done(ex))
  })

// cannot be tested - not all quoted have this implemented
//
//   it('Norris impersonate Cornelio Pannadero should show a random quote with Cornelio Pannadero in it.', done => {
//     pretend
//       .user('kees')
//       .send('@hubot norris impersonate Cornelio Pannadero')
//       .then(() => delay(1500))
//       .then(() => {
//         expect(pretend.messages.length).to.eql(2)
//         expect(pretend.messages[1][1]).to.match(/Cornelio/)
//         expect(pretend.messages[1][1]).to.match(/Pannadero/)
//         done()
//       })
//       .catch(ex => done(ex))
//   })
})

function delay (timeout) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout)
  })
}

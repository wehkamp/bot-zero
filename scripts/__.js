// Description:
//  Loads middleware.
//
// Author:
//  KeesCBakker

const {
  removeTrailingWhitespaceCharactersFromIncommingMessages,
  removeTrailingBotWhitespaceCharactersFromIncommingMessages
} = require('hubot-command-mapper')

module.exports = robot => {
  removeTrailingWhitespaceCharactersFromIncommingMessages(robot)
  removeTrailingBotWhitespaceCharactersFromIncommingMessages(robot)
}

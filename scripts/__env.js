// Description:
//  Loads the environment variables from the env file.
//
// Configuration:
//  Add the env file to the root of your project.
//
// Notes:
//  Should not be used in production.
//
// Author:
//  KeesCBakker (kbakker@wehkmap.nl)

require('dotenv').config()

module.exports = robot => {
  const environment = process.env.ENVIRONMENT || 'production'
  console.log(`Running on: ${environment}`)
}

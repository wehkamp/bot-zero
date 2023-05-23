import { alias } from "hubot-command-mapper"

/* aliases can be added to this table. It provides an
 * easy way to map complex commands with lots of parameters
 * into simple versions.
 */
const table = {
  "fav-norris": "norris nr 112",
}

module.exports = robot => alias(robot, table)

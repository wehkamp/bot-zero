import { alias } from "hubot-command-mapper"
import { BotZero } from "../common/BotZero"

/* aliases can be added to this table. It provides an
 * easy way to map complex commands with lots of parameters
 * into simple versions.
 */
const table = {
  "fav-norris": "norris nr 112"
}

module.exports = (robot: BotZero) => alias(robot, table)

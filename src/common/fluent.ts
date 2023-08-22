import Hubot from "hubot"
import { IOptions, ITool, ICommand, map_tool, IParameter, IContext, ChoiceParameter } from "hubot-command-mapper"

class Mappable {
  protected _auth: string[] = []
  protected _mapped: boolean = false

  constructor(protected name: string) {
    if (!name) {
      throw new Error("Name cannot be empty.")
    }
  }

  protected ensureNotMapped() {
    if (this._mapped) throw new Error("Call method before map")
  }

  auth(...users: string[]) {
    this.ensureNotMapped()
    this._auth = users || []
    return this
  }
}

export class Tool extends Mappable {
  private readonly _commands = new Array<Command>()
  private _options: IOptions

  constructor(name: string) {
    super(name)
  }

  setOption(options: IOptions) {
    this.ensureNotMapped()
    this._options = options
  }

  addCommand(name: string) {
    this.ensureNotMapped()
    let command = new Command(name)
    this._commands.push(command)
    return command
  }

  map(robot: Hubot.Robot) {
    this.ensureNotMapped()

    if (this._commands.length == 0) {
      throw new Error("Cannot map without commands")
    }

    const tool: ITool = {
      name: this.name,
      auth: this._auth,
      commands: new Array<ICommand>()
    }

    this._commands.forEach(c => c.map(robot, tool))

    map_tool(robot, tool, this._options)

    this._mapped = true
  }
}

class Command extends Mappable {
  protected readonly _parameters = new Array<IParameter>()
  protected _alias = new Array<string>()
  private _onExecute: (context: IContext) => void | Promise<void>
  private _help: string
  private _customInvalidSyntaxHelp: string
  private _showHelpOnInvalidSyntax: boolean

  constructor(name: string) {
    super(name)
  }

  alias(...name: string[]) {
    this.ensureNotMapped()
    name.forEach(n => this._alias.push(n))
    return this
  }

  help(description: string) {
    this.ensureNotMapped()
    if (!description) throw new Error("description cannot be empty")
    this._help = description
    return this
  }

  public addParameter(parameter: IParameter) {
    this.ensureNotMapped()
    this._parameters.push(parameter)
    return this
  }

  public onExecute(callback: (context: IContext) => void | Promise<void>) {
    this.ensureNotMapped()
    this._onExecute = callback

    return {
      showHelpOnInvalidSyntax: (message: string | null = null) => {
        this.ensureNotMapped()

        if (message) {
          this._customInvalidSyntaxHelp = message
        } else if (!this._help) throw new Error("Please specify a message or set help first.")
        this._showHelpOnInvalidSyntax = true
      }
    }
  }

  public map(robot: Hubot.Robot, tool: ITool) {
    this.ensureNotMapped()

    if (!this._onExecute) {
      throw new Error("Set onExecute before map of command: " + this.name)
    }

    if (!tool.commands) {
      tool.commands = []
    }

    tool.commands.push({
      name: this.name,
      alias: this._alias,
      auth: this._auth,
      parameters: this._parameters,
      execute: context => this._onExecute(context)
    })

    if (this._help) {
      let msg: string

      if (this._customInvalidSyntaxHelp) {
        msg = this._customInvalidSyntaxHelp
      } else {
        msg = ["hubot", tool.name, this.name]
          .concat(this._parameters.map(parseHelpForParameter), "-", this._help)
          .join(" ")
        ;(<any>robot.commands).push(msg)
      }

      if (this._showHelpOnInvalidSyntax) {
        tool.commands.push({
          name: this.name,
          alias: this._alias,
          execute: context => {
            context.res.reply(
              "You can use " + msg.replace("hubot", "<@" + context.robot.name + ">").replace(" - ", " to ")
            )
          }
        })
      }
    }
  }
}

function parseHelpForParameter(parameter: IParameter) {
  if (parameter instanceof ChoiceParameter) {
    let value = "`{"
    value += parameter.values.join(", ")
    if (parameter.defaultValue !== null) value += "]"
    value += "}`"

    if (parameter.defaultValue !== null) {
      value = `[${value}]`
    }

    return value
  }

  if (parameter.defaultValue !== null) {
    return "[`" + parameter.name + "`]"
  }

  return "`" + parameter.name + "`"
}

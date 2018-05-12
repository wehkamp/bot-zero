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
"strict"

const { tool } = require("hubot-command-mapper");

//this example show how to use the fluent notation
//of the command mapper.

module.exports = robot => {
    var _todos = [];

    tool("todo")

        //Adds an item to the ToDo list
        //hubot toto add {description}
        //hubot todo {description}
        .command("add")
        .alias("")
        .parameterForRest("item")
        .invoke((tool, robot, res, match, values) => {
            let item = values["item"];
            _todos.push(item);
            res.reply(`Added _${item}_ to the list.`)
        })

        //Lists the ToDo list
        //hubot todo list
        //hubot todo lst
        //hubot todo
        .command("list")
        .alias("lst")
        .alias("")
        .invoke((tool, robot, res, match, values) => {
            if (_todos.length === 0) {
                res.reply("The list is empty.")
                return;
            }

            let i = 0;
            let str = "The following items are on the list:\n";
            str += _todos.map(t => `${++i}. ${t}`).join("\n");
            res.reply(str);
        })
        
        //Removes items that match from the ToDo list
        //hubot todo remove {description}
        //hubot todo rm {description}
        //hubot todo del {description}
        .command("remove")
        .alias("rm")
        .alias("del")
        .parameterForRest("item")
        .invoke((tool, robot, res, match, values) => {
            let item = values["item"].toLowerCase();
            let l = _todos.length;
            _todos = _todos.filter(f => f.toLowerCase().indexOf(item) == -1);
            i = l - _todos.length;
            if (i === 1) {
                res.reply("1 item was removed.")
            }
            else {
                res.reply(`${i} items were removed.`);
            }
        })
        
        //maps everything together:
        .map(robot);
}
# bot-zero

<a href="https://hubot.github.com/">Hubot</a> is a fantastic project that enabled us to build great bots. The **bot-zero** project aims to give you a cleaned up version with some examples that run on TypeScript (instead of Coffee-script).

[![Build Status](https://travis-ci.org/wehkamp/bot-zero.svg?branch=master)](https://travis-ci.org/wehkamp/bot-zero)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://github.com/wehkamp/bot-zero/blob/master/LICENSE.md)

Blog: https://medium.com/wehkamp-techblog/jump-starting-slack-bot-projects-bot-zero-991b9654585e

## Getting started

Starting this project is really easy:

1. Fork this project (top right corner)
2. Clone your forked project to your pc.
3. Goto http://slackapi.github.io/hubot-slack/#getting-a-slack-token to read up on how to get a Slack token for your bot.
4. Copy .env.example to .env and add the Slack token to this file.
5. Open a terminal and navigate to your bot directory.
6. Enter `npm install` to install the NodeJs packages.
7. Start the bot using `npm run dev`.
8. Enjoy!

## How to fork this project internally in wehkamp

GitHub doesn't allow forks on the same organization which means you can't use the fork button for wehkamp use. You can easily solve this by forking this manually.

Replace bot-zero-fork with your own repo and/or use https for cloning/remotes instead of ssh.

1. Create a new repo under wehkamp.
2. Clone bot-zero. `git clone git@github.com:wehkamp/bot-zero.git bot-zero-fork`
3. Cd into fork `cd bot-zero-fork`
4. Setup remotes.
   - `git remote remove origin`
   - `git remote add upstream git@github.com:wehkamp/bot-zero.git`
   - `git remote add origin git@github.com:wehkamp/bot-zero-fork.git`
   - `git push origin master`

You can now pull/push to your forked repo and the original bot-zero repo.

### Pulling/updating

If you want to pull updates from the original bot-zero repo upstream you may use the command: `git pull upstream master`. This will get all commits from bot-zero master in your current branch.

### Pushing

You can also push to the original bot-zero project with `git push upstream whateverbranch` and this will push all your commits to a branch on bot-zero. Be aware though, bot-zero is public and you may leak private info.

## Good to know

**Dev**<br/>
Start the bot with `npm run dev`. It will start a watcher that will inspect your typescript files. Whenever something is changed, the bot is restarted.

**Docker**<br/>
If you want to run in Docker, execute the following:

```sh
docker build -t bot-zero .
docker run -e HUBOT_SLACK_TOKEN=xoxb-you-token-here -it bot-zero
```

**Packages** <br/>
We've included some packages:

- `node-fetch`: a modern HTTP client. Makes it easier to use promises of your HTTP requests.
- `cross-env`: allows you to store environment variables in the .env file in the root of the project.
- `hubot-command-mapper`: allows for the mapping of commands with parameters to the Hubot without the need for regular expressions.

**Clean up**<br/>
The bot was generated using the <a href="http://slackapi.github.io/hubot-slack/">Slack Developer Kit for Hubot</a>. It was "cleaned" using a script from <a href="https://keestalkstech.com/2018/04/cleaning-up-the-default-hubot-installation/">Cleaning up the Default Hubot Installation</a>.

## Tech

We're using the following stack:

- [x] NodeJs
- [x] TypeScript
- [x] Hubot
- [x] NPM

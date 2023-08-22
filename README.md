# bot-zero

<a href="https://hubot.github.com/">Hubot</a> is a fantastic project that enabled us to build great bots. The **bot-zero** project aims to give you a cleaned up version with some examples that run on TypeScript (instead of Coffee-script). This bot uses the <a href="https://slack.dev/bolt-js/">Slack Bolt</a>.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://github.com/wehkamp/bot-zero/blob/master/LICENSE.md)

Blog: https://medium.com/wehkamp-techblog/jump-starting-slack-bot-projects-bot-zero-991b9654585e

## Getting started

In this secion we will create the Slack app and add the
details to your `.env` file.

1. Goto https://api.slack.com/apps?new_app=1
2. Click _From an app manifest_
3. Select your _Workspace_ and click _Next_
4. Click _YAML_, paste this code in the field and click _Next_

```yml
display_information:
  name: Jarvis
  description: Our DevOps bot.
  background_color: "#3d001d"
features:
  app_home:
    home_tab_enabled: false
    messages_tab_enabled: true
    messages_tab_read_only_enabled: false
  bot_user:
    display_name: Jarvis-Beta
    always_online: true
oauth_config:
  scopes:
    bot:
      - app_mentions:read
      - channels:join
      - channels:history
      - chat:write
      - im:write
      - im:history
      - im:read
      - users:read
      - groups:history
      - groups:write
      - groups:read
      - mpim:history
      - mpim:write
      - mpim:read
settings:
  event_subscriptions:
    bot_events:
      - app_mention
      - message.channels
      - message.im
      - message.groups
      - message.mpim
  interactivity:
    is_enabled: true
  org_deploy_enabled: false
  socket_mode_enabled: true
  token_rotation_enabled: false
```

5. Click _Create_
6. Click _Install to Workspace_
7. Click _Allow_
8. In the _Settings > Basic Information_ screen, scroll down to _App-Level Tokens_ and click _Generate Token and Scopes_
9. Enter a _Token Name_: bot-zero
10. Click _Add scope_
11. Select _connections:write_
12. Click the _Generate_ button
13. Copy the `.example.env` in the root of your project to `.env`
14. Copy the _Token_ and paste it in your `.env` file at `HUBOT_SLACK_APP_TOKEN`
15. Click the _Done_ button
16. Goto _Settings > Install App_
17. Copy `Bot User OAuth Token` and paste it in your `.env` file at `HUBOT_SLACK_BOT_TOKEN`

## Running the project

This project supports dev containers, so you don't have to install nodejs to your environment.

1. Make sure your `.env` file has the right tokens.
1. Open a terminal and navigate to your bot directory (dev container opens in the right directory).
1. Enter `npm install` to install the NodeJs packages.
1. Start the bot using `npm run dev`.
1. Enjoy!

Note: if you're using Ranger Desktop, you might encounter a mount error.
Please consult: https://github.com/microsoft/vscode-remote-release/issues/8172
It advises to downgrade `Dev Containers` to `0.266.1`.

## How to fork this project internally in Wehkamp

GitHub doesn't allow forks on the same organization which means you can't use the fork button for Wehkamp use. You can easily solve this by forking this manually.

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
Add new scripts to the `src/scripts` directory. Every script have the following:

```ts
import { BotZero } from "../common/BotZero"

module.exports = (robot: BotZero) => {
  // your code goes here
}
```

**Docker**<br/>
If you want to run in Docker, execute the following:

```sh
docker build -t bot-zero .
docker run -e HUBOT_SLACK_TOKEN=xoxb-you-token-here -it bot-zero
```

Or, if you already have a `.env`, run Docker Compose:

```sh
docker-compose up --build --remove-orphans
```

## Tech

We're using the following stack:

- [x] Node.js
- [x] TypeScript
- [x] Hubot
- [x] Bolt
- [x] NPM

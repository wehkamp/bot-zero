// local development file
const envFile = "./.env";

// load config for .env file - they are optional
const config = getConfig(envFile);

// will exit with error message when invalid!
validateToken(config);

// convert config into Hubot start
const params = convertConfigIntoParameters(config);
params.push("hubot");
params.push("--adapter");
params.push("slack");

// feed it to cross env - this will start Hubot with Slack
require("cross-env")(params);

function getConfig(envFile) {
  const fs = require("fs");

  if (fs.existsSync(envFile)) {
    return fs
      .readFileSync("./.env", "utf-8")
      .split("\n") // thanks Windows!
      .filter(l => l && l.indexOf("=") !== -1 && l.indexOf("#") !== 0);
  }

  return ["ENVIRONMENT=production"];
}

function validateToken(config) {
  const tokenStart = "xoxb-";

  // check for Hubot token in config
  let token = config.find(c => c.indexOf("HUBOT_SLACK_TOKEN") === 0);
  if (token && token.indexOf("=") !== -1) return token.split("=")[1];
  else token = process.env.HUBOT_SLACK_TOKEN;

  if (!token || token.length === 0) {
    console.log(
      "\x1b[33mNo HUBOT_SLACK_TOKEN found.\x1b[0m Please add it to your environment variables (for production) or to your .env file (for local development).\n"
    );
    process.exit();
  } else if (
    token.indexOf(tokenStart) !== 0 ||
    token.length <= tokenStart.length
  ) {
    console.warn(
      "\x1b[33mInvalid HUBOT_SLACK_TOKEN found.\x1b[0m Please check your environment variable (for production) or your .env file (for local development).\n"
    );
    process.exit();
  }
}

function convertConfigIntoParameters(config) {
  const params = [];

  config.forEach((c, index) => {
    c = c.trim();

    // should the parameter be quoted?
    if (c.indexOf(" ") !== -1 && c.indexOf('="') === -1) {
      c = c.replace("=", '="') + '"';
    }

    params.push(c);

    // add cross-env
    if (index !== config.length - 1) {
      params.push("cross-env");
    }
  });

  return params;
}

const Parser = require('rss-parser');
const axios = require('axios');
const fs = require('fs');

const parser = new Parser();

const RSS_URL = process.env.RSS_URL;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

let posted = [];

// load old posts
if (fs.existsSync('data.json')) {
  posted = JSON.parse(fs.readFileSync('data.json'));
}

async function sendMessage(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  await axios.post(url, {
    chat_id: CHAT_ID,
    text: text,
    parse_mode: "HTML"
  });
}

async function run() {
  try {
    const feed = await parser.parseURL(RSS_URL);

    for (let item of feed.items.slice(0, 5)) {

      if (!posted.includes(item.link)) {

        let message = `
<b>${item.title}</b>

Read more:
${item.link}

👉 Follow @investpercent
        `;

        await sendMessage(message);

        posted.push(item.link);
        fs.writeFileSync('data.json', JSON.stringify(posted));

        break; // only 1 post per run
      }
    }

  } catch (err) {
    console.log(err);
  }
}

setInterval(run, 60000); // every 1 minute

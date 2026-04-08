const Parser = require('rss-parser');
const axios = require('axios');
const fs = require('fs');

const parser = new Parser();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const RSS_FEEDS = [
  "https://www.moneycontrol.com/rss/MCtopnews.xml",
  "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
  "https://www.livemint.com/rss/markets",
  "https://www.coindesk.com/arc/outboundfeeds/rss/",
  "https://techcrunch.com/feed/",
  "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best"
];

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

    for (let feedUrl of RSS_FEEDS) {

      const feed = await parser.parseURL(feedUrl);

      for (let item of feed.items.slice(0, 3)) {

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

          return; // only 1 post per run
        }
      }
    }

  } catch (err) {
    console.log(err);
  }
}

setInterval(run, 60000); // every 1 minute

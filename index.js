const Parser = require('rss-parser');
const axios = require('axios');
const fs = require('fs');

const parser = new Parser();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const RSS_FEEDS = [
  "https://www.moneycontrol.com/rss/MCtopnews.xml",
  "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
  "https://www.livemint.com/rss/markets",
  "https://www.coindesk.com/arc/outboundfeeds/rss/",
  "https://techcrunch.com/feed/",
  "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best"
];

let posted = [];

// Load already posted links
if (fs.existsSync('data.json')) {
  posted = JSON.parse(fs.readFileSync('data.json'));
}

// Telegram sender
async function sendMessage(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  await axios.post(url, {
    chat_id: CHAT_ID,
    text: text,
    parse_mode: "HTML"
  });
}

// AI Summary Function
async function getAISummary(title) {
  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a financial news writer. Convert headlines into short 2-3 line insights in simple language. Add why it matters. No links. Keep it crisp."
          },
          {
            role: "user",
            content: `Convert this into a short Telegram update:\n\n${title}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.data.choices[0].message.content;

  } catch (err) {
    console.log("AI Error:", err.message);
    return title; // fallback
  }
}

// Main Runner
async function run() {
  try {
    for (let feedUrl of RSS_FEEDS) {

      const feed = await parser.parseURL(feedUrl);

      for (let item of feed.items.slice(0, 3)) {

        if (!posted.includes(item.link)) {

          // Get AI summary
          let aiText = await getAISummary(item.title);

          // Final message (NO LINKS)
          let message = `
🔥 Market Update

${aiText}

👉 Follow @investpercent
          `;

          await sendMessage(message);

          // Save posted link
          posted.push(item.link);
          fs.writeFileSync('data.json', JSON.stringify(posted));

          return; // only 1 post per run
        }
      }
    }

  } catch (err) {
    console.log("Run Error:", err.message);
  }
}

// Run every 1 minute
setInterval(run, 60000);

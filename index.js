const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_APP_ID = process.env.DIFY_APP_ID;

app.post('/webhook', async (req, res) => {
  const event = req.body.events[0];
  const userMessage = event.message.text;
  const replyToken = event.replyToken;

  try {
    // Difyへ質問送信
    const difyRes = await axios.post(
      `https://api.dify.ai/v1/chat-messages`,
      {
        inputs: {},
        query: userMessage,
        response_mode: 'blocking',
      },
      {
        headers: {
          Authorization: `Bearer ${DIFY_API_KEY}`,
          'Content-Type': 'application/json',
          'X-API-KEY': DIFY_API_KEY,
          'X-APP-ID': DIFY_APP_ID,
        },
      }
    );

    const difyReply = difyRes.data.answer;

    // LINEへ返信
    await axios.post(
      LINE_REPLY_URL,
      {
        replyToken: replyToken,
        messages: [
          {
            type: 'text',
            text: difyReply,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).send('OK');
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Error');
  }
});

app.listen(3000, () => console.log('Bot is running on port 3000'));

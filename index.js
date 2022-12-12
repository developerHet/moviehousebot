// Dependencies
const express = require("express");
const app = express();
const axios = require("axios");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");


//Load env vars
dotenv.config({ path: "./config/config.env" });

const port = 80;
const url = "https://api.telegram.org/bot";
const apiToken = process.env.TELEGRAM_BOT_API_KEY;

// Configurations
app.use(bodyParser.json());
// Endpoints
app.post("/", (req, res) => {
  console.log(req.body);
  res.send(req.body);
  const userChatId = req.body.message.chat.id;
  const userMessage = req.body.message.chat.text;
  // Regex for hello
  if (userMessage) {
    axios
      .post(`${url}${apiToken}/sendMessage`, {
        chat_id: userChatId,
        text: "hello back 👋",
      })
      .then((response) => {
        res.status(200).send(response);
      })
      .catch((error) => {
        res.send(error);
      });
  } else {
    // if no hello present, just respond with 200
    res.status(200).send({});
  }
});
// Listening
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

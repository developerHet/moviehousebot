//const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");
const fs = require("fs");
const {Bot,webhookCallback } = require('grammy');
const express = require('express');
//Load env vars
dotenv.config({ path: "./config/config.env" });



// Create a bot that uses 'polling' to fetch new updates
const bot = new Bot(process.env.TELEGRAM_BOT_API_KEY|| "");




const replayMessage =  (msg) => {
  const userChatId = msg.chat.id;
  const userMessage = msg.update.message.text;

  if ((msg.video || msg.document) && userChatId===process.env.USER_CHAT_ID) {
     bot.api.sendMessage(userChatId, msg.video.file_id);
    return;
  }

  if (userMessage) {
    // if (!userMessage.startsWith("tt")) {
    //    bot.api.sendMessage(userChatId, "Please enter valid IMDB ID.");
    //   return;
    // }

    const messageArray = userMessage.split("/");

    if (messageArray.length !== 2 && messageArray.length !== 4) {
       bot.api.sendMessage(
        userChatId,
        "Please enter request message in valid formate."
      );
      return;
    }

    // Read JSON file
    const data = JSON.parse(
      fs.readFileSync(`${__dirname}/_data/data.json`, "utf-8")
    );

    const name = messageArray[0];

    
    const foundItem = data.find((element) => element.name.toLowerCase() == name.toLowerCase());

    if (!foundItem) {
       bot.api.sendMessage(
        userChatId,
        `${name} is not available`
      );
      return;
    }

    if (messageArray.length === 2 && foundItem.type === "s") {
       bot.api.sendMessage(
        userChatId,
        `Please enter valid formate of series request message`
      );
      return;
    }

    if (messageArray.length === 4 && foundItem.type === "m") {
       bot.api.sendMessage(
        userChatId,
        `Please enter valid formate of movie request message`
      );
      return;
    }

    const quality = messageArray[1];
    const qualityArray = foundItem.data;

    const fileQuality = qualityArray.find(
      (element) => element.quality === quality
    );

    if (!fileQuality) {
       bot.api.sendMessage(
        userChatId,
        `File is not available in ${fileQuality}`
      );
      return;
    }

    let fileId = fileQuality.fileId;
    if (messageArray.length === 2) {
       bot.api.sendDocument(userChatId, fileId, { caption: messageArray[0] });
      return;
    } else {
      const seriesSeason = messageArray[2];

      if (!(seriesSeason in fileQuality)) {
         bot.api.sendMessage(
          userChatId,
          `${seriesSeason} season is not available`
        );
        return;
      }

      const season = fileQuality[seriesSeason][0];

      const seasonEpisode = messageArray[3];

      if (!(seasonEpisode in season)) {
         bot.api.sendMessage(
          userChatId,
          `${seasonEpisode} episode is not available`
        );
        return;
      }

      fileId = season[seasonEpisode];
      const caption =  `Movie Name :- ${messageArray[0]}\nQuality :- ${messageArray[1]}`;
       bot.api.sendDocument(userChatId, fileId, { caption: caption });
      return;
    }
  }
};

bot.on("message", replayMessage);

// Start the server
if (process.env.NODE_ENV === "production") {
    // Use Webhooks for the production server
    const app = express();
    app.use(express.json());
    app.use(webhookCallback(bot, "express"));
  
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Bot listening on port ${PORT}`);
    });
  } else {
    // Use Long Polling for development
    bot.start();
  }
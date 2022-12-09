const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");
const fs = require("fs");

//Load env vars
dotenv.config({ path: "./config/config.env" });

// replace the value below with the Telegram token you receive from @BotFather
const token = "5857520568:AAF932wbM8cQB22ycRrw9pWl0qiVwAVP3ds";

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

bot.on("message", async (msg) => {
  const userChatId = msg.chat.id;
  const userMessage = msg.text;
  
  if ((msg.video || msg.document) && userChatId=="1618961129") {
    await bot.sendMessage(userChatId, msg.video.file_id);
    return;
  }

  if (userMessage) {
    // if (!userMessage.startsWith("tt")) {
    //   await bot.sendMessage(userChatId, "Please enter valid IMDB ID.");
    //   return;
    // }

    const messageArray = userMessage.split("/");

    if (messageArray.length !== 2 && messageArray.length !== 4) {
      await bot.sendMessage(
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
      await bot.sendMessage(
        userChatId,
        `${name} is not available`
      );
      return;
    }

    if (messageArray.length === 2 && foundItem.type === "s") {
      await bot.sendMessage(
        userChatId,
        `Please enter valid formate of series request message`
      );
      return;
    }

    if (messageArray.length === 4 && foundItem.type === "m") {
      await bot.sendMessage(
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
      await bot.sendMessage(
        userChatId,
        `File is not available in ${fileQuality}`
      );
      return;
    }

    let fileId = fileQuality.fileId;
    if (messageArray.length === 2) {
      await bot.sendDocument(userChatId, fileId, { caption: messageArray[0] });
      return;
    } else {
      const seriesSeason = messageArray[2];

      if (!(seriesSeason in fileQuality)) {
        await bot.sendMessage(
          userChatId,
          `${seriesSeason} season is not available`
        );
        return;
      }

      const season = fileQuality[seriesSeason][0];

      const seasonEpisode = messageArray[3];

      if (!(seasonEpisode in season)) {
        await bot.sendMessage(
          userChatId,
          `${seasonEpisode} episode is not available`
        );
        return;
      }

      fileId = season[seasonEpisode];
      const caption =  `Movie Name :- ${messageArray[0]}\nQuality :- ${messageArray[1]}`;
      await bot.sendDocument(userChatId, fileId, { caption: caption });
      return;
    }
  }
});

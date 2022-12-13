const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");
const fs = require("fs");

//Load env vars
dotenv.config({ path: "./config/config.env" });

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_BOT_API_KEY;

// Create a bot that uses 'polling' to fetch new updates

var bot;
if (process.env.NODE_ENV === "production") {
  bot = new TelegramBot(token, {
    webHook: {
      port: process.env.PORT,
      host: "0.0.0.0",
    },
  });

  bot.setWebHook(`${process.env.HOST_URL}/${token}`);
  console.log(`Bot running on port ${process.env.PORT}`);
} else {
  bot = new TelegramBot(token, { polling: true });
  console.log("Bot running in development mode");
}

const startMessage = `<b>Request Message Format</b>\n\nMovie_Name/Quality\nEx. Iron Man/720p\n\nSeries_Name/Quality/s1/e1\nEx. Money Heist/720p/s1/e1 \n\n<b>Note:</b>\nTake movie name from google to avoid spelling mistake 🔎.`;

bot.on("message", async (msg) => {
  const userChatId = msg.chat.id;
  const userMessage = msg.text;
  const userName = msg.from.username;
  console.log(msg);

  if( !(msg.video || msg.document) && userMessage.startsWith('/')) {
    await bot.sendMessage(
      userChatId,
      startMessage,
      {parse_mode : "HTML"}
    );
    return;
  }

  if (
    (msg.video || msg.document) &&
    (userChatId == process.env.USER_CHAT_ID_1 ||
      userChatId == process.env.USER_CHAT_ID_2)
  ) {
    const fileIdWithName = `${msg.caption} :- \n\n <code>${msg.video.file_id}</code>`;
    await bot.sendMessage(userChatId, fileIdWithName,{parse_mode: "HTML"});
    return;
  }

  

  if (userMessage) {
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

    const foundItem = data.find(
      (element) => element.name.toLowerCase() == name.toLowerCase()
    );

    if (!foundItem) {
      await bot.sendMessage(
        process.env.USER_CHAT_ID_1,
        `${name} is not available. @${userName}`
      );
      await bot.sendMessage(userChatId, `${name} is not available`);
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

    const quality = messageArray[1].toLowerCase();
    const qualityArray = foundItem.data;

    const fileQuality = qualityArray.find(
      (element) => element.quality === quality
    );

    if (!fileQuality) {
      await bot.sendMessage(
        process.env.USER_CHAT_ID_1,
        `${name} quality ${quality} is not available. @${userName}`
      );
      await bot.sendMessage(
        userChatId,
        `File is not available in ${quality}`
      );
      return;
    }

    let fileId = fileQuality.fileId;
    if (messageArray.length === 2) {
      const movieCaption = `Name :- ${messageArray[0]}\nQuality :- ${messageArray[1]}`;
      await bot.sendDocument(userChatId, fileId, { caption: movieCaption });
      return;
    } else {
      const seriesSeason = messageArray[2].toLowerCase();

      if (!(seriesSeason in fileQuality)) {
        await bot.sendMessage(
          process.env.USER_CHAT_ID_1,
          `${name} season ${seriesSeason} is not available. @${userName}`
        );
        await bot.sendMessage(
          userChatId,
          `${seriesSeason} season is not available`
        );
        return;
      }

      const season = fileQuality[seriesSeason][0];

      const seasonEpisode = messageArray[3].toLowerCase();

      if (!(seasonEpisode in season)) {
        await bot.sendMessage(
          process.env.USER_CHAT_ID_1,
          `${name} season ${seriesSeason}  episode ${seasonEpisode} is not available. @${userName}`
        );
        await bot.sendMessage(
          userChatId,
          `${seasonEpisode} episode is not available`
        );
        return;
      }

      fileId = season[seasonEpisode];
      const movieCaption = `Name :- ${messageArray[0]}\nQuality :- ${messageArray[1]}\nSeason :- Season ${seriesSeason[1]}\nEpisode :- Episode ${seasonEpisode[1]}`;
      await bot.sendDocument(userChatId, fileId, { caption: movieCaption });
      return;
    }
  }
});

//Don't sleep
const http = require("http");
const express = require("express");
const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 100000);

const Telegraf = require("telegraf");
const { Extra, Markup } = Telegraf;
const session = require("telegraf/session");

var m_activeContexts = {};

// Bot creation
const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

bot.use((ctx, next) => {
  console.log(
    "Message from user",
    ctx.chat.username,
    "recieved:",
    ctx.message.text
  );
  if (ctx.message.text == "/wipe") {
    ctx.session = {};
    return ctx.reply("session wiped").then(() => next(ctx));
  }
  return next(ctx);
});


bot.start(ctx => {
  ctx.reply(
    "I am a simple timer bot. Enter /x to create a new timer, where x is the number of minutes till the timer runs out."
  );
});

bot.help(ctx => {
  ctx.reply(
    "I am a simple timer bot. Enter /x to create a new timer, where x is the number of minutes till the timer runs out."
  );
});

bot.command("stop", ctx => {
  stopTimers(ctx);
  return ctx.reply("Cleared all timers.");
});

bot.command("cancel", ctx => {
  stopTimers(ctx);
  return ctx.reply("Cleared all timers.");
});

bot.command(ctx => {

  var msg = ctx.message.text;
  if (/^\/\d{1,5}/.test(msg)) {
    var match = msg.match(/^\/\d{1,5}/);
    // create timer command
    var label = " "
    if(msg !== "")
      var label = msg.substring(match[0].length).trim() || "";
    var time = parseInt(match[0].substring(1));
    time = time * 60 * 1000;

    var timers = ctx.session.timers || [];
    var now = Date.now();
    var end = now + time;

    timers.push({
      time: time,
      label: label,
      created: now,
      end: end,
      invalidated: false
    });
    ctx.session.timers = timers;

    var sessionKey = getSessionKey(ctx);

    if (m_activeContexts[sessionKey] == null) {
      m_activeContexts[sessionKey] = setInterval(function() {
        intervalHandler(ctx);
      }, 5000);
    }
  }
});

const intervalHandler = ctx => {
     /*const markup = ctx.telegram.inlineKeyboard([
          [
            ctx.telegram.inlineButton("Cancel", { callback_data: "/cancel" })
          ]
        ]);*/
  var reply = "";
  var invalidatedCount = 0;
  ctx.session.timers.forEach(t => {
    var timeRest = t.end - Date.now();
    if (timeRest <= 0) {
      if (!t.invalidated) {
        t.invalidated = true;
        ctx.telegram.sendMessage(ctx.chat.id, 
          "⏳Time's up:" +
            (t.label.length > 0 ? " " + t.label : "") +
            " " +
            millisToMinutesAndSeconds(t.time), {reply_to_message_id: `${ctx.message.message_id}`}
        );
      }
    }
    reply +=
      `\n${ctx.message.from.first_name} set a timer: ` + "<b>⏳" +
      millisToMinutesAndSeconds(timeRest) +
      (t.label.length > 0 ? ` — ${t.label}` : "</b>") +
      (t.invalidated ? " <i>Expired</i>" : "");

    if (t.invalidated) {
      invalidatedCount++;
    }
  });

  if (reply.length > 0) {
    if (ctx.session.canEdit) {
      ctx.telegram.editMessageText(
        ctx.session.editMessageChatId,
        ctx.session.editMessageId,
        ctx.session.editInlineMessageId,
        reply,
        {parse_mode: 'html',
        reply_markup: {inline_keyboard: [[{text: 'Cancel', callback_data:'cancel'},],]} } 
      );
    } else {
      var options = {parse_mode: 'html', reply_to_message_id: `${ctx.message.message_id}`}
      ctx.telegram.sendMessage(ctx.chat.id, reply, options).then(replyCtx => {
        ctx.session.editMessageId = replyCtx.message_id;
        ctx.session.editInlineMessageId = replyCtx.inline_message_id;
        ctx.session.editMessageChatId = replyCtx.chat.id;
        ctx.session.canEdit = true;
      });
    }
  } else {
    console.log("Nothing to reply");
  }

  if (invalidatedCount == ctx.session.timers.length) {
    stopTimers(ctx);
  }
};

// Critical error handler
bot.catch(err => {
  console.log("Ooops", err);
});

// We can get bot nickname from bot informations. This is particularly useful for groups.
bot.telegram.getMe().then(bot_informations => {
  bot.options.username = bot_informations.username;
  console.log(
    "Server has initialized bot nickname. Nick: " + bot_informations.username
  );
});

bot.on("callbackQuery", ctx => {
  if(ctx.data === "cancel") {
    stopTimers(ctx);
    return ctx.reply("Cleared all timers."); 
  }
    
});

function millisToMinutesAndSeconds(millis) {
  //var minus = millis < 0 ? "-" : "";
  millis = Math.abs(millis);
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return (
    (minutes < 10 ? "0" : "") +
    minutes +
    ":" +
    (seconds < 10 ? "0" : "") +
    seconds
  );
}

function stopTimers(ctx) {
  var sessionKey = getSessionKey(ctx);
  var interval = m_activeContexts[sessionKey];
  clearInterval(interval);
  m_activeContexts[sessionKey] = null;
  ctx.session.canEdit = false;
  ctx.session.timers = [];
}

function getSessionKey(ctx) {
  if (ctx.from && ctx.chat) {
    return `${ctx.from.id}:${ctx.chat.id}`;
  } else if (ctx.from && ctx.inlineQuery) {
    return `${ctx.from.id}:${ctx.from.id}`;
  }
  return null;
}

// Start bot polling in order to not terminate Node.js application.
bot.startPolling();

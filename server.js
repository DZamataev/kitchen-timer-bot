//Don't sleep
const http = require("http");
const express = require("express");
const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
/*setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 240000);*/

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const PORT = process.env.PORT || 8443;
const URL = process.env.URL || "https://simpletimer-bot.herokuapp.com:8443/";

const Telegraf = require("telegraf");
const { Extra, Markup } = Telegraf;
const session = require("telegraf/session");

var m_activeContexts = {};

// Bot creation
const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

/*bot.use((ctx, next) => {
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
});*/

bot.start(ctx => {
  ctx.telegram.sendMessage(
    ctx.chat.id,
    `I am Snoozy Timer.

Usage:

Send <b>/&lt;minutes&gt; [label]</b> to create a new timer. Give the number of minutes till the timer runs out with an optional label.
However, you can create multiple timers using the same command and have them running simultaneously.

For eg., <code>/10 walk</code> will create a timer for 10 minutes with label <i>walk</i>.

You can now snooze a timer for 10 minutes by pressing the Snooze💤 button. Snooze button can be used multiple times.`,
    { parse_mode: "HTML" }
  );
});

bot.help(ctx => {
  ctx.telegram.sendMessage(
    ctx.chat.id,
    `I am Snoozy Timer. 

Usage:

Send <b>/&lt;minutes&gt; [label]</b> to create a new timer. Give the number of minutes till the timer runs out with an optional label.
However, you can create multiple timers using the same command and have them running simultaneously.

For eg., <code>/10 walk</code> will create a timer for 10 minutes with label <i>walk</i>.

You can now snooze a timer for 10 minutes by pressing the Snooze💤 button. Snooze button can be used multiple times.`,
    { parse_mode: "HTML" }
  );
});

bot.command("stop", ctx => {
  session.snooze = 0 
  stopTimers(ctx);
  return ctx.reply("Stopped all timers 🛑");
});

bot.command("cancel", ctx => {
  session.snooze = 0
  stopTimers(ctx);
  return ctx.reply("Stopped all timers 🛑");
});

bot.command(ctx => {
  ctx.telegram.sendChatAction(ctx.chat.id, "typing");
  session.snooze = 0
  var msg = ctx.message.text;
  if (/^\/\d{1,5}/.test(msg)) {
    var match = msg.match(/^\/\d{1,5}/);
    // create timer command
    var label = " ";
    if (msg !== "") var label = msg.substring(match[0].length).trim() || "";
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

//snooze variable
session.snooze = 0;

const intervalHandler = ctx => {
  var reply = "";
  var invalidatedCount = 0;
  ctx.session.timers.forEach(t => {
    if(session.snooze != 0) {
      var timeRest = (t.end - Date.now()) + (session.snooze * 60000);
    }
    var timeRest = (t.end - Date.now()) + (session.snooze * 60000)
    //console.log(timeRest)
    if (timeRest <= 0) {
      if (!t.invalidated) {

        //stopTimers(ctx)
        //ctx.editMessageText("⏳Timer(s) stopped 🛑")
        t.invalidated = true;
        ctx.telegram.sendMessage(
          ctx.chat.id,
          "⌛️Time's up:<b>" +
            " " +
            millisToMinutesAndSeconds(t.time) + (session.snooze > 0 ? " (+"+session.snooze +"m💤)" : "") +
            (t.label.length > 0 ? " — " + t.label + "</b>" : "</b><i> — no label</i>") +
            " ",
          {
            parse_mode: "HTML",
            reply_to_message_id: `${ctx.message.message_id}`
          }
        );
        //reset snooze time when timer ends
        session.snooze = 0
        //unpin timer message after it ends
        ctx.telegram.unpinChatMessage(ctx.chat.id)
      }
    }
    reply +=
      "\n\n<b>⏳" +
      millisToMinutesAndSeconds(timeRest) +
      (t.label.length > 0 ? ` — ${t.label}</b>` : "</b><i> — no label</i>") +
      (t.invalidated ? " ✅" : "");

    if (t.invalidated) {
      invalidatedCount++;
    }
  });

  if (reply.length > 0) {
    if (ctx.session.canEdit) {
      //ctx.telegram.sendChatAction(ctx.chat.id,"typing")
      ctx.telegram.editMessageText(
        ctx.session.editMessageChatId,
        ctx.session.editMessageId,
        ctx.session.editInlineMessageId,
        reply,
        {
          parse_mode: "html",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Stop 🔴", callback_data: "stop" },
                { text: "Snooze 💤", callback_data: "snooze" } 
              ],
            ]
          }
        }
      );
    } else {
      var options = {
        parse_mode: "html",
        reply_to_message_id: `${ctx.message.message_id}`
      };
      ctx.telegram.sendMessage(ctx.chat.id, reply, options).then(replyCtx => {
        ctx.session.editMessageId = replyCtx.message_id;
        ctx.session.editInlineMessageId = replyCtx.inline_message_id;
        ctx.session.editMessageChatId = replyCtx.chat.id;
        ctx.session.canEdit = true;
        if(ctx.chat.type === "group" ||
            ctx.chat.type === "supergroup" )
          ctx.telegram.pinChatMessage(ctx.chat.id, replyCtx.message_id)
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

bot.action("stop", ctx => {
  ctx.answerCbQuery("Stopped all timers.");
  if (ctx.match === "stop") {
    stopTimers(ctx);
    ctx.editMessageText("⏳Timer(s) stopped 🔴");
  }
  session.snooze = 0
});

bot.action("snooze", ctx => {
  session.snooze = session.snooze + 10;
  ctx.answerCbQuery("Snoozed all timers by 10 minutes.");
});

function millisToMinutesAndSeconds(millis) {
  //var minus = millis < 0 ? "-" : "";
  //millis = Math.abs(millis);
  var minutes = Math.floor(millis / 60000)
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  if (millis > 0) {
      var min = minutes; //< 10 ? "0" : "") + minutes)
    var sec = (seconds < 10 ? "0" : "") + seconds;

    var result = min + ":" + sec;
    if (sec == 60) {
      min = parseInt(min, 10);
      min = min + 1;
      min = min.toString();
      sec = "00";
    }
    return min + ":" + sec;
  } else if (millis < 0) return "0:00";
  else return "0:00";
}

function stopTimers(ctx) {
  var sessionKey = getSessionKey(ctx);
  var interval = m_activeContexts[sessionKey];
  clearInterval(interval);
  m_activeContexts[sessionKey] = null;
  ctx.session.canEdit = false;
  ctx.session.timers = [];
  //unpin after the timer is stopped
  if(ctx.chat.type === "group" ||
            ctx.chat.type === "supergroup" )
  ctx.telegram.unpinChatMessage(ctx.chat.id, replyCtx.message_id)
}

function getSessionKey(ctx) {
  if (ctx.from && ctx.chat) {
    return `${ctx.from.id}:${ctx.chat.id}`;
  } else if (ctx.from && ctx.inlineQuery) {
    return `${ctx.from.id}:${ctx.from.id}`;
  }
  return null;
}

//bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);
//bot.startWebhook(`/bot${BOT_TOKEN}`, null, PORT);
//bot.launch();
//Start bot polling in order to not terminate Node.js application.
bot.startPolling();

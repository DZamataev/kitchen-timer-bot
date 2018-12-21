# Telegram Bot in Node.JS, using Telegraf, for setting up multiple timers for cooking 

(![Demo gif](https://github.com/DZamataev/kitchen-timer-bot/raw/master/gif/demo.gif))

# How to use existing bot

Find @kitchen_timer_bot on Telegram or follow ![this link.](t.me/kitchen_timer_bot)

# How to run your own

* Open Telegram app and create your own bot and aquire HTTP_API_TOKEN from @botfather
* Clone the repo into desired folder (```git clone https://github.com/DZamataev/kitchen-timer-bot```)
* Navigate to ```abot``` folder (```cd abot```)
* Create file named ```config.js``` (```touch config.js```)
* Paste the following snippet into the config and replace ```YOUR_TOKEN_HERE``` with your previously aquired token.
```
module.exports = {
    HTTP_API_TOKEN: process.env.HTTP_API_TOKEN || 'YOUR_TOKEN_HERE'
};
```
* Make sure that you have Node.js and Docker installed and execute ```npm run deploy```
* Optionally consider using ```npm run undeploy``` and ```npm run dev``` if you want to tear down installation or make changes
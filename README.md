# Telegram Bot in Node.JS, using Telegraf, for searching torrents at Rutracker and add them to your Transmission web service

(![Demo gif](https://github.com/DZamataev/telegraf-rutracker-transmission/raw/master/gif/demo.gif))

# How to run

* Open Telegram app and create your own bot and aquire HTTP_API_TOKEN from @botfather
* Clone the repo into desired folder (```git clone https://github.com/DZamataev/telegraf-rutracker-transmission```)
* Navigate to ```abot``` folder (```cd abot```)
* Create file named ```config.js``` (```touch config.js```)
* Paste the following snippet into the config and replace ```YOUR_TOKEN_HERE``` with your previously aquired token.
```
module.exports = {
    HTTP_API_TOKEN: process.env.HTTP_API_TOKEN || 'YOUR_TOKEN_HERE',
    SESSION_HOST: process.env.SESSION_HOST || '127.0.0.1',
    SESSION_PORT: process.env.SESSION_PORT || 6379,
    ONLY_PRIVATE_CHAT: process.env.ONLY_PRIVATE_CHAT || true,
    ONLY_USERNAME: process.env.ONLY_USERNAME || '',
};
```
* Make sure that you have Node.js and Docker installed and execute ```npm run deploy```
* Optionally consider using ```npm run undeploy``` and ```npm run dev``` if you want to tear down installation or make changes
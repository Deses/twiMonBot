Twitch and Youtube livestream monitor
=======

Since the original seems down, here's an alternative. It only works for Twitch and YouTube, I didn't bother to set it for WASD.

This is a bot for Telegram.

Write to [@AnotherTwitchMonitorBot](https://t.me/AnotherTwitchMonitorBot) and use it!

Run and self-host your own!
---
Use docker-compose. Rename example.env to .env and fill all the info:

- `TELEGRAM_TOKEN` - Create a bot with [@BotFather](https://t.me/BotFather).
- `GA_TID` - Can be left empty.
- `TWITCH_TOKEN` & `TWITCH_SECRET` - Go to the [Twitch Dev Console](https://dev.twitch.tv/console) and create an Application. "OAuth Redirect URLs" can be left as `http://localhost`.
- `YOUTUBE_TOKEN` - Go to [Google Cloud Console](https://console.cloud.google.com/), create a project and create an API "YouTube Data API v3"	.
- `YOUTUBE_PUBSUB_HOST=` - I think this is webhooks for push notifications. [Check this guide](https://www.youtube.com/watch?v=QQSJGS2JR4w) [Youtube API docs](https://developers.google.com/youtube/v3/guides/push_notifications). No idea what to put here.
- `YOUTUBE_PUBSUB_PORT` - 443
- `YOUTUBE_PUBSUB_PATH` - /
- `YOUTUBE_PUBSUB_SECRET` - No idea what to put here.
- `YOUTUBE_PUBSUB_CALLBACK_URL` - No idea what to put here.
- `WASD_TOKEN` - Get the WASD token if you care about it.
- `DB_HOST` - Either "localhost" or the IP of your docker container. `sudo docker ps` and `docker inspect <container id> | grep "IPAddress"` to retrieve it.
- `DB_PORT` - `3306`
- `DB_DATABASE` - Same as `MARIADB_DATABASE` below.
- `DB_USER` - Same as `MARIADB_USER` below.
- `DB_PASSWORD` - Same as `MARIADB_PASSWORD` below.
- `TG_ADMIN_CHAT_ID` - TBH I don't know. I created a group, invited [@getidsbot](https://t.me/getidsbot) and this bot (the one you created), and @getidsbot should give you the channel's ID. Put that channel ID here.
- `CHANNEL_BLACKLIST` - 

- `MARIADB_DATABASE` - A name of your licking.
- `MARIADB_USER` - A name of your licking.
- `MARIADB_PASSWORD` - [Write a strong password.](https://passwordsgenerator.net/)
- `MARIADB_ROOT_PASSWORD` - [Write a strong password.](https://passwordsgenerator.net/)

Then, run this:

```bash
sudo docker-compose up -d
```

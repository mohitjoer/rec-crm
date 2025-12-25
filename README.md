# YouTube to Discord Bot

A Discord bot that monitors YouTube channels and automatically posts new videos to a Discord channel.

## Features

- 🔔 Monitors multiple YouTube channels for new videos
- 📢 Posts new videos with rich embeds to Discord
- ⏰ Configurable check interval
- 💾 Tracks posted videos to avoid duplicates
- 🚀 Built with Bun for fast performance

## Prerequisites

- [Bun](https://bun.sh/) installed
- Discord Bot Token
- YouTube Data API v3 Key
- A Discord server where you have admin permissions

## Setup

### 1. Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to "Bot" section and click "Add Bot"
4. Copy the bot token (you'll need this later)
5. Enable these Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent
6. Go to OAuth2 > URL Generator:
   - Select "bot" scope
   - Select permissions: "Send Messages", "Embed Links"
   - Copy the generated URL and use it to invite the bot to your server

### 2. Get YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "YouTube Data API v3"
4. Go to "Credentials" and create an API Key
5. Copy the API key

### 3. Find YouTube Channel IDs

To find a channel ID:
- Go to the YouTube channel
- The channel ID is in the URL: `youtube.com/channel/CHANNEL_ID`
- Or use [this tool](https://commentpicker.com/youtube-channel-id.php)

### 4. Configure the Bot

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values:
   ```env
   DISCORD_TOKEN=your_discord_bot_token
   DISCORD_CHANNEL_ID=your_discord_channel_id
   YOUTUBE_API_KEY=your_youtube_api_key
   YOUTUBE_CHANNEL_IDS=channel_id_1,channel_id_2
   CHECK_INTERVAL_MINUTES=10
   ```

To get the Discord channel ID:
- Enable Developer Mode in Discord (User Settings > App Settings > Advanced)
- Right-click the channel and click "Copy ID"

## Installation

```bash
bun install
```

## Running the Bot

### Development (with auto-reload)
```bash
bun dev
```

### Production
```bash
bun start
```

## Project Structure

```
social-bot/
├── index.ts           # Main entry point
├── src/
│   ├── config.ts      # Configuration & validation
│   ├── discord.ts     # Discord client & messaging
│   ├── youtube.ts     # YouTube API integration
│   ├── scheduler.ts   # Video check scheduler
│   └── storage.ts     # Persistent storage for posted videos
├── .env.example       # Example environment variables
└── package.json
```

## How It Works

1. The bot checks the configured YouTube channels at regular intervals
2. When a new video is detected, it creates a rich embed with:
   - Video title and link
   - Channel name
   - Video description (truncated)
   - Thumbnail
   - Published timestamp
3. The video ID is stored to prevent duplicate posts
4. The cycle repeats based on the configured interval

## API Rate Limits

- YouTube API: 10,000 units/day (each search costs ~100 units)
- Discord: 50 messages per second per channel

With default settings (10-minute intervals, 3 videos per channel), you can monitor approximately 30+ channels within the free YouTube API quota.

## License

MIT

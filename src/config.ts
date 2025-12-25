export const config = {
  discordToken: process.env.DISCORD_TOKEN!,
  discordChannelId: process.env.DISCORD_CHANNEL_ID!,
  youtubeApiKey: process.env.YOUTUBE_API_KEY!,
  youtubeChannelIds: process.env.YOUTUBE_CHANNEL_IDS?.split(",").map((id) =>
    id.trim()
  ) || [],
  checkIntervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES || "10", 10),
};

export function validateConfig(): void {
  const required = [
    ["DISCORD_TOKEN", config.discordToken],
    ["DISCORD_CHANNEL_ID", config.discordChannelId],
    ["YOUTUBE_API_KEY", config.youtubeApiKey],
  ] as const;

  const missing = required.filter(([, value]) => !value).map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (config.youtubeChannelIds.length === 0) {
    throw new Error("At least one YouTube channel ID is required in YOUTUBE_CHANNEL_IDS");
  }
}

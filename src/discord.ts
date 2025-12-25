import {
  Client,
  GatewayIntentBits,
  TextChannel,
  EmbedBuilder,
  type Message,
} from "discord.js";
import { config } from "./config";
import type { YouTubeVideo } from "./youtube";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

export async function sendVideoEmbed(video: YouTubeVideo): Promise<Message | null> {
  const channel = client.channels.cache.get(config.discordChannelId);

  if (!channel || !(channel instanceof TextChannel)) {
    console.error("Discord channel not found or is not a text channel");
    return null;
  }

  const embed = new EmbedBuilder()
    .setColor(0xff0000) // YouTube red
    .setTitle(video.title)
    .setURL(video.videoUrl)
    .setAuthor({
      name: video.channelTitle,
      url: `https://www.youtube.com/channel/${video.channelId}`,
    })
    .setDescription(
      video.description.length > 200
        ? video.description.substring(0, 200) + "..."
        : video.description || "No description"
    )
    .setThumbnail(video.thumbnailUrl)
    .setTimestamp(new Date(video.publishedAt))
    .setFooter({ text: "🎬 New YouTube Video!" });

  try {
    const message = await channel.send({
      content: `🔔 **New video from ${video.channelTitle}!**`,
      embeds: [embed],
    });
    return message;
  } catch (error) {
    console.error("Failed to send Discord message:", error);
    return null;
  }
}

export async function initializeDiscord(): Promise<void> {
  return new Promise((resolve, reject) => {
    client.once("clientReady", () => {
      console.log(`✅ Discord bot logged in as ${client.user?.tag}`);
      resolve();
    });

    client.once("error", reject);

    client.login(config.discordToken).catch(reject);
  });
}

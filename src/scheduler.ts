import { getAllChannelVideos } from "./youtube";
import { sendVideoEmbed } from "./discord";
import { config } from "./config";

// Track posted videos in memory (resets on restart)
const postedVideoIds = new Set<string>();

// Only post videos published after bot starts
const botStartTime = new Date();

export async function checkForNewVideos(): Promise<void> {
  console.log(`🔍 Checking for new videos at ${new Date().toLocaleString()}...`);

  try {
    const videos = await getAllChannelVideos();
    let newVideosCount = 0;

    for (const video of videos) {
      const publishedAt = new Date(video.publishedAt);
      
      // Skip videos published before bot started or already posted this session
      if (publishedAt < botStartTime || postedVideoIds.has(video.videoId)) {
        continue;
      }

      console.log(`📹 New video found: "${video.title}" from ${video.channelTitle}`);

      const message = await sendVideoEmbed(video);

      if (message) {
        postedVideoIds.add(video.videoId);
        newVideosCount++;
        console.log(`✅ Posted video: ${video.videoId}`);
      }

      // Small delay between posts to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (newVideosCount === 0) {
      console.log("📭 No new videos found");
    } else {
      console.log(`📬 Posted ${newVideosCount} new video(s)`);
    }
  } catch (error) {
    console.error("❌ Error checking for new videos:", error);
  }
}

export function startScheduler(): void {
  const intervalMs = config.checkIntervalMinutes * 60 * 1000;

  console.log(
    `⏰ Scheduler started - checking every ${config.checkIntervalMinutes} minutes`
  );
  console.log(`📅 Will only post videos published after: ${botStartTime.toLocaleString()}`);

  // Run immediately on start
  checkForNewVideos();

  // Then run on interval
  setInterval(checkForNewVideos, intervalMs);
}

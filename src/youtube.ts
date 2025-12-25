import { config } from "./config";

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnailUrl: string;
  videoUrl: string;
}

interface YouTubeSearchResponse {
  items: Array<{
    id: { videoId: string };
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
      channelId: string;
      publishedAt: string;
      thumbnails: {
        high?: { url: string };
        medium?: { url: string };
        default?: { url: string };
      };
    };
  }>;
}

export async function getLatestVideos(channelId: string, maxResults = 5): Promise<YouTubeVideo[]> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("maxResults", maxResults.toString());
  url.searchParams.set("order", "date");
  url.searchParams.set("type", "video");
  url.searchParams.set("key", config.youtubeApiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as YouTubeSearchResponse;

  return data.items.map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    channelTitle: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
    publishedAt: item.snippet.publishedAt,
    thumbnailUrl:
      item.snippet.thumbnails.high?.url ||
      item.snippet.thumbnails.medium?.url ||
      item.snippet.thumbnails.default?.url ||
      "",
    videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }));
}

export async function getAllChannelVideos(): Promise<YouTubeVideo[]> {
  const allVideos: YouTubeVideo[] = [];

  for (const channelId of config.youtubeChannelIds) {
    try {
      const videos = await getLatestVideos(channelId, 3);
      allVideos.push(...videos);
    } catch (error) {
      console.error(`Failed to fetch videos for channel ${channelId}:`, error);
    }
  }

  // Sort by published date (newest first)
  return allVideos.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

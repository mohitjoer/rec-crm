import { validateConfig, config } from "./src/config";
import { initializeDiscord, client } from "./src/discord";
import { startScheduler, testPost } from "./src/scheduler";

const isTestMode = process.argv.includes("--test");

console.log("🤖 Starting YouTube to Discord Bot...");

// Validate configuration
try {
  validateConfig();
  console.log("✅ Configuration validated");
} catch (error) {
  console.error("❌ Configuration error:", error);
  process.exit(1);
}

console.log(`📺 Monitoring ${config.youtubeChannelIds.length} YouTube channel(s)`);

// Initialize Discord and start the bot
try {
  await initializeDiscord();
  
  if (isTestMode) {
    // Test mode: post latest video and exit
    console.log("🧪 Running in TEST MODE...");
    await testPost();
    console.log("✅ Test complete! Shutting down...");
    client.destroy();
    process.exit(0);
  } else {
    // Normal mode: start scheduler
    startScheduler();
  }
} catch (error) {
  console.error("❌ Failed to start bot:", error);
  process.exit(1);
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down bot...");
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n👋 Shutting down bot...");
  client.destroy();
  process.exit(0);
});
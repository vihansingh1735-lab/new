import "dotenv/config";

import { Client, GatewayIntentBits, Collection } from "discord.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import http from "http";

/* ===============================
   DISCORD CLIENT
================================ */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

/* ===============================
   COMMAND LOADER
================================ */
const commandsPath = path.join(process.cwd(), "src/commands");

for (const folder of fs.readdirSync(commandsPath)) {
  const folderPath = path.join(commandsPath, folder);

  for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith(".js"))) {
    const command = await import(path.join(folderPath, file));
    client.commands.set(command.data.name, command);
  }
}

/* ===============================
   INTERACTIONS
================================ */
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    if (!interaction.replied) {
      await interaction.reply({ content: "⚠️ Command error.", ephemeral: true });
    }
  }
});

/* ===============================
   FAKE WEB SERVER
================================ */
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    name: "Olympus Core",
    status: "online",
    uptime: process.uptime(),
    time: new Date().toISOString()
  }, null, 2));
}).listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

/* ===============================
   READY
================================ */
client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🍃 MongoDB connected");
  }
});

/* ===============================
   LOGIN (FIXED)
================================ */
console.log("TOKEN FOUND:", !!process.env.DISCORD_TOKEN);
client.on("error", console.error);
client.on("warn", console.warn);
client.on("shardError", console.error);
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log("🔐 Discord login request sent"))
  .catch(err => console.error("❌ LOGIN FAILED:", err));

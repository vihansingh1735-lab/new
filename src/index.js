import { Client, GatewayIntentBits, Collection } from "discord.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import http from "http";

// ===== CONFIG LOAD (no assert) =====
const config = JSON.parse(
  fs.readFileSync("./src/config/config.json", "utf-8")
);

// ===== DISCORD CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// ===== COMMAND HANDLER =====
const commandsPath = path.join(process.cwd(), "src/commands");
for (const folder of fs.readdirSync(commandsPath)) {
  const folderPath = path.join(commandsPath, folder);
  for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith(".js"))) {
    const cmd = await import(path.join(folderPath, file));
    client.commands.set(cmd.data.name, cmd);
  }
}

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  await command.execute(interaction);
});

// ===== FAKE WEB SERVER =====
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });

  res.end(JSON.stringify({
    status: "online",
    server: "fake-web-server",
    bot: client.user ? client.user.tag : "starting",
    path: req.url,
    time: new Date().toISOString()
  }, null, 2));
}).listen(PORT, () => {
  console.log(`Fake web server running on port ${PORT}`);
});

// ===== BOT READY =====
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await mongoose.connect(config.mongoUri);
  console.log("MongoDB connected");
});

// ===== LOGIN =====
client.login(config.token);

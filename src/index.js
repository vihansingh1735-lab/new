import { Client, GatewayIntentBits, Collection } from "discord.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import http from "http";

/* ===============================
   CONFIG
================================ */
const config = JSON.parse(
  fs.readFileSync("./src/config/config.json", "utf-8")
);

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
    await interaction.reply({
      content: "⚠️ Command error.",
      ephemeral: true
    });
  }
});

/* ===============================
   FAKE WEB SERVER (KEEP-ALIVE)
================================ */
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    name: "Olympus Core",
    status: "online",
    uptime: process.uptime(),
    path: req.url,
    time: new Date().toISOString()
  }, null, 2));
}).listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

/* ===============================
   READY EVENT
================================ */
client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  await mongoose.connect(config.mongoUri);
  console.log("🍃 MongoDB connected");
});

/* ===============================
   LOGIN
================================ */
client.login(process.env.token);

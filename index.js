
import { Client, GatewayIntentBits, Collection } from "discord.js";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

const config = JSON.parse(
  fs.readFileSync("./config.json", "utf-8")
);

const client = new Client({
 intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.MessageContent
 ]
});

client.commands = new Collection();

const commandsPath = path.join(process.cwd(), "src/commands");
for (const folder of fs.readdirSync(commandsPath)) {
 const folderPath = path.join(commandsPath, folder);
 for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith(".js"))) {
  const cmd = await import(path.join(folderPath, file));
  client.commands.set(cmd.data.name, cmd);
 }
}

client.on("interactionCreate", async i => {
 if (!i.isChatInputCommand()) return;
 const cmd = client.commands.get(i.commandName);
 if (cmd) await cmd.execute(i);
});

client.once("ready", async () => {
 console.log(`Logged in as ${client.user.tag}`);
 await mongoose.connect(config.mongoUri);
 console.log("Mongo connected");
});

client.login(config.token);

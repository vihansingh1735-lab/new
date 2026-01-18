
import { SlashCommandBuilder } from "discord.js";
export const data = new SlashCommandBuilder().setName("ping").setDescription("Ping");
export async function execute(i){ await i.reply("Pong"); }

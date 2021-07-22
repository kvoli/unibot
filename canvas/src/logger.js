import winston from "winston";
import DiscordTransport from "@c0b41/winston-discord-transport";

import { DISCORD_LOG_WEBHOOK } from "./config.js";

var discordTransport = new DiscordTransport({
  webhook: `${DISCORD_LOG_WEBHOOK}`,
  defaultMeta: { service: "unibot" },
  level: "warn",
});

var stderr = new winston.transports.Console();

export const logger = winston.createLogger({
  transports: [discordTransport, new winston.transports.Console(), stderr],
});

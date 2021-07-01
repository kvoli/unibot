'use strict'

const Discord = require('discord.js')

const {
  readyHandler,
  messageReactionAddHandler,
} = require('./src/discord/handlers')

const client = new Discord.Client()

client.on('ready', readyHandler)

client.on('messageReactionAdd', messageReactionAddHandler)

client.login(DISCORD_TOKEN)

module.exports.botClient = client

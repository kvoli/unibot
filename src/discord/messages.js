const Discord = require('discord.js')
const TurndownService = require('turndown')

module.exports.StarterMessage = new Discord.MessageEmbed()
  .setTitle('README')
  .setColor('0xff0000')
  .setDescription(
    'In order to access the channels, you must authenticate your account against your student email.\n\n1. react to this message\n\n2. Respond to bot request for your unimelb username with user=username e.g. user=bot\n\n3. Check your email and respond to the bot with the code you received.\n\n4. Success (or something went wrong), you should now see the relevant channels.'
  )

module.exports.DiscussionMessage = (message) =>
  new Discord.MessageEmbed()
    .setAuthor(
      message.author.display_name,
      message.author.avatar_image_url,
      message.author.html_url
    )
    .setTitle(`re: ${message.topicTitle}`)
    .setURL(message.url)
    .setTimestamp(message.created_at)
    .setColor('#27408b')
    .setDescription(turndownService.turndown(message.message))

module.exports.AnnouncementMessage = (message) =>
  new Discord.MessageEmbed()
    .setAuthor(
      message.author.display_name,
      message.author.avatar_image_url,
      message.author.html_url
    )
    .setTitle(message.title)
    .setURL(message.html_url)
    .setTimestamp(message.posted_at)
    .setColor('#27408b')
    .setDescription(turndownService.turndown(message.message))

module.exports.ModuleMessage = (message) =>
  new Discord.MessageEmbed()
    .setAuthor(
      'Canvas',
      'https://cpb-ap-se2.wpmucdn.com/blogs.unimelb.edu.au/dist/6/275/files/2017/09/04_Logo_Vertical-Housed-1abdv7t.jpg'
    )
    .setColor('#08c96b')
    .setURL(
      message.type == 'ExternalUrl' ? message.external_url : message.html_url
    )
    .setTitle(`New ${message.type}`)
    .setDescription(message.title)

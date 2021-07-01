'use strict'

// Import the discord.js module
require('dotenv').config()
const Discord = require('discord.js')
const { noop } = require('lodash')
const nodemailer = require('nodemailer')
const _ = require('lodash')
const TurndownService = require('turndown')

const redis = require('./redis')
const client = new Discord.Client()

const turndownService = new TurndownService()

const DISCORD_TOKEN = process.env.DISCORD_TOKEN.toString()
const MAIL_ADDRESS = process.env.MAIL_ADDRESS.toString()
const MAIL_PW = process.env.MAIL_PW.toString()
const SERVER_ID = process.env.SERVER_ID.toString()
const MAX_RETRIES = 15

const COURSE_ID = 105430

var registered = new Set()
var inProgress = new Map()
var tmpMapping = new Map()
var mapping = new Map()

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: MAIL_ADDRESS,
    pass: MAIL_PW,
  },
})

let getMailOptions = (username, code) => ({
  from: MAIL_ADDRESS,
  to: username + '@student.unimelb.edu.au',
  subject: 'Dist. Computing Discord Server',
  text: code,
})

let genCode = () => 'dcmp@' + Math.trunc(Math.random() * 1e20).toString(16)

let mapCourseIdToRole = (courseId) => {
  switch (courseId) {
    case COURSE_ID:
      return 'comp90015'
    default:
      return noop()
  }
}

let getRoles = (username) => {
  var roles = []

  redis.publisher.smembers(username, (err, reply) => {
    if (!err) roles = reply.map((role) => mapCourseIdToRole(role))
  })
  return roles
}

let sendMail = (username, user) => {
  console.log('attempting to send email to ' + username)
  if (registered.has(user)) return
  const code = genCode()
  tmpMapping.set(user, username)

  transporter
    .sendMail(getMailOptions(username, code))
    .then(console.log('sent email to ' + username), inProgress.set(user, code))
}

let getRole = (roleName) =>
  client.guilds
    .fetch(SERVER_ID)
    .then((guild) => guild.roles.cache.find((role) => role.name === roleName))
    .catch(console.error)

let validateCode = (user, inputCode) =>
  inProgress.get(user).toString() === inputCode

let addRole = (user, role) =>
  client.guilds
    .fetch(SERVER_ID)
    .then((guild) => guild.member(user).roles.add(role))

const StarterMessage = new Discord.MessageEmbed()
  .setTitle('README')
  .setColor('0xff0000')
  .setDescription(
    'In order to access the channels, you must authenticate your account against your student email.\n\n1. react to this message\n\n2. Respond to bot request for your unimelb username with user=username e.g. user=bot\n\n3. Check your email and respond to the bot with the code you received.\n\n4. Success (or something went wrong), you should now see the relevant channels.'
  )

client.on('ready', () => {
  client.guilds.fetch(SERVER_ID, false, true).then((server) =>
    server.systemChannel.messages
      .fetchPinned()
      .then((pinned) => {
        if (pinned.size < 1) {
          server.systemChannel.send(StarterMessage).then((msg) => msg.pin())
        } else {
          console.log('existing message, skipping')
        }
      })
      .catch(console.error)
  )
})

client.on('messageReactionAdd', (messageReaction, user) => {
  // if the reaction was not on one of our messages, ignore
  if (!messageReaction.message.author.equals(client.user)) {
    return
  }

  // user already registered, ignore
  if (registered.has(user)) {
    console.log(
      'user: ' + user.username + ', has already registered - ignore react.'
    )
    return
  }

  // already have in progress request
  if (inProgress.has(user)) {
    console.log(
      'user: ' + user.username + ', is already in progress - ignore react.'
    )
    user.send('Hi, you already have an in progress auth request.')
    return
  }

  user.send(
    'Please enter your unimelb username `user=yourusername` e.g. user=bot'
  )

  const filter = (m) => m.content.startsWith('user=')
  user
    .createDM()
    .then((channel) =>
      channel.awaitMessages(filter, {
        max: 1,
        time: 60000,
        errors: ['time'],
      })
    )
    .then((collected) => sendMail(collected.last().toString().slice(5), user))
    .then((_) => {
      user.send(
        'Sent verification email, please check student inbox + spam and paste the code below. You have 5 minutes :D'
      )
      user
        .createDM()
        .then((channel) =>
          channel.awaitMessages((m) => m.content.startsWith('dcmp@'), {
            max: 1,
            time: 5 * 60000,
            errors: ['time'],
          })
        )
        .then((col) => addCodeBlockedRole(col.last(), 'student'))
        .catch(console.error)
    })
    .catch((err) =>
      user.send(
        'Sorry, you took too long to respond. Try re-reacting to the emoji.' +
          err
      )
    )
})

let addCodeBlockedRole = (message, roleName) => {
  // ignore message from guilds
  if (message.guild) {
    console.log('ignoring message from guild: ' + message.content)
    return
  }

  // not inprogress for that user, can't help
  if (!inProgress.has(message.author)) {
    console.log(
      'ignoring message from non-in progress user: ' + message.content
    )
    return
  }

  console.log('recv msg, from in-progress, non-guild channel' + message.content)

  if (!validateCode(message.author, message.content)) {
    message.reply('invalid code, please try again').catch(console.error)
    return
  }

  getRole(roleName)
    .then((role) =>
      addRole(message.author, role)
        .then((_) => {
          registered.add(message.author)
          registered.add(message.author)
          message.author.send('success, check back to the server.')
          mapping.set(message.author, tmpMapping.get(message.author))
          updateSubjectRoles(message.author)
        })
        .catch((err) => {
          registered.delete(message.author)
          console.error('error updating role ' + roleName + ', err: ' + err)
          message.author.send('error updating role :/, retry later')
        })
    )
    .catch((err) => {
      registered.delete(message.author)
      console.error('error retrieving role ' + roleName + ', err: ' + err)
      message.author.send('error updating role :/, retry later')
    })

  mapping.set(message.author, tmpMapping.get(message.author))

  getRoles(message.console)

  tmpMapping.delete(message.author)
  inProgress.delete(message.author)
}

let updateSubjectRoles = (user) =>
  getRoles(mapping.get(user)).map((roleName) =>
    getRole(roleName).then((role) => addRole(user, role))
  )

let unwrapChannel = (chan) => chan.split(':')

redis.subscriber.subscribe(redis.DISCUSSIONS_CHANNEL('comp90015'))
redis.subscriber.subscribe(redis.ANNOUNCEMENTS_CHANNEL('comp90015'))
redis.subscriber.subscribe(redis.MODULES_CHANNEL('comp90015'))

redis.subscriber.on('message', (channel, message) => {
  const [course, chan] = unwrapChannel(channel)

  const msg = JSON.parse(message)
  const crs = _.toUpper(course)

  console.log('recv msg course:chan =', chan, course)
  switch (chan) {
    case 'DISCUSSIONS_CHANNEL': {
      publishDiscussion(crs, msg)
      break
    }
    case 'MODULES_CHANNEL': {
      publishModule(crs, msg)
      break
    }
    case 'ANNOUNCEMENTS_CHANNEL': {
      publishAnnouncement(crs, msg)
      break
    }
  }
})

let publishAnnouncement = (course, message) => {
  console.log('processing announcement', course)
  const msg = new Discord.MessageEmbed()
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
  getCourseChannel(course, 'announcements')
    .then((chan) => {
      console.log(msg)
      chan.send(msg)
    })
    .catch(console.error)
}

let publishDiscussion = (course, message) => {
  console.log('processing discussion', message)
  const msg = new Discord.MessageEmbed()
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
  getCourseChannel(course, 'updates')
    .then((chan) => {
      console.log(msg)
      chan.send(msg)
    })
    .catch(console.error)
}

let publishModule = (course, message) => {
  if (!message.published) return
  var msg = new Discord.MessageEmbed()
    .setAuthor(
      'Canvas',
      'https://cpb-ap-se2.wpmucdn.com/blogs.unimelb.edu.au/dist/6/275/files/2017/09/04_Logo_Vertical-Housed-1abdv7t.jpg'
    )
    .setColor('#08c96b')
    .setURL(message.html_url)
  switch (message.type) {
    case 'Page': {
      msg.setTitle('Page posted').setDescription(message.title)
      break
    }
    case 'File': {
      msg.setTitle('File uploaded').setDescription(message.title)
      break
    }
    case 'ExternalUrl': {
      msg
        .setTitle('Link Posted: ')
        .setURL(message.external_url)
        .setDescription(message.title)
      break
    }
    case 'Assignment': {
      msg.setTitle('Assignment Posted').setDescription(message.title)
      break
    }
    default:
      break
  }
  getCourseChannel(course, 'updates')
    .then((chan) => {
      console.log(msg)
      chan.send(msg)
    })
    .catch(console.error)
}

let getCourseChannel = async (course, channel) => {
  console.log('FINDING course: ' + course + ' channel' + channel)
  const guild = await client.guilds.fetch(SERVER_ID)
  const ret = guild.channels.cache.find((value) => {
    return value.name == channel && value.parent && value.parent.name == course
  })
  return ret
}

client.login(DISCORD_TOKEN)

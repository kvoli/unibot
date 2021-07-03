const { noop, toUpper } = require('lodash')
const { sendMail } = require('../util/mail')
const { shouldAttemptAuth, startRego } = require('./disco')
const {
  publishAnnouncement,
  publishModule,
  publishDiscussion,
} = require('./pub')

const readyHandler = (client) => {
  client.guilds.fetch(SERVER_ID, false, true).then((server) =>
    server.systemChannel.messages
      .fetchPinned()
      .then((pinned) => {
        pinned.size < 1
          ? server.systemChannel.send(StarterMessage).then((msg) => msg.pin())
          : noop()
      })
      .catch(console.error)
  )
}

const messageReactionAddHandler = (client, messageReaction, user) => {
  if (!shouldAttemptAuth(client, messageReaction, user)) return

  user.send(
    'Please enter your unimelb username `user=yourusername` e.g. user=bot'
  )

  user
    .createDM()
    .then((channel) =>
      channel.awaitMessages((m) => m.content.startsWith('user='), {
        max: 1,
        time: 60000,
        errors: ['time'],
      })
    )
    .then((collected) => {
      const username = collected.last().toString().slice(5)
      const code = startRego(user, username)
      return sendMail(username, code)
    })
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
}

const redisChannelHandler = (channel, message) => {
  const [course, chan] = channel.split(':')
  const msg = JSON.parse(message)
  const crs = toUpper(course)

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
}

module.exports = {
  readyHandler,
  messageReactionAddHandler,
  redisChannelHandler,
}

const { noop, toUpper } = require('lodash')
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

module.exports.readyHandler = readyHandler
module.exports.messageReactionAddHandler = messageReactionAddHandler
module.exports.redisChannelHandler = redisChannelHandler

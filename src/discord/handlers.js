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

let getRoles = (username) => {
  var roles = []

  redis.publisher.smembers(username, (err, reply) => {
    if (!err) roles = reply.map((role) => mapCourseIdToRole(role))
  })
  return roles
}

let updateSubjectRoles = (user) =>
  getRoles(mapping.get(user)).map((roleName) =>
    getRole(roleName).then((role) => addRole(user, role))
  )

let getRoleByName = (roleName) =>
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

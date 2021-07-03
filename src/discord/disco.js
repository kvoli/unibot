const { publisher } = require('pub')
const { botClient } = require('../../bot')
const { SERVER_ID, COURSE_ID } = require('../../config')

const getCourseChannel = async (course, channel) => {
  const client = botClient
  const guild = await client.guilds.fetch(SERVER_ID)
  return guild.channels.cache.find((value) => {
    return value.name == channel && value.parent && value.parent.name == course
  })
}

const addRole = (client, user, role) =>
  client.guilds
    .fetch(SERVER_ID)
    .then((guild) => guild.member(user).roles.add(role))

const getRoleByName = (client, roleName) =>
  client.guilds
    .fetch(SERVER_ID)
    .then((guild) => guild.roles.cache.find((role) => role.name === roleName))
    .catch(console.error)

const updateSubjectRoles = (user, username) =>
  getRoles(username).map((roleName) =>
    getRole(roleName).then((role) => addRole(user, role))
  )

const getRoles = (username) => {
  var roles = []
  publisher.smembers(username, (err, reply) => {
    roles = err ? [] : reply.map((role) => COURSE_ID[role])
  })
  return roles
}

const startRego = (user, username) => {
  const code = genCode()
  const progObj = { code: code, unimelb: username }
  publisher.set(`inprog:${user.id}`, JSON.stringify(progObj))
  publisher.expire(`inprog:${user.id}`, 300)
  return code
}

const getRego = (user) => {
  const reg = undefined
  publisher.get(`inprog:${user.id}`, (err, val) => {
    if (!err && val) reg = JSON.parse(val)
  })
  return reg
}

const setUser = (user, username) =>
  publisher.hmset('registered', user.id, username)

const getUser = (user) => {
  const ret = undefined
  publisher.hget('registered', user.id, (err, val) => {
    if (!err && val) ret = val
  })
  return ret
}

const genCode = () =>
  CODE_PREFIX + Math.trunc(Math.random() * 1e16).toString(16)

const shouldAttemptAuth = (client, messageReaction, user) => {
  // if the reaction was not on one of our messages, ignore
  if (!messageReaction.message.author.equals(client.user)) {
    return false
  }

  // user already registered, ignore
  if (getUser(user)) {
    console.log(
      'user: ' + user.username + ', has already registered - ignore react.'
    )
    return false
  }

  // already have in progress request
  if (getRego(user)) {
    console.log(
      'user: ' + user.username + ', is already in progress - ignore react.'
    )
    user.send('Hi, you already have an in progress auth request.')
    return false
  }

  return true
}

const addCodeBlockedRole = (message, roleName) => {
  if (message.guild) {
    console.log('ignoring message from guild: ' + message.content)
    return
  }

  const rego = getRego(message.author)
  if (!rego) return

  console.log('recv msg, from in-progress, non-guild channel' + message.content)

  if (rego.code != message.content) {
    message.reply('invalid code, please try again').catch(console.error)
    return
  }

  getRole(roleName)
    .then((role) =>
      addRole(message.author, role)
        .then((_) => {
          setUser(message.author, rego.username)
          message.author.send('success, check back to the server.')
          updateSubjectRoles(rego.username)
        })
        .catch((err) => {
          console.error('error updating role ' + roleName + ', err: ' + err)
          message.author.send('error updating role :/, retry later')
        })
    )
    .catch((err) => {
      console.error('error retrieving role ' + roleName + ', err: ' + err)
      message.author.send('error updating role :/, retry later')
    })
}

module.exports = {
  getRoles,
  getRoleByName,
  getRole,
  addCodeBlockedRole,
  shouldAttemptAuth,
  getCourseChannel,
  startRego,
}

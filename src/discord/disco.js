const { publisher } = require('pub')

const getCourseChannel = async (client, course, channel) => {
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

const updateSubjectRoles = (user) =>
  getRoles(mapping.get(user)).map((roleName) =>
    getRole(roleName).then((role) => addRole(user, role))
  )

const validateCode = (user, inputCode) =>
  inProgress.get(user).toString() === inputCode

const getRoles = (publisher, username) => {
  var roles = []

  publisher.smembers(username, (err, reply) => {
    if (!err) roles = reply.map((role) => mapCourseIdToRole(role))
  })
  return roles
}

const addCodeBlockedRole = (message, roleName) => {
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

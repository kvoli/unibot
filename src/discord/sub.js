'use strict'
const {
  subscriber,
  DISCUSSIONS_CHANNEL,
  MODULES_CHANNEL,
  ANNOUNCEMENTS_CHANNEL,
} = require('../db/redis')

subscriber.subscribe(DISCUSSIONS_CHANNEL('comp90015'))
subscriber.subscribe(ANNOUNCEMENTS_CHANNEL('comp90015'))
subscriber.subscribe(MODULES_CHANNEL('comp90015'))

subscriber.on('message', redisChannelHandler)

module.exports.subbed = subscriber

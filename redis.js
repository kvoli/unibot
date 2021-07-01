'use strict'

const redis = require('redis')
const subscriber = redis.createClient()
const publisher = redis.createClient()

const DISCUSSIONS_CHANNEL = (courseId) => `${courseId}:DISCUSSIONS_CHANNEL`
const MODULES_CHANNEL = (courseId) => `${courseId}:MODULES_CHANNEL`
const ANNOUNCEMENTS_CHANNEL = (courseId) => `${courseId}:ANNOUNCEMENTS_CHANNEL`

subscriber.on('error', function (error) {
  console.error(error)
})

publisher.on('error', function (error) {
  console.error(error)
})

module.exports.subscriber = subscriber
module.exports.publisher = publisher
module.exports.DISCUSSIONS_CHANNEL = DISCUSSIONS_CHANNEL
module.exports.MODULES_CHANNEL = MODULES_CHANNEL
module.exports.ANNOUNCEMENTS_CHANNEL = ANNOUNCEMENTS_CHANNEL

'use strict'

const { noop } = require('lodash')
const {
  getEnrollmentsInCourse,
  getModules,
  getOptions,
  getDiscussionTopics,
  getDiscussionTopic,
  getFullDiscussion,
} = require('node-canvas-api')
const redis = require('./redis')

const updateState = async (courseId) => {
  const students = await getEnrollmentsInCourse(
    courseId,
    getOptions.users.enrollmentType.student
  )
  const modules = await getModules(courseId, getOptions.users.include.items)
  const discussions = await getDiscussionDetails(courseId)
  const announcements = await getDiscussionTopics(
    courseId,
    getOptions.discussion.only_announcements
  )
  return { students, modules, discussions, announcements }
}

const getDiscussionDetails = async (courseId) => {
  const discussions = await getDiscussionTopics(courseId)

  const ret = discussions.map(async (topic) => {
    const details = await getFullDiscussion(courseId, topic.id)
    return { id: topic.id, topic: topic, details: details }
  })

  return await Promise.all(ret)
}

const run = async (courseId) => {
  var { students, modules, discussions, announcements } = await updateState(
    courseId
  )
  students
    ? students.map((student) =>
        redis.publisher.sadd(`${student.user.login_id}`, `${courseId}`)
      )
    : noop()
  modules
    ? modules.map((module) =>
        module.items.map((moduleItem) => {
          redis.publisher.sismember(
            `${courseId}`,
            moduleItem.id.toString(),
            (err, reply) => {
              if (!err && reply == 0) {
                redis.publisher.hset(
                  `${courseId}`,
                  moduleItem.id.toString(),
                  JSON.stringify(moduleItem)
                )
                redis.publisher.publish(
                  redis.MODULES_CHANNEL(courseId),
                  JSON.stringify(moduleItem)
                )
              }
            }
          )
        })
      )
    : noop()
  discussions
    ? discussions.map((disc) =>
        redis.publisher.sismember(
          `${courseId}`,
          disc.id.toString(),
          (err, reply) => {
            if (!err && reply == 0) {
              redis.publisher.hset(
                `${courseId}`,
                disc.id.toString(),
                JSON.stringify(disc)
              )
              redis.publisher.publish(
                redis.DISCUSSIONS_CHANNEL(courseId),
                JSON.stringify(disc)
              )
            }
          }
        )
      )
    : noop()

  console.log(announcements)

  announcements
    ? announcements.map((ann) => {
        redis.publisher.sismember(
          `${courseId}`,
          ann.id.toString(),
          (err, reply) => {
            if (!err && reply == 0) {
              redis.publisher.hset(
                `${courseId}`,
                ann.id.toString(),
                JSON.stringify(ann)
              )
              redis.publisher.publish(
                redis.ANNOUNCEMENTS_CHANNEL(courseId),
                JSON.stringify(ann)
              )
            }
          }
        )
      })
    : noop()
}

const courseMap = { 105430: 'comp90015' }

Object.keys(courseMap).forEach((courseId) => {
  setInterval(run, 60 * 1000, courseId)
})

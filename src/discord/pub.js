const publishAnnouncement = (course, message) => {
  getCourseChannel(course, 'announcements')
    .then((chan) => {
      chan.send(AnnouncementMessage(message))
    })
    .catch(console.error)
}

const publishDiscussion = (course, message) => {
  getCourseChannel(course, 'updates')
    .then((chan) => {
      chan.send(DiscussionMessage(message))
    })
    .catch(console.error)
}

const publishModule = (course, message) => {
  if (!message.published) return
  getCourseChannel(course, 'updates')
    .then((chan) => {
      chan.send(ModuleMessage(message))
    })
    .catch(console.error)
}

module.exports.publishModule = publishModule
module.exports.publishDiscussion = publishDiscussion
module.exports.publishAnnouncement = publishAnnouncement

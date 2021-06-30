'use strict';

require('dotenv').config();
const canvas = require('node-canvas-api');
const redis = require('./redis');

const run = (courseId) => {
    canvas.tapped(courseId);
    canvas.getStudenList(courseId)
        .then(res => res.map(student => redis.publisher.sadd(`${courseId}:enrolled`, student.user.login_id.toString())))
        .catch(console.error);

    canvas.getSections
        .then(res => res.map(module =>
            module.items.map(moduleItem => {
                redis.publisher.hexists(`modules`, `${moduleItem.id}`, (err, reply) => {
                    if (err) console.error(err);
                    else if (reply == 0) {
                        console.log("found new moduleItem " + moduleItem.toString());
                        redis.publisher.hset("modules", moduleItem.id, moduleItem.toString());
                        redis.publisher.publish(`${courseId}:${redis.MODULES_CHANNEL}`, moduleItem.toString());
                    }
                })
            }
            )
        )
        )
        .catch(console.error);


    canvas.getAnnouncements(courseId, "2021-01-01")
        .then(res => res.map(announcement => {
            redis.publisher.hexists(`announcements`, `${announcement.id}`, (err, reply) => {
                if (err) console.error(err);
                else if (reply == 0) {
                    console.log("found new announcement topic " + announcement.toString())
                    redis.publisher.hset("announcements", announcement.id, announcement.toString());
                    redis.publisher.publish(`${courseId}:${redis.ANNOUNCEMENTS_CHANNEL}`, announcement.toString());
                }
            })
        }
        )
        )
        .catch(console.error);

    canvas.getDiscussionTopics(courseId)
        .then(res => res.map(discussion => {
            redis.publisher.hexists(`discussions`, `${discussion.id}`, (err, reply) => {
                if (err) console.error(err);
                else if (reply == 0) {
                    console.log("found new discussion topic " + discussion.toString())
                    redis.publisher.hset(`discussions`, `${discussion.id}`, discussion.toString());
                    redis.publisher.publish(`${courseId}:${redis.DISCUSSIONS_CHANNEL}`, discussion.toString());
                }
            })
        }
        )
        )
        .catch(console.error);
}

run("105430");


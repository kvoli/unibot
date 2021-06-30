require('dotenv').config();
const axios = require('axios');

const CANVAS_TOKEN = process.env.CANVAS_TOKEN;
const CANVAS_URL = 'canvas.lms.unimelb.edu.au'

const ax = axios.default.create({
    baseURL: 'https://' + CANVAS_URL + '/api/v1',
    headers: {'Authorization': `Bearer ${CANVAS_TOKEN}`},
});

// Track Enrolled Student List
const getStudenList = (courseId) =>
    ax.request({
        url: `/courses/${courseId}/enrollments`,
        method: 'get',
        params: {
            type: ['StudentEnrollment']
        }
    })

// Track Announcements 
const getAnnouncements = (courseId, from) =>
    ax.request({
        url: `/announcements`,
        method: 'get',
        params: {
            'context_codes[]': `course_${courseId}`,
            start_date: from.toString(),
        }
    })

// Track Discussion Forum
const getDiscussionTopics = (courseId) =>
    ax.request({
        url: `/courses/${courseId}/discussion_topics`,
        method: 'get',
        params: {
            'order_by': 'recent_activity',
        }
    })

const getDiscussionThread = (courseId, threadID) =>
    ax.request({
        url: `/courses/${courseId}/discussion_topics/${topicId}/entries`,
        method: 'get',
        params: {
            'order_by': 'recent_activity',
        }
    })

// Track Whitelisted Module Changes
const getModules = (courseId) =>
    ax.request({
        url: `/courses/${courseId}/modules`,
        method: 'get',
        params: {
            'include[]': 'items',
        }
    })

const getModuleItems = (courseId, moduleId) =>
    ax.request({
        url: `/courses/${courseId}/modules/${moduleId}/items`,
        method: 'get',
    })


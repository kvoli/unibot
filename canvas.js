require('dotenv').config();
const _ = require('lodash');
const axios = require('axios');
var parse = require('parse-link-header');


const CANVAS_TOKEN = process.env.CANVAS_TOKEN;
const CANVAS_URL = 'canvas.lms.unimelb.edu.au'
const PAGINATION_LIMIT = "200"

const ax = axios.default.create({
    baseURL: 'https://' + CANVAS_URL + '/api/v1',
    headers: {
        'Authorization': `Bearer ${CANVAS_TOKEN}`,
        'per_page': `${PAGINATION_LIMIT}`,
    },
});

function customizer(objValue, srcValue) {
    if (_.isArray(objValue)) {
        return objValue.concat(srcValue);
    }
}

async function ExecuteRequest(reqOptions, data) {
    var data = data || [];
    await ax.request(reqOptions).then(response => {

        // We merge the returned data with the existing data
        _.concat(data, response.data);

        const links = parse(response.headers.link)

        // We check if there is more paginated data to be obtained
        if (links.next) {
            // If nextPageUrl is not null, we have more data to grab
            return [ExecuteRequest({url: links.next.url, method: reqOptions.method}, data), ...data];
        }
        return data;
    });
}

// Track Enrolled Student List
const getStudenList = (courseId) =>
    ExecuteRequest({
        url: `/courses/${courseId}/enrollments`,
        method: 'get',
        params: {
            type: ['StudentEnrollment']
        }
    });

const tapped = (courseId) => _.tap(getStudenList(courseId), (res) => res.then(t => console.log(t)))


// Track Announcements 
const getAnnouncements = (courseId, from) =>
    ExecuteRequest({
        url: `/announcements`,
        method: 'get',
        params: {
            'context_codes[]': `course_${courseId}`,
            start_date: from,
        }
    });

// Track Discussion Forum
const getDiscussionTopics = (courseId) =>
    ExecuteRequest({
        url: `/courses/${courseId}/discussion_topics`,
        method: 'get',
        params: {
            'order_by': 'recent_activity',
        }
    });

const getDiscussionThread = (courseId, topicId) =>
    ExecuteRequest({
        url: `/courses/${courseId}/discussion_topics/${topicId}/entries`,
        method: 'get',
        params: {
            'order_by': 'recent_activity',
        }
    });

// Track Whitelisted Module Changes
const getModules = (courseId) =>
    ExecuteRequest({
        url: `/courses/${courseId}/modules`,
        method: 'get',
        params: {
            'include[]': 'items',
        }
    });

const getModuleItems = (courseId, moduleId) =>
    ExecuteRequest({
        url: `/courses/${courseId}/modules/${moduleId}/items`,
        method: 'get',
    });

module.exports.tapped = tapped;
module.exports.getStudenList = getStudenList;
module.exports.getAnnouncements = getAnnouncements;
module.exports.getDiscussionTopics = getDiscussionTopics;
module.exports.getDiscussionThread = getDiscussionThread;
module.exports.getModules = getModules;
module.exports.getModuleItems = getModuleItems;


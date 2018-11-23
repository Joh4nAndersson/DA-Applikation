const https = require('https');
const cts = require('../misc/constants');
const ERROR_MSG = cts.error_msg;
const apiKey = cts.api_key;

function listEvents(calendarId, dateFrom, dateTo) {
    return new Promise((resolve, reject) => {
        https.get('https://www.googleapis.com/calendar/v3/calendars/' +
                calendarId +
                '/events?key=' +
                apiKey +
                '&timeMin=' + dateFrom +
                '&timeMax=' + dateTo, (resp) => {
            var data = '';
            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', function () {
                try {
                    var events = JSON.parse(data);
                    resolve(events.items);
                    return;
                } catch (e) {
                    console.log("Error parsing json: ", e);
                    reject(ERROR_MSG);
                }

            });
        }).on('error', function (e) {
            console.log("Error getting data from API: ", e);
            reject(ERROR_MSG);
        });
    });
}


module.exports.listEvents = listEvents; 
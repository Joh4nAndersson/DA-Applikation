const admin = require("firebase-admin");
const events = require("./events");
const findEvent = events.findEvent;
const findEvents = events.findEvents;

const cts = require('./constants');
const ERROR_MSG = cts.error_msg;
const DEFAULT_RESPONSE = cts.default_response;
const empty = cts.is_empty;

function simple_request(conv) {
    var params = conv.parameters;

    var fname = params['first-name'].hasOwnProperty('given-name') ? (params['first-name'])['given-name'] : params['first-name'];
    var lname = params['last-name'].hasOwnProperty('last-name') ? (params['last-name'])['last-name'] : params['last-name'];
    var reqType = params['request-entity'];

    var db = admin.database();
    var key = 'calendars/';
    return new Promise(function (resolve, reject) {
        db.ref(key).orderByChild('name')
                .equalTo(fname.toLowerCase() + " " + lname.toLowerCase())
                .once('value', (snapshot) => {
                    var value = snapshot.val();

                    if (value === null || value === 'null') {
                        resolve("Jag kan tyvärr inte hitta någon information på personen.");
                        return;
                    }
                    var calendarID = value[0].calendarID;

                    findEvent(calendarID, new Date(), fname, reqType)
                            .then((resp) => {
                                resolve(resp);
                            })
                            .catch((error) => {
                                reject(error);
                            });
                });
    });
}
function advanced_request(conv) {
    var params = conv.parameters;
    var fname = params['first-name'].hasOwnProperty('given-name') ? (params['first-name'])['given-name'] : params['first-name'];
    var lname = params['last-name'].hasOwnProperty('last-name') ? (params['last-name'])['last-name'] : params['last-name'];
    var datetime = params['date-time'].hasOwnProperty('date_time') ? (params['date-time'])['date_time'] : params['date-time'];
    var reqType = params['request-entity'];
    var date = params['date'];
    var datePeriod = params['date-period'];

    var db = admin.database();
    var key = 'calendars/';

    return new Promise(function (resolve, reject) {
        db.ref(key).orderByChild('name')
                .equalTo(fname.toLowerCase() + " " + lname.toLowerCase())
                .once('value', (snapshot) => {
                    var value = snapshot.val();
                    if (value === null || value === 'null') {
                        resolve("Jag kan tyvärr inte hitta någon information på personen.");
                        return;
                    }
                    var calendarID = value[0].calendarID;

                    if (empty(datetime) && empty(date) && empty(datePeriod)) {
                        findEvent(calendarID, new Date(), fname, reqType)
                                .then((resp) => {
                                    resolve(resp);
                                })
                                .catch((error) => {
                                    reject(error);
                                });

                    } else if (!empty(datetime)) {
                        if (datetime.hasOwnProperty('startDateTime')) {
                            var startdate = datetime.startDateTime;
                            var enddate = datetime.endDateTime;
                            findEvents(calendarID, startdate, enddate, fname, reqType)
                                    .then((resp) => {
                                        resolve(resp);
                                    })
                                    .catch((error) => {
                                        reject(error);
                                    });
                        } else {
                            findEvent(calendarID, datetime, fname, reqType)
                                    .then((resp) => {
                                        resolve(resp);
                                    })
                                    .catch((error) => {
                                        reject(error);
                                    });
                        }
                    } else if (!empty(date)) {
                        datetime = new Date(date);
                        var startdate = datetime.setHours(0, 0, 0, 0);
                        var enddate = datetime.setHours(23, 59, 59, 999);
                        findEvents(calendarID, startdate, enddate, fname, reqType)
                                .then((resp) => {
                                    resolve(resp);
                                })
                                .catch((error) => {
                                    reject(error);
                                });
                    } else if (!empty(datePeriod)) {
                        var startdate = (new Date(datePeriod.startDate)).setHours(0, 0, 0, 0);
                        var enddate = (new Date(datePeriod.endDate)).setHours(23, 59, 59, 999);
                        findEvents(calendarID, startdate, enddate, fname, reqType)
                                .then((resp) => {
                                    resolve(resp);
                                })
                                .catch((error) => {
                                    reject(error);
                                });
                    } else {
                        resolve(DEFAULT_RESPONSE);
                    }

                }, (error) => {
                    console.log("Database error: ", error);
                    reject(ERROR_MSG);
                });
    });
}

module.exports.simple_request = simple_request;
module.exports.advanced_request = advanced_request;
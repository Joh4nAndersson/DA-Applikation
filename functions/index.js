//Import firebase functions
const functions = require('firebase-functions');
const {dialogflow} = require('actions-on-google');

const https = require('https');
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

const REQUEST_INTENT = 'Request-Intent';
const PERSON_INTENT = 'Person-Intent';
const FF_INTENT = "Followup-Fallback-Intent";
const FW_INTENT = "Followup-Welcome-Intent";
const app = dialogflow();
const DEFAULT_RESPONSE = "Jag förstod inte vad du sa, vem söker du?";
const ERROR_MSG = "Något gick fel och det gick inte att slutföra sökningen.";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://newagent-44155.firebaseio.com"
});

function test() {

    return;
}
test();

app.intent(REQUEST_INTENT, (conv) => {

    return check_parameters(conv).
            then((response) => {
                conv.ask(response);
            })
            .catch((error) => {
                conv.ask(error);
            });
});

app.intent(PERSON_INTENT, (conv) => {

    return search_request(conv).
            then((response) => {
                conv.ask(response);
            })
            .catch((error) => {
                conv.ask(error);
            });
});


app.intent(FF_INTENT, (conv) => {

    return search_request(conv).
            then((response) => {
                conv.ask(response);
            })
            .catch((error) => {
                conv.ask(error);
            });
});


app.intent(FW_INTENT, (conv) => {

    return search_request(conv).
            then((response) => {
                conv.ask(response);
            })
            .catch((error) => {
                conv.ask(error);
            });
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);

function search_request(conv) {
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
function check_parameters(conv) {
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
function empty(str) {
    return str === '';
}

function findEvent(calendarId, datetime, fname, request_type) {

    return  new Promise((resolve, reject) => {
        try {
            datetime = new Date(datetime);
        } catch (error) {
            console.log("Error on findEvent function: ", error);
            reject(ERROR_MSG);
            return;
        }
        var dtMax = datetime;
        dtMax = new Date(dtMax.setSeconds(dtMax.getSeconds() + 1)).toISOString();
        listEvents(calendarId, encodeURIComponent(datetime.toISOString()), encodeURIComponent(dtMax))
                .then((events) => {
                    if (events.length < 1) {
                        if (request_type === "Search") {
                            resolve("Jag kan tyvärr inte hitta " + fname);
                        } else {
                            resolve("Jag kan tyvärr inte hitta någon information om det.");
                        }
                        return;
                    }
                    var location = events[0].location;
                    var summary = events[0].summary;
                    var startdate = events[0].start.dateTime;
                    var enddate = events[0].end.dateTime;
                    if (request_type === "Doing") {
                        resolve(fname + " har enligt sin kalender " + summary + " " + formatDate(startdate, enddate));
                    } else if (request_type === "Search") {
                        resolve(fname + " har just nu " + summary + " i " + location + " " + formatDate(startdate, enddate));
                    } else {
                        resolve(fname + " är i " + location + " " + formatDate(startdate, enddate));
                    }
                })
                .catch((error) => {
                    reject(error);
                });
    });
}

function findEvents(calendarId, startdate, enddate, fname, request_type) {

    return new Promise((resolve, reject) => {
        try {
            startdate = new Date(startdate);
            enddate = new Date(enddate);
        } catch (error) {
            console.log("Error on findEvents function: ", error);
            reject(ERROR_MSG);
            return;
        }
        listEvents(calendarId, encodeURIComponent(startdate.toISOString()), encodeURIComponent(enddate.toISOString()))
                .then((events) => {
                    var sb = "Enligt " + fname + " kalender " + (request_type === 'Doing' ? ' har ' : ' är ') + " hen ";
                    if (events.length < 1) {
                        if (request_type === "Doing") {
                            resolve(fname + ' har inget planerat.');
                        } else {
                            resolve('Jag kan tyvärr inte hitta den informationen i kalendern.');
                        }
                    } else {
                        events.forEach(function (event) {
                            var location = event.location;
                            var summary = event.summary;
                            var startdate = event.start.dateTime;
                            var enddate = event.end.dateTime;

                            if (request_type === "Doing") {
                                sb += summary + " " + formatDate(startdate, enddate) + ", ";
                            } else {
                                sb += " i " + location + " " + formatDate(startdate, enddate) + ", ";
                            }

                        });
                        resolve(sb);
                    }
                })
                .catch((error) => {
                    reject(error);
                });
    });

}

function listEvents(calendarId, dateFrom, dateTo) {
    var apiKey = 'AIzaSyDXSrMo_Y0lV94nFcntnMbsID5wjleFLdg';
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
                    return resolve(events.items);
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

function formatDate(startTimeP, endTimeP) {

    var daysToString = ['', 'första', 'andra', 'tredje', 'fjärde', 'femte', 'sjätte', 'sjunde', 'åttonde', 'nionde', 'tionde', 'elfte', 'tolfte', 'trettonde', 'fjortonde', 'femtonde'
                , 'sextonde', 'sjuttonde', 'artonde', 'nittonde', 'tjugonde', 'tjugoförsta', 'tjugoandra', 'tjugotredje', 'tjugofjärde', 'tjugofemte', 'tjugosjätte', 'tjugosjunde',
        'tjugoåttonnde', 'tjugonionde', 'trettionde', 'trettioförsta'];

    var monthsToString = ['', 'januari', 'februari', 'march', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
    var wdToString = ['', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag'];

    var startTime = new Date(startTimeP);
    var endTime = new Date(endTimeP);
    var todaysDate = new Date();

    var isYearP = startTime.getFullYear() === endTime.getFullYear();
    var isMonthP = startTime.getMonth() === endTime.getMonth();
    var isDayP = startTime.getDate() === endTime.getDate();

    if (isYearP && isMonthP && isDayP) {

        var isYear = startTime.getFullYear() === todaysDate.getFullYear();
        var isMonth = startTime.getMonth() === todaysDate.getMonth();
        var isDay = startTime.getDate() === todaysDate.getDate();

        var options = {hour: 'numeric', minute: 'numeric'};
        var startT = startTime.toLocaleString('sv-SE', options);
        var endT = endTime.toLocaleString('sv-SE', options);

        if (isYear && isMonth && isDay) {
            return "mellan " + startT + " och " + endT;
        } else if (isYear && isMonth) {
            return wdToString[startTime.getDay()] + " den " + daysToString[startTime.getDate()] + " mellan " + startT +
                    " och " + endT;
        } else if (isYear) {
            return "den " + daysToString[startTime.getDate()] + " " + monthsToString[startTime.getMonth()] + " mellan " + startT +
                    " och " + endT;

        } else {
            return "den " + daysToString[startTime.getDate()] + " " + monthsToString[startTime.getMonth()] + " mellan " + startT +
                    " och " + endT;
        }
    } else if (isYearP && isMonthP) {
        return "mellan " + wdToString[startTime.getDay()] + " den " + daysToString[startTime.getDate()] + " " + startT +
                " och " + wdToString[endTime.getDay()] + " den " + daysToString[endTime.getDate()] + " " + endT;
    } else if (isYearP) {
        return "mellan den " + daysToString[startTime.getDate()] + " " + monthsToString[startTime.getMonth()] + " " + startT +
                " och " + daysToString[endTime.getDate()] + " " + monthsToString[endTime.getMonth()] + " " + endT;
    } else {
        return "mellan den " + daysToString[startTime.getDate()] + " " + monthsToString[startTime.getMonth()] + " " + startTime.getFullYear() + " " + startT +
                " och " + daysToString[endTime.getDate()] + +" " + monthsToString[endTime.getMonth()] + " " + endTime.getFullYear() + " " + endT;
    }
}






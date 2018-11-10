//Import firebase functions
const functions = require('firebase-functions');
const {dialogflow} = require('actions-on-google');

const https = require('https');
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

const REQUEST_INTENT = 'Request-Intent';
const PERSON_INTENT = 'Person-Intent';
const app = dialogflow();
const DEFAULT_RESPONSE = "Jag förstod inte vad du sa, vem söker du?";


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
                console.log(response);
                conv.ask(response);
            })
            .catch((error) => {
                conv.ask(error);
            });
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);

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
        db.ref(key)
                .orderByChild('name')
                .equalTo(fname.toLowerCase() + " " + lname.toLowerCase())
                .once('value', (snapshot) => {
                    var value = snapshot.val();
                    if (value === null || value === 'null') {
                        resolve("Jag kan inte hitta någon information på personen.");
                        return;
                    }

                    var calendarID = value[0].calendarID;

                    if (empty(datetime) && empty(date) && empty(datePeriod)) {
                        findEvent(calendarID, new Date(), fname, reqType, (resp) => {
                            resolve(resp);
                        });

                    } else if (!empty(datetime)) {
                        if (datetime.hasOwnProperty('startDateTime')) {
                            var startdate = datetime.startDateTime;
                            var enddate = datetime.endDateTime;
                            findEvents(calendarID, new Date(startdate), new Date(enddate), fname, reqType,
                                    (resp) => {
                                resolve(resp);
                            });
                        } else {
                            findEvent(calendarID, new Date(datetime), fname, reqType, (resp) => {
                                resolve(resp);
                            });
                        }
                    } else if (!empty(date)) {
                        datetime = new Date(date);
                        var startdate = datetime.setHours(0, 0, 0, 0);
                        var enddate = datetime.setHours(23, 59, 59, 999);
                        findEvents(calendarID, new Date(startdate), new Date(enddate), fname, reqType,
                                (resp) => {
                            resolve(resp);
                        });
                    } else if (!empty(datePeriod)) {
                        var startdate = (new Date(datePeriod.startDate)).setHours(0, 0, 0, 0);
                        var enddate = (new Date(datePeriod.endDate)).setHours(23, 59, 59, 999);
                        findEvents(calendarID, new Date(startdate), new Date(enddate), fname, reqType,
                                (resp) => {
                            resolve(resp);
                        });
                    } else {
                        resolve(DEFAULT_RESPONSE);
                    }

                });
    });


}
function empty(str) {
    return str === '';
}

function findEvent(calendarId, datetime, fname, request_type, callback) {
    var dtMax = new Date(datetime);
    dtMax = new Date(dtMax.setSeconds(dtMax.getSeconds() + 1)).toISOString();
    listEvents(calendarId, encodeURIComponent(datetime.toISOString()), encodeURIComponent(dtMax),
            function (events) {
                if (events.length < 1) {
                    return callback("Jag kan tyvärr inte hitta någon information om det.");
                }
                var location = events[0].location;
                var summary = events[0].summary;
                var startdate = events[0].start.dateTime;
                var enddate = events[0].end.dateTime;
                if (request_type === "Doing") {
                    return callback(fname + " har enligt sin kalender " + summary + " " + formatDate(startdate, enddate));
                } else {
                    return callback(fname + " är i " + location + " " + formatDate(startdate, enddate));
                }

            }
    );
}

function findEvents(calendarId, startdate, enddate, fname, request_type, callback) {

    listEvents(calendarId, encodeURIComponent(startdate.toISOString()), encodeURIComponent(enddate.toISOString()),
            function (events) {
                var sb = "Enligt " + fname + " kalender " + (request_type === 'Doing' ? ' har ' : ' är ') + " hen ";
                if (events.length < 1) {
                    if (request_type === "Doing") {
                        return callback(fname + ' har inget planerat.');
                    } else {
                        return callback('Jag kan tyvärr inte hitta den informationen i kalendern.');
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
                            sb += " i " + location  + formatDate(startdate, enddate) + ", ";

                        }

                    });
                    callback(sb);
                }
            }
    );
}

function listEvents(calendarId, dateFrom, dateTo, callback) {
    var apiKey = 'AIzaSyDXSrMo_Y0lV94nFcntnMbsID5wjleFLdg';

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
                return callback(events.items);
            } catch (e) {
                console.log(e);
            }

        });
    }).on('error', function (e) {
        console.log("Got an error: ", e);
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






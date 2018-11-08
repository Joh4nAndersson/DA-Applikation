//Import firebase functions
const functions = require('firebase-functions');
const {dialogflow} = require('actions-on-google');

const https = require('https');

const REQUEST_INTENT = 'Request-Intent';
const PERSON_INTENT = 'Person-Intent';
const app = dialogflow();
const DEFAULT_RESPONSE = "Jag förstod inte vad du sa, vem söker du?";
var calendarId = 's7vqto4b7ev87o2o3bhhlnn94o@group.calendar.google.com';


function test() {
 
}
test();

app.intent(REQUEST_INTENT, (conv) => {

    /*  var result = listEvents(calendarId);
     console.log(result);*/
    return check_parameters(conv, (response)=>{

        conv.ask(response);
        console.log(response);
    });
});


function check_parameters(conv, callback) {
    var params = conv.parameters;
    var fname = params['first-name'].hasOwnProperty('given-name') ? (params['first-name'])['given-name'] : params['first-name'];
    var lname =  params['last-name'].hasOwnProperty('last-name') ? (params['last-name'])['last-name'] : params['last-name'];
    var datetime = params['date-time'].hasOwnProperty('date_time') ? (params['date-time'])['date_time'] : params['date-time'];
    var reqType = params['request-entity'];
    var date = params['date'];
    var datePeriod = params['date-period'];
    var response = '';

    if (fname === '' && lname === '') {
        return DEFAULT_RESPONSE;
    }

    if (empty(datetime) && empty(date) && empty(datePeriod)) {
        response = findEvent(new Date(), fname, reqType);

    } else if (!empty(datetime)) {
        if (datetime.hasOwnProperty('startDateTime')) {
            var startdate = datetime.startDateTime;
            var enddate = datetime.endDateTime;
            response = findEvents(new Date(startdate), new Date(enddate), fname, reqType);
        } else {
            findEvent(new Date(datetime), fname, reqType, (resp)=>{
                 response =  callback(resp);
            });
        }
    } else if (!empty(date)) {
        datetime = new Date(date);
        var startdate = datetime.setHours(0, 0, 0, 0);
        var enddate = datetime.setHours(23, 59, 59, 999);
        response = findEvents(new Date(startdate), new Date(enddate), fname, reqType);
    } else if (!empty(datePeriod)) {
        var startdate = datePeriod.startDate.setHours(0, 0, 0, 0);
        var enddate = datePeriod.endDate.setHours(23, 59, 59, 999);
        response = findEvents(new Date(startdate), new Date(enddate), fname, reqType);
    } else {
        response = DEFAULT_RESPONSE;
    }
    return response;
}
function empty(str) {
    return str === '';
}

function findEvent(datetime, fname, request_type, callback) {
    var dtMax = new Date(datetime.setSeconds(datetime.getSeconds() + 1)).toISOString();
    listEvents(calendarId, encodeURIComponent(datetime.toISOString()), encodeURIComponent(dtMax),
            function (events) {
                if (events.length < 1) {
                    console.log("Here");
                    return callback("Jag kan inte hitta någon information om det.");
                }
                console.log("Here 2");
                var location = events[0].location;
                var summary = events[0].summary;
                var startdate = events[0].start.dateTime;
                var enddate = events[0].end.dateTime;
                if (request_type === "Doing") {
                    return fname + " har enligt sin kalender " + summary + " mellan " + startdate + " och " + enddate;
                } else {
                    return fname + " är i " + location + " mellan " + startdate + " och " + enddate;
                }

            }
    );
}

function findEvents(startdate, enddate, fname, request_type) {

    listEvents(calendarId, encodeURIComponent(startdate.toISOString()), encodeURIComponent(enddate.toISOString()),
            function (events) {
                var sb = fname + request_type === 'Doing' ? ' har ': ' är ';
                if (events.length < 1) {
                    return sb + ' inget planerat.';
                }
                events.forEach(function (event) {

                    var location = event.location;
                    var summary = event.summary;
                    var startdate = event.start.dateTime;
                    var enddate = event.end.dateTime;
                    if (request_type === "Doing") {
                        sb += summary + " mellan " + startdate + " och " + enddate + ", ";
                    } else {
                        sb += location + " mellan " + startdate + " och " + enddate+", ";
               
                    }

                });
                return sb += "i sin kalender.";

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
                console.log("Error parsing json");
            }

        });
    }).on('error', function (e) {
        console.log("Got an error: ", e);
    });

}
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);

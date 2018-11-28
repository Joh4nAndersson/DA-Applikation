const admin = require("firebase-admin");
const events = require("./events");
const findEvent = events.findEvent;
const findEvents = events.findEvents;

const cts = require('../misc/constants');
const ERROR_MSG = cts.error_msg;
const DEFAULT_RESPONSE = cts.default_response;
const empty = cts.is_empty;

const serviceAccount = require("../misc/serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://newagent-44155.firebaseio.com"
});

var db = admin.database();
var key = 'calendars/';

function simple_request(conv) {
    var params = conv.parameters;

    var fname = params['first-name']
            .hasOwnProperty('given-name')
            ? (params['first-name'])['given-name'] : params['first-name'];
    var lname = params['last-name']
            .hasOwnProperty('last-name')
            ? (params['last-name'])['last-name'] : params['last-name'];

    var reqType = params['request-entity'];

    return new Promise(function (resolve, reject) {
        var search = db.ref(key)
                .orderByChild('name')
                .equalTo(fname.toLowerCase() + " " + lname.toLowerCase());

        search.once('value', (snapshot) => {
            var value = snapshot.val();

            if (value === null || value === 'null') {
                resolve("Jag kan tyvärr inte hitta någon information på personen.");
                return;
            }
            var calendarID = value[0].calendarID;
            findEvents(calendarID, new Date(), null, fname, reqType)
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
    var fname = params['first-name'].hasOwnProperty('given-name')
            ? (params['first-name'])['given-name'] : params['first-name'];
    var lname = params['last-name'].hasOwnProperty('last-name')
            ? (params['last-name'])['last-name'] : params['last-name'];
    var datetime = params['date-time'].hasOwnProperty('date_time')
            ? (params['date-time'])['date_time'] : params['date-time'];
    var reqType = params['request-entity'];
    var date = params['date'];
    var datePeriod = params['date-period'];

    return new Promise(function (resolve, reject) {
        var search = db.ref(key)
                .orderByChild('name')
                .equalTo(fname.toLowerCase() + " " + lname.toLowerCase());

        search.once('value', (snapshot) => {
            var value = snapshot.val();
            if (value === null || value === 'null') {
                resolve("Jag kan tyvärr inte hitta någon information på personen.");
                return;
            }
            var calendarID = value[0].calendarID;
            var startdate;
            var enddate;
            if (empty(datetime) && empty(date) && empty(datePeriod)) {
                startdate = new Date();
                enddate = null;
            } 
            else if (!empty(datetime)) {
                if (datetime.hasOwnProperty('startDateTime')) {
                    startdate = datetime.startDateTime;
                    enddate = datetime.endDateTime;
                } else {
                    startdate = new Date();
                    enddate = null;
                }
            } 
            else if (!empty(date)) {
                datetime = new Date(date);
                startdate = datetime.setHours(0, 0, 0, 0);
                enddate = datetime.setHours(23, 59, 59, 999);

            } 
            else if (!empty(datePeriod)) {
                startdate = (new Date(datePeriod.startDate)).setHours(0, 0, 0, 0);
                enddate = (new Date(datePeriod.endDate)).setHours(23, 59, 59, 999);

            } 
            else {
                resolve(DEFAULT_RESPONSE);
                return;
            }
            findEvents(calendarID, startdate, enddate, fname, reqType)
                    .then((resp) => {
                        resolve(resp);
                    })
                    .catch((error) => {
                        reject(error);
                    });

        }, (error) => {
            console.log("Database error: ", error);
            reject(ERROR_MSG);
        });
    });
}

module.exports.simple_request = simple_request;
module.exports.advanced_request = advanced_request;
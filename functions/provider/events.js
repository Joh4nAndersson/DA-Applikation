const cts = require('../misc/constants');
const ERROR_MSG = cts.error_msg;
const listEvents = require("./https_request").listEvents;
const formatDate = require("./date_formater").format_date;

function findEvent(calendarId, datetime, fname, request_type) {

    return  new Promise((resolve, reject) => {
        try {
            datetime = new Date(datetime);
        } catch (error) {
            console.log("Error on findEvent function: ", error);
            reject(ERROR_MSG);
            return;
        }
        var dtMax = new Date(datetime);
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

module.exports.findEvent = findEvent;
module.exports.findEvents = findEvents;
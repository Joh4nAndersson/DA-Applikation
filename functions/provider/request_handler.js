//Importerar modul för att kunna bygga upp ett textbaserat svar till användaren
const events = require("./events");
const findEvents = events.findEvents;

//Importerar funktion för att kunna hämta kalender ID från databasen
const getCalendarID = require("../integration/dbhandler").getCalendarID;

const cts = require('../misc/constants');
const ERROR_MSG = cts.error_msg;
const DEFAULT_RESPONSE = cts.default_response;

//Funktion som kollar om en string är tom
const empty = cts.is_empty;

const REQUEST_INTENT = 'Request-Intent';
const PERSON_INTENT = 'Person-Intent';
const FF_INTENT = "Followup-Fallback-Intent";
const FW_INTENT = "Followup-Welcome-Intent";
/**
 * Funktionen används för att extrahera nödvändig data från kommando som tillhör 
 * Person-Intent, Followup-Fallback-Intent och Followup-Welcome-Intent. 
 * @param {DialogflowConversation} conv - Ett objekt som innehåller användarens kommando och entities (data extraherade från kommandot)
 * @returns {Promise} - Returnerar ett textbaserat svar   
 */
function simple_request(conv) {
    var params = conv.parameters;
    
    //Tar ut förnamn och efternamn från 'conv' objektet
    var fname = params['first-name']
            .hasOwnProperty('given-name')
            ? (params['first-name'])['given-name'] : params['first-name'];
    var lname = params['last-name']
            .hasOwnProperty('last-name')
            ? (params['last-name'])['last-name'] : params['last-name'];
            
    //Tar ut request-type från 'conv' objektet. Request-type är antingen "Doing" eller "Where"
    var reqType = params['request-entity'];
    
    
    return new Promise((resolve, reject) => {
        //Använder funktionen getCalendarID() för att hitta en persons kalender ID i 
        //databasen genom att söka med personens förnamn och efternamn.
        return getCalendarID(fname, lname)
                .then((value) => {
                    //Om kalender ID:n inte hittas i databasen returneras ett svar som säger att personen inte kunde hittas.
                    if (value === null || value === 'null') {
                        resolve("Jag kan tyvärr inte hitta någon information om personen.");
                        return;
                    }
                    var calendarID = value[Object.keys(value)[0]].calendarID;
                    //Kallar på findEvents() för att hitta kalenderhändelser
                    // med kalender ID:n och bygga upp ett textbaserat svar.
                    findEvents(calendarID, new Date(), null, fname, reqType)
                            .then((resp) => {
                                resolve(resp);
                            })
                            .catch((error) => {
                                reject(error);
                            });
                })
                .catch((error) => {
                    reject(error);
                });

    });
}

/**
 * Funktionen används för att extrahera nödvändig data från kommando som tillhör Request-Intent.
 * @param {DialogflowConversation} conv - Ett objekt som innehåller användarens kommando och entities (data extraherade från kommandot).
 * @returns {Promise} - Returnerar ett textbaserat svar   
 */
function advanced_request(conv) {
    var params = conv.parameters;
    
    //Tar ut förnamn och efternamn från 'conv' objektet.
    var fname = params['first-name'].hasOwnProperty('given-name')
            ? (params['first-name'])['given-name'] : params['first-name'];
    var lname = params['last-name'].hasOwnProperty('last-name')
            ? (params['last-name'])['last-name'] : params['last-name'];
    var datetime = params['date-time'].hasOwnProperty('date_time')
            ? (params['date-time'])['date_time'] : params['date-time'];
            
    //Tar ut request-entity, datum och tidsperiod från 'conv' objektet. 
    var reqType = params['request-entity'];
    var date = params['date'];
    var datePeriod = params['date-period'];

    return new Promise((resolve, reject) => {
        //Använder funktionen getCalendarID() för att hitta en persons kalender ID i 
        //databasen genom att söka med personens förnamn och efternamn.
        return getCalendarID(fname, lname)
                .then((value) => {
                    //Om kalender ID:n inte hittas i databasen returneras ett svar som säger att personen inte kunde hittas.
                    if (value === null || value === 'null') {
                        resolve("Jag kan tyvärr inte hitta någon information om personen.");
                        return;
                    }
                    
                    var calendarID = value[Object.keys(value)[0]].calendarID;
                    //Startdate och enddate skapas och tilldelas till olika tidpunkt objekt beroende på vilka kalenderhändelser
                    //användaren vill hitta som finns mellan en tidsperiod (startdate och enddate).
                    var startdate;
                    var enddate;
                    if (empty(datetime) && empty(date) && empty(datePeriod)) {
                        startdate = new Date();
                        enddate = null;
                    } else if (!empty(datetime)) {
                        if (datetime.hasOwnProperty('startDateTime')) {
                            startdate = datetime.startDateTime;
                            enddate = datetime.endDateTime;
                        } else {
                            startdate = datetime;
                            enddate = null;
                        }
                    } else if (!empty(date)) {
                        datetime = new Date(date);
                        startdate = datetime.setHours(0, 0, 0, 0);
                        enddate = datetime.setHours(23, 59, 59, 999);

                    } else if (!empty(datePeriod)) {
                        startdate = (new Date(datePeriod.startDate)).setHours(0, 0, 0, 0);
                        enddate = (new Date(datePeriod.endDate)).setHours(23, 59, 59, 999);

                    } else {
                        resolve(DEFAULT_RESPONSE);
                        return;
                    }
                    
                    //Kallar på findEvents() för att hitta kalenderhändelser
                    // med kalender ID:n och bygga upp ett textbaserat svar.
                    findEvents(calendarID, startdate, enddate, fname, reqType)
                            .then((resp) => {
                                resolve(resp);
                            })
                            .catch((error) => {
                                reject(error);
                            });

                }, (error) => {
                    reject(error);
                });
    });
}

module.exports.simple_request = simple_request;
module.exports.advanced_request = advanced_request;
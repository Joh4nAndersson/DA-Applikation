const cts = require('../misc/constants');
const ERROR_MSG = cts.error_msg;
//Importerar modul som kan hämta kalenderhändelser med Google Calendar API
const listEvents = require("../integration/https_request").listEvents;

//Importerar modul som kan konvertera två tidpunkt(Date) objekt till läsbar tidsperiod
const formatDate = require("./date_formater").format_date;

/**
 * Funktionen används för att bygga upp ett textbaserat svar till Dialogflow
 * @param {String} calendarId - En persons kalender ID i Googles kaländertjänst
 * @param {Date} startdate - Första delen av tidsperioden  
 * @param {Date} enddate - Andra delen av tidsperioden
 * @param {String} fname - En persons förnamn
 * @param {String} request_type - Används för att bygga upp rätt typ av svar
 * @returns {Promise} - Returnerar ett textbaserat svar 
 */
function findEvents(calendarId, startdate, enddate, fname, request_type) {
    return new Promise((resolve, reject) => {
        //Konverterar startdate och enddate till tidpunkt(Date) objekt
        try {
            startdate = new Date(startdate);
            //Om enddate är NULL används startdate för att tilldela ny tidpunkt till enddate
            if (enddate === null) {
                dtMax = new Date(startdate);
                enddate = new Date(dtMax.setSeconds(dtMax.getSeconds() + 1));
            } else {
                enddate = new Date(enddate);
            }

        } catch (error) {
            console.log("Error on findEvents function: ", error);
            reject(ERROR_MSG);
            return;
        }
        //Funktionen listEvents används för att hämta alla kalenderhändelser som inträffar mellan tidsperioden (mellan startdate och enddate)
        //Funktionen encodeURIComponent() konverterar för en URI genom att ersätta URL-reserverade tecken med deras UTF-8-kodning.
        listEvents(calendarId,
                encodeURIComponent(startdate.toISOString()), 
                encodeURIComponent(enddate.toISOString()))
                .then((events) => {
                    if (events.length < 1) {
                        if (request_type === "Doing") {
                            resolve(fname + ' har inget planerat.');
                        } else if (request_type === "Search") {
                            resolve("Jag kan tyvärr inte hitta " + fname + ".");
                        } else {
                            resolve('Jag kan tyvärr inte hitta den informationen i ' + fname + ' kalender.');
                        }
                    } else {
                        var sb = fname + (request_type === 'Doing' ? ' har ' : ' är ') + "enligt sin kalender";
                        
                        //Itererar igenom JSON objektet som innhåller alla kalenderhändelser och extraherar alla parametrar från varje händelse.
                        //För varje iteration byggt den textbaserade svaret med hjälp av parametrarna.
                        events.forEach(function (event, index, array) {
                            var location = event.location;
                            var summary = event.summary;
                            var startDateTime = event.start.dateTime;
                            var endDateTime = event.end.dateTime;
                            var colon = ", ";
                            if (index === (array.length - 1)) {
                                colon = ".";
                            }
                            if (request_type === "Doing") {
                                sb += " " + summary;
                            } else {
                                sb += " i " + location;
                            }
                            sb += " " + formatDate(startDateTime, endDateTime) + colon;
                        });
                        //Svaret returneras
                        resolve(sb);
                    }
                })
                .catch((error) => {
                    //Returnera felmeddelande om något fel sker i funktionen listEvents 
                    reject(error);
                });
    });

}

module.exports.findEvents = findEvents;
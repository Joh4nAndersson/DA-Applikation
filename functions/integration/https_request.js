//Importerar https som är inbyggd i Node.js.
const https = require('https');

//Importerar en modul som innehåller felmeddelande och Google Calendar API nyckeln.
const cts = require('../misc/constants');
const ERROR_MSG = cts.error_msg;

//Google Calendar API nyckeln används för att kunna utföra HTTPS anrop till Calendar API.
const apiKey = cts.api_key;

/**
 * Funktionen används för att hämta kalenderhändelser från en persons kalender i Googles kalendertjänst.
 * Detta görs med hjälp av HTTPS anrop till Google Calendar API.
 * @param {String} calendarId - En persons kalender ID för att komma åt personens kalender.
 * 
 * En tidsperiod används för att hämta alla kalenderhändeler som är mellan perioderna. 
 * @param {Date} dateFrom - Tidpunkt objekt som är en del av tidsperioden.
 * @param {Date} dateTo - Tidpunkt objekt som är en del av tidsperioden.
 * @returns {Promise} - Returnerar alla kalenderhändelser som hittas mellan tidsperioden.
 */
function listEvents(calendarId, dateFrom, dateTo) {
    return new Promise((resolve, reject) => {
        
        //Utför HTTPS GET anrop till Google Calendar API:n med kalender ID:n, API nyckeln och tidsperioden. 
        https.get('https://www.googleapis.com/calendar/v3/calendars/' +
                calendarId +
                '/events?key=' +
                apiKey +
                '&timeMin=' + dateFrom +
                '&timeMax=' + dateTo, (resp) => {
            var data = '';
            
            //Samlar in all datadelar som hämtas från HTTPS anropet.
            resp.on('data', (chunk) => {
                data += chunk;
            });
            
            //Returnerar kalenderhändelserna i ett JSON objekt när all datadelar har hämtats från anropet.
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
            console.log("Error getting data from Google Calendar API: ", e);
            reject(ERROR_MSG);
        });
    });
}


module.exports.listEvents = listEvents; 
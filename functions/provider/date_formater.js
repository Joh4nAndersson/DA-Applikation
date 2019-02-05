//Importerar moment-timezone för att hjälpa till med tidpunk formatering
const moment = require('moment-timezone');

//Sätter tidszon till Sverige
moment.locale('se');


/**
 * Funktionen används till att Konvertera två tidspunkt objekt till läsar tidsperiod  
 * @param {type} startTimeP - Start tidpunkt 
 * @param {type} endTimeP - Slut tidpunkt
 * @returns {String} - Returnerar läsbar tidsperiod som tex. 'idag mellan 16:30 och 17:30' 
 * eller '15:e april mellan 16:30 och 17:30' beroende på hur mycket tidpunkterna skiljer sig mellan varandra och nuvurande tidpunkt 
 */
function formatDate(startTimeP, endTimeP) {
    
    //Definerar en array som innehåller alla kalenderdagar i en månad
    var daysToString = ['', 'första', 'andra', 'tredje', 'fjärde', 'femte', 'sjätte', 'sjunde', 'åttonde', 'nionde', 'tionde', 'elfte', 'tolfte', 'trettonde', 'fjortonde', 'femtonde'
                , 'sextonde', 'sjuttonde', 'artonde', 'nittonde', 'tjugonde', 'tjugoförsta', 'tjugoandra', 'tjugotredje', 'tjugofjärde', 'tjugofemte', 'tjugosjätte', 'tjugosjunde',
        'tjugoåttonnde', 'tjugonionde', 'trettionde', 'trettioförsta'];
    
    //Definerar en array som innehåller alla månader i ett år
    var monthsToString = ['', 'januari', 'februari', 'march', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
    
    //Definerar en array som innehåller alla dagar i en vecka
    var wdToString = ['', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag'];
    
    //Konverterar tidpunkt parametrarna till tidpunkt (Date) objekt 
    var startTime = new Date(startTimeP);
    var endTime = new Date(endTimeP);
    var todaysDate = new Date();

    var isYearP = startTime.getFullYear() === endTime.getFullYear();
    var isMonthP = startTime.getMonth() === endTime.getMonth();
    var isDayP = startTime.getDate() === endTime.getDate();
    
    //Skapar och returnerar en läsbar tidsperiod
    if (isYearP && isMonthP && isDayP) {

        var isYear = startTime.getFullYear() === todaysDate.getFullYear();
        var isMonth = startTime.getMonth() === todaysDate.getMonth();
        var isDay = startTime.getDate() === todaysDate.getDate();
        
        var timezone = "Europe/Stockholm";
        var startT = moment(startTime).tz(timezone).format('LT');
        var endT = moment(endTime).tz(timezone).format('LT');;

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

module.exports.format_date = formatDate;
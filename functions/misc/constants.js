
const DEFAULT_RESPONSE = "Jag förstod inte vad du sa, vem söker du?";

//Standard felmeddelande
const ERROR_MSG = "Något gick fel förfrågan och det gick inte att slutföra sökningen.";

//Google Calendar API nyckel för att kunna använda API:n
const API_KEY = "AIzaSyDXSrMo_Y0lV94nFcntnMbsID5wjleFLdg";

/**
 * Funktion för att kontrollera om String är tom.
 * @param {String} str - Värdet som ska kontrolleras
 * @returns {Boolean} - Returnerar TRUE om värdet är tom, annars FALSE. 
 */
function isEmpty(str) {
    return str === '';
}

module.exports.error_msg = ERROR_MSG;
module.exports.default_response = DEFAULT_RESPONSE;
module.exports.api_key = API_KEY;
module.exports.is_empty = isEmpty;
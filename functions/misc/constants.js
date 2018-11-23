
const DEFAULT_RESPONSE = "Jag förstod inte vad du sa, vem söker du?";
const ERROR_MSG = "Något gick fel och det gick inte att slutföra sökningen.";
const API_KEY = "AIzaSyDXSrMo_Y0lV94nFcntnMbsID5wjleFLdg";
function isEmpty(str) {
    return str === '';
}

module.exports.error_msg = ERROR_MSG;
module.exports.default_response = DEFAULT_RESPONSE;
module.exports.api_key = API_KEY;
module.exports.is_empty = isEmpty;
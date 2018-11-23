//Import firebase functions
const functions = require('firebase-functions');
const {dialogflow} = require('actions-on-google');
const request_handler = require('./provider/request_handler');
const simple_request = request_handler.simple_request;
const advanced_request = request_handler.advanced_request;

const REQUEST_INTENT = 'Request-Intent';
const PERSON_INTENT = 'Person-Intent';
const FF_INTENT = "Followup-Fallback-Intent";
const FW_INTENT = "Followup-Welcome-Intent";
const app = dialogflow();

app.intent(PERSON_INTENT, (conv) => {
    return simple_request(conv).
            then((response) => {
                conv.close(response);
            })
            .catch((error) => {
                conv.close(error);
            });
});

app.intent(REQUEST_INTENT, (conv) => {
    return advanced_request(conv).
            then((response) => {
                conv.close(response);
            })
            .catch((error) => {
                conv.close(error);
            });
});

app.intent(FF_INTENT, (conv) => {
    return simple_request(conv).
            then((response) => {
                conv.close(response);
            })
            .catch((error) => {
                conv.close(error);
            });
});

app.intent(FW_INTENT, (conv) => {
    return simple_request(conv).
            then((response) => {
                conv.close(response);
            })
            .catch((error) => {
                conv.close(error);
            });
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);



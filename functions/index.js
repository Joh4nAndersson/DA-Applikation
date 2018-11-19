//Import firebase functions
const functions = require('firebase-functions');
const {dialogflow} = require('actions-on-google');
const handler = require('./provider/request_handler');
const simple_request = handler.simple_request;
const advanced_request = handler.advanced_request;

const REQUEST_INTENT = 'Request-Intent';
const PERSON_INTENT = 'Person-Intent';
const FF_INTENT = "Followup-Fallback-Intent";
const FW_INTENT = "Followup-Welcome-Intent";
const app = dialogflow();

app.intent(PERSON_INTENT, (conv) => {
    return simple_request(conv).
            then((response) => {
                conv.ask(response);
            })
            .catch((error) => {
                conv.ask(error);
            });
});

app.intent(REQUEST_INTENT, (conv) => {
    return advanced_request(conv).
            then((response) => {
                conv.ask(response);
            })
            .catch((error) => {
                conv.ask(error);
            });
});

app.intent(FF_INTENT, (conv) => {
    return simple_request(conv).
            then((response) => {
                conv.ask(response);
            })
            .catch((error) => {
                conv.ask(error);
            });
});

app.intent(FW_INTENT, (conv) => {
    return simple_request(conv).
            then((response) => {
                conv.ask(response);
            })
            .catch((error) => {
                conv.ask(error);
            });
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);



//Importerar firebase functions
const functions = require('firebase-functions');
//Importerar actions-on-google för att kunna använda Dialogflow funktioner
const {dialogflow} = require('actions-on-google');
//Importerar request_handler för att hantera data som tas emot från Dialogflow
const request_handler = require('./provider/request_handler');
const simple_request = request_handler.simple_request;
const advanced_request = request_handler.advanced_request;
const continue_text = " Vill du veta något mer?";

//Nya konstanter som innehåller namn på alla skapade intents i Dialogflow 
const REQUEST_INTENT = 'Request-Intent';
const PERSON_INTENT = 'Person-Intent';
const FF_INTENT = "Followup-Fallback-Intent";
const FW_INTENT = "Followup-Welcome-Intent";

const app = dialogflow();

//Intent hanterare(handler) för att ta emot kommando från Person-Intent
app.intent(PERSON_INTENT, (conv) => {
    return simple_request(conv).
            then((response) => {
                conv.ask(response+ continue_text);
            })
            .catch((error) => {
                conv.close(error);
            });
});

//Intent hanterare för att ta emot kommando från Request-Intent
app.intent(REQUEST_INTENT, (conv) => {
    return advanced_request(conv).
            then((response) => {
                conv.ask(response+ continue_text);
            })
            .catch((error) => {
                conv.close(error);
            });
});

//Intent hanterare för att ta emot kommando från Followup-Fallback-Intent
app.intent(FF_INTENT, (conv) => {
    return simple_request(conv).
            then((response) => {
                conv.ask(response+ continue_text);
            })
            .catch((error) => {
                conv.close(error);
            });
});

//Intent hanterare för att ta emot kommando från Followup-Fallback-Intent
app.intent(FW_INTENT, (conv) => {
    return simple_request(conv).
            then((response) => {
                conv.ask(response+ continue_text);
            })
            .catch((error) => {
                conv.close(error);
            });
});

//Konstanten 'app' exporteras för att ta emot HTTPS anrop från Dialogflow 
//Firebase deklarerar konstanten som en moln funktion (Cloud Function)
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);


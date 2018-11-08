//Import firebase functions
const functions = require('firebase-functions');
const {dialogflow} = require('actions-on-google');

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const REQUEST_INTENT = 'Request-Intent';
const PERSON_INTENT = 'Person-Intent';
const app = dialogflow();

app.intent(REQUEST_INTENT, (conv) =>{
    var params = conv.parameters;
    var fname = params['first-name'];
    var lname = params['last-name'];
    var datetime = params['date-time'];
    var requestName = params[request];
    
    console.log(params);
    conv.ask(params);
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);


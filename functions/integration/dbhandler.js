const admin = require("firebase-admin");
const serviceAccount = require("../misc/serviceAccountKey.json");
const cts = require('../misc/constants');
const ERROR_MSG = cts.error_msg;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://newagent-44155.firebaseio.com"
});

function getCalendarID(fname, lname) {
    var db = admin.database();
    var key = 'calendars/';
    var search = db.ref(key)
            .orderByChild('name')
            .equalTo(fname.toLowerCase() + " " + lname.toLowerCase());

    return new Promise((resolve, reject) => {
        search.once('value', (snapshot) => {
            resolve(snapshot.val());
        }, (error) => {
            console.log("Database error: ", error);

            reject(ERROR_MSG);
        });
    });

}

module.exports.getCalendarID = getCalendarID;

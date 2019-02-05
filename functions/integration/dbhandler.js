//Importerar firebase-admin för att komma åt databasen Realtime Databasen i Firebase.
const admin = require("firebase-admin");
//Importerar nyckeln för få återkomst till databasen
const serviceAccount = require("../misc/serviceAccountKey.json");
//Importerar globala konstanter som används i hela serverkoden
const cts = require('../misc/constants');
const ERROR_MSG = cts.error_msg;

//Iinitializerar databas återkomst med nyckeln och länk till databasen 
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://newagent-44155.firebaseio.com"
});

/**
 * Funktionen används för att hämta kalender id från databasen genom att söka med kalenderägarens förnamn och efternamn.
 * @param {String} fname - Databassökning med förnamn.
 * @param {String} lname - Databassökning med efternamn.
 * @returns {Promise} - Returnerar värdet som hämtas från databasen.
 * Värdet kan antingen vara kalender ID:n eller NULL (om kalender ID:n inte hittas).
 */
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

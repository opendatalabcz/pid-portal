//Sequential execution for node.js using ES6 ECMAScript
var rp = require('request-promise');

rp({
    method: 'GET',
    uri: 'http://localhost:3000/getStopForTrip',
    body: {
        trip_id : "2_68_190902"
    },
    json: true // Automatically stringifies the body to JSON
}).then(function (parsedBody) {
        console.log(parsedBody);
        // POST succeeded...
    })
    .catch(function (err) {
        console.log(err);
        // POST failed...
    });

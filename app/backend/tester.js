//Sequential execution for node.js using ES6 ECMAScript
var rp = require('request-promise');

rp({
    method: 'GET',
    uri: 'http://localhost:3000/getStopDelays/316_122_191026'
,
    json: true // Automatically stringifies the body to JSON
}).then(function (parsedBody) {
        console.log(parsedBody);
        // POST succeeded...
    })
    .catch(function (err) {
        console.log(err);
        // POST failed...
    });

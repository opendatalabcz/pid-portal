const express = require('express')

// use process.env variables to keep private variables,
// be sure to ignore the .env file in github
require('dotenv').config()

// Express Middleware
const helmet = require('helmet') // creates headers that protect from attacks (security)
const bodyParser = require('body-parser') // turns response into usable format
const cors = require('cors')  // allows/disallows cross-site communication
const morgan = require('morgan') // logs requests

// db Connection w/ Heroku
// const db = require('knex')({
//   client: 'pg',
//   connection: {
//     connectionString: process.env.DATABASE_URL,
//     ssl: true,
//   }
// });

// db Connection w/ localhost
var db = require('knex')({
  client: 'pg',
  connection: {
    host : '10.0.0.7',
    user : 'postgres',
    password : 'passwd',
    database : 'pid-portal'
  }
});

// Controllers - aka, the db queries
const main = require('./controllers/main')

// App
const app = express()

// App Middleware
const whitelist = ['http://localhost:3001']
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}
app.use(helmet())
app.use(cors(corsOptions))
app.use(bodyParser.json())
app.use(morgan('combined')) // use 'tiny' or 'combined'

// App Routes - Auth
app.get('/', (req, res) => res.send('hello world'))
app.get('/getLastVehiclePositions', (req, res) => main.getLastVehiclePositions(req, res, db))
app.get('/getVehicleHistory/:vehicle_id', (req, res) => main.getVehicleHistory(req, res, db))
app.get('/getRouteForTrip/:trip_id', (req, res) => main.getRouteForTrip(req, res, db))
app.get('/getRoute/:route_id', (req, res) => main.getRoute(req, res, db))
app.get('/getStop/:stop_id', (req, res) => main.getStop(req, res, db))
app.get('/getStopForTrip/:trip_id', (req, res) => main.getStopForTrip(req, res, db))
app.get('/getVehicleInfo/:vehicle_id', (req, res) => main.getVehicleInfo(req, res, db))
//app.put('/crud', (req, res) => main.putTableData(req, res, db))
//app.delete('/crud', (req, res) => main.deleteTableData(req, res, db))

// App Server Connection
app.listen(process.env.PORT || 3000, () => {
  console.log(`app is running on port ${process.env.PORT || 3000}`)
})
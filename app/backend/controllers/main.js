/*
   select vehicle_id, latitude, longitude
    FROM vehicle_position vp1
    where order = 
        (select max(order) from vehicle_position vp2 where vp1.vehicle_id=vp2.vehicle_id)
*/


const getLastVehiclePositions = (req, res, db) => {
  db.raw('select *  \
          FROM "Vehicle_position" vp1 \
          where "order" = \
                      (select max("order") \
                       from "Vehicle_position" vp2\
                       where vp1.trip_id=vp2.trip_id);')
    .then(items => {
      if(items.rows.length > 0){
        res.json(items.rows)
      } else {
        res.json({dataExists: 'false'})
      }
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}


const getVehicleHistory = (req, res, db) => {
  const { trip_id } = req.params
  db.raw('select * \
          FROM "Vehicle_position" \
          where trip_id = \'' + trip_id + '\' order by "order" asc')
    .then(items => {
      if(items.rows.length > 0){
        res.json(items.rows)
      } else {
        res.json({dataExists: 'false'})
      }
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}

const getVehicleInfo = (req, res, db) => {
  const { vehicle_id } = req.params
  db.raw('select * \
          FROM "Vehicle" \
          where vehicle_id = \'' + vehicle_id + '\'')
    .then(items => {
      if(items.rows.length > 0){
        res.json(items.rows)
      } else {
        res.json({dataExists: 'false'})
      }
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}

const getRoute = (req, res, db) => {
  const { route_id } = req.params
  db.raw('select * \
          FROM "Route" \
          where route_id = \'' + route_id + '\' order by "order" asc')
    .then(items => {
      if(items.rows.length > 0){
        res.json(items.rows)
      } else {
        res.json({dataExists: 'false'})
      }
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}

const getRouteForTrip = (req, res, db) => {
  const { trip_id } = req.params
  db.raw('select * FROM "Route" as a join "Trip" as b on a.route_id=b.shape_id where trip_id = \'' + trip_id +'\'\
          ORDER BY (CASE WHEN direction THEN "order" END) ASC,\
           "order" DESC')
    .then(items => {
      if(items.rows.length > 0){
        res.json(items.rows)
      } else {
        res.json({dataExists: 'false'})
      }
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}

const getStop = (req, res, db) => {
  const { stop_id } = req.params
  db.raw('select * \
          FROM "Stop" \
          where stop_id = \'' + stop_id + '\'')
    .then(items => {
      if(items.rows.length > 0){
        res.json(items.rows)
      } else {
        res.json({dataExists: 'false'})
      }
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}

const getStopForTrip = (req, res, db) => {
  const { trip_id } = req.params
  db.raw('select stop_id \
  FROM "Route" as a join "Trip" as b on a.route_id=b.shape_id \
  where trip_id = \'' + trip_id + '\'\ and stop_id <> \'\' \
  ORDER BY (CASE WHEN direction THEN "order" END) ASC, \
             "order" DESC')
    .then(items => {
      if(items.rows.length > 0){
        res.json(items.rows)
      } else {
        res.json({dataExists: 'false'})
      }
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}

const postTableData = (req, res, db) => {
  const { first, last, email, phone, location, hobby } = req.body
  const added = new Date()
  db('testtable1').insert({first, last, email, phone, location, hobby, added})
    .returning('*')
    .then(item => {
      res.json(item)
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}

const putTableData = (req, res, db) => {
  const { id, first, last, email, phone, location, hobby } = req.body
  db('testtable1').where({id}).update({first, last, email, phone, location, hobby})
    .returning('*')
    .then(item => {
      res.json(item)
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}

const deleteTableData = (req, res, db) => {
  const { id } = req.body
  db('testtable1').where({id}).del()
    .then(() => {
      res.json({delete: 'true'})
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}

module.exports = {
  getLastVehiclePositions,
  getVehicleHistory,
  getRouteForTrip,
  getRoute,
  getStop,
  getStopForTrip,
  getVehicleInfo,
  postTableData,
  putTableData,
  deleteTableData
}
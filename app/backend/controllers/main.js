/*
   select vehicle_id, latitude, longitude
    FROM vehicle_position vp1
    where order = 
        (select max(order) from vehicle_position vp2 where vp1.vehicle_id=vp2.vehicle_id)
*/


const getLastVehiclePositions = (req, res, db) => {
  db.raw('select vehicle_id, latitude, longitude, "timestamp" \
          FROM "Vehicle_position" vp1 \
          where "order" = \
                      (select max("order") \
                       from "Vehicle_position" vp2\
                       where vp1.vehicle_id=vp2.vehicle_id);')
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
  const { vehicle_id } = req.body
  db.raw('select vehicle_id, latitude, longitude, "timestamp", "order" \
          FROM "Vehicle_position" \
          where vehicle_id = {} order by "order" asc'.format(vehicle_id))
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
  postTableData,
  putTableData,
  deleteTableData
}
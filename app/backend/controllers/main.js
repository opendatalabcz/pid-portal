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

const getLastTripData = (req, res, db) => {
  const { trip_id } = req.params
  db.raw('select * FROM "Vehicle_position" vp1 join "Vehicle" as vhl on vp1.vehicle_id = vhl.vehicle_id where trip_id=\'' + trip_id + '\' and "order" = (select max("order") from "Vehicle_position" vp2 where vp1.trip_id=vp2.trip_id);')
    .then(items => {
      if(items.rows.length > 0){
        res.json(items.rows)
      } else {
        res.json({dataExists: 'false'})
      }
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}

const processStats = (stats) => 
{
  var ret = [
    {
      name: 'Pondělí', delay: 0
    },
    {
      name: 'Úterý', delay: 0
    },
    {
      name: 'Středa', delay: 0
    },
    {
      name: 'Čtvrtek', delay: 0
    },
    {
      name: 'Pátek', delay: 0
    },
    {
      name: 'Sobota', delay: 0
    },
    {
      name: 'Neděle', delay: 0
    },
  ];
  for(i = 0; i < stats.rows.length; i++)
  {
    ret[stats.rows[i].day_nr-1].delay = Number(stats.rows[i].avg_delay);
  }
  return ret;
}

/*
return [
    {
      name: 'Pondělí', delay: stats.monday_delay, nr : stats.monday_n
    },
    {
      name: 'Úterý', delay: stats.tuesday_delay, nr : stats.tuesday_n
    },
    {
      name: 'Středa', delay: stats.wednesday_delay, nr : stats.wednesday_n
    },
    {
      name: 'Čtvrtek', delay: stats.thursday_delay, nr : stats.thursday_n
    },
    {
      name: 'Pátek', delay: stats.friday_delay, nr : stats.friday_n
    },
    {
      name: 'Sobota', delay: stats.saturday_delay, nr : stats.saturday_n
    },
    {
      name: 'Neděle', delay: stats.sunday_delay, nr : stats.sunday_n
    },
  ];
*/ 


const processEmptyStats = (stats) => 
{
  return [
    {
      name: 'Pondělí', delay: 5,
    },
    {
      name: 'Úterý', delay: 10,
    },
    {
      name: 'Středa', delay: 25,
    },
    {
      name: 'Čtvrtek', delay: 70,
    },
    {
      name: 'Pátek', delay: 8,
    },
    {
      name: 'Sobota', delay: 11,
    },
    {
      name: 'Neděle', delay: 0,
    },
  ];
}

const getTripStats = (req, res, db) => {
  const { trip_id } = req.params
  db.raw('SELECT * FROM "Trip_delay" where trip_id = \'' + trip_id + '\';')
    .then(items => {
      if(items.rows.length > 0){
        res.json(processStats(items))
      } else {
        res.json(processEmptyStats(items))
      }
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}


const fixStats = (stats) =>
{
  for(var i = 0; i < stats.length; i++)
  {
    stats[i].avg=Number(Number(stats[i].avg).toFixed(2));
  }
  return stats;
}

const getHistogramStats = (req, res, db) => {
  //const { trip_id } = req.params
  db.raw('select avg(delay_stop_departure), extract(hour from timestamp) as hour from "Vehicle_positions" group by extract(hour from timestamp);')
    .then(items => {
      if(items.rows.length > 0){
        res.json(fixStats(items.rows))
      } else {
        res.json(processEmptyStats(items))
      }
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}

const getHistogramStatsByDay = (req, res, db) => {
  //const { trip_id } = req.params
  db.raw('select avg(delay_stop_departure), extract(isodow from timestamp) as day from "Vehicle_positions" group by extract(isodow from timestamp);')
    .then(items => {
      if(items.rows.length > 0){
        res.json(fixStats(items.rows))
      } else {
        res.json(processEmptyStats(items))
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
  db.raw('select * \
  FROM "stop_time" as a join "Stop" as b on a.stop_id=b.stop_id \
  where trip_id = \'' + trip_id + '\'\ \
  ORDER BY "sequence" ASC')
    .then(items => {
      if(items.rows.length > 0){
        res.json(items.rows)
      } else {
        res.json({dataExists: 'false'})
      }
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}

const getStops_delays = (req, res, db) => {
  const { trip_id } = req.params
  db.raw('SELECT * FROM "Trip_sections" WHERE trip_id=\'' + trip_id + '\' ORDER BY "sequence" ASC;')
    .then(items => {
      if(items.rows.length > 0){
        res.json(items.rows)
      } else {
        res.json({dataExists: 'false'})
      }
    })
    .catch(err => res.status(400).json({dbError: 'db error'}))
}

const getBadSections = (req, res, db) => {
  const { trip_id } = req.params
  db.raw('select b.name as source, c.name as destination, avg_delay FROM public."Trip_sections" as a join "Stop" as b on a.source=b.stop_id join "Stop" as c on a.destination=c.stop_id \
  WHERE avg_delay is not null \
  ORDER BY avg_delay DESC LIMIT 100;')
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
  deleteTableData,
  getLastTripData,
  getTripStats,
  getStops_delays,
  getHistogramStats,
  getHistogramStatsByDay,
  getBadSections
}
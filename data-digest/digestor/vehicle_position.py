import pickle
import datetime
import dateutil.parser

def digest(file):
    f = open(file, 'r')
    raw_data = f.read()
    #raw_data.replace('{"features":', '/n{"features":')
    #raw_data.replace('/n{"features":', '', 1)
    #lines = raw_data.split('\n')
    d = '}{'
    lines =  ['{' + e + '}' for e in raw_data.split(d) if e]
    
    lines[0] = lines[0].replace('{{', '{', 1)
    lines[-1] = lines[-1].replace('"type":"Feature"}],"type":"FeatureCollection"}}', '"type":"Feature"}],"type":"FeatureCollection"}')
    
    data = []
    for line in lines:
        if line != '':
            try:
                data.append(json.loads(line))
            except:
                exc_file = open('err_line', 'a')
                exc_file.write(line + '\n')
                exc_file.close()
        
    
    #df = pd.read_json(file, lines=True)
    return data

    
def convert_unix_to_date(unix_ts):
    try:
        return datetime.fromtimestamp(int(unix_ts[:-3])).strftime('%Y-%m-%d %H:%M:%S')
    except:
        return unix_ts


def get_trip_delay(trip_id, day):
    cur.execute(""" 
    select avg_delay from "Trip_delay" where trip_id='{}' and day_nr={}
    """.format(trip_id, day))
    ret_val = cur.fetchone()
    if ret_val is None:
        return 0.0
    return ret_val


def get_section_delays(trip_id, next_stop):
    cur.execute(""" 
    select avg_delay, last_delay from "Trip_sections" where trip_id='{}' and destination='{}'
    """.format(trip_id, next_stop))
    ret_val = cur.fetchone()
    if ret_val is None:
        return (0.0, 0.0)
    return ret_val


def do_prediction(data, model):
    if model is None:
        return 0   
    date = dateutil.parser.parse(convert_unix_to_date(data['properties']['last_position']['origin_timestamp']))
    day_nr = date.weekday()+1
    section_delays = get_section_delays(data['properties']['trip']['gtfs_trip_id'], data['properties']['last_position']['gtfs_next_stop_id'])
    X = [data['properties']['last_position']['delay'], data['properties']['last_position']['delay_stop_departure'], date.hour, date.minute, day_nr, data['properties']['last_position']['speed'],
         data['properties']['last_position']['gtfs_shape_dist_traveled'], get_trip_delay(data['properties']['trip']['gtfs_trip_id'], day_nr), section_delays[1], section_delays[0]]
    prediction = model.predict(X)
    return prediction[0]


def insert_single_file(entry, folder):
    file = open('{}/model.model'.format(folder),'rb')
    model = pickle.load(file)
    i = 0
    cur.execute("""truncate public."Vehicle_position" CASCADE""")
    for line in entry:
        for data in line['features']:
            cur.execute("""
                INSERT INTO public."Vehicle_position"(
                route_id, "timestamp", bearing, calculated_delay, speed, longitude, latitude, vehicle_id, trip_id, is_canceled, next_stop_id, delay_stop_departure, delay_stop_arrival, distance_traveled, predicted_value)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
               (data['properties']['trip']['gtfs_route_id'],convert_unix_to_date(data['properties']['last_position']['origin_timestamp']), 
                data['properties']['last_position']['bearing'], data['properties']['last_position']['delay'],
                data['properties']['last_position']['speed'], data['properties']['last_position']['lng'], data['properties']['last_position']['lat'],
                data['properties']['trip']['cis_vehicle_registration_number'], data['properties']['trip']['gtfs_trip_id'], data['properties']['last_position']['is_canceled'],
                data['properties']['last_position']['gtfs_next_stop_id'], 
                data['properties']['last_position']['delay_stop_departure'],
                data['properties']['last_position']['delay_stop_arrival'],
                data['properties']['last_position']['gtfs_shape_dist_traveled'], 
                do_prediction(data, model)
               ))
            cur.execute(""" insert into public."Vehicle_positions" (select * from public."Vehicle_position") """)
        #trip delays
            if data['properties']['last_position']['delay_stop_departure'] != None:
                cur.execute("""
        INSERT INTO public."Trip_delay"(
		trip_id, day_nr, avg_delay, cnt)
		VALUES (%s, extract(isodow from date %s), %s, 1) ON CONFLICT (trip_id,day_nr) DO UPDATE 
	  SET avg_delay = (%s + "Trip_delay".cnt * "Trip_delay".avg_delay)/("Trip_delay".cnt+1), cnt = "Trip_delay".cnt+1 ;
        """, (data['properties']['trip']['gtfs_trip_id'], convert_unix_to_date(data['properties']['last_position']['origin_timestamp'][:-3]), data['properties']['last_position']['delay_stop_departure'],
         data['properties']['last_position']['delay_stop_departure']))
        #section delays
                cur.execute("""
        UPDATE public."Trip_sections"
		SET last_delay=%s,
		avg_delay = case when avg_delay is null then %s else (%s+("Trip_sections".delay_counter*"Trip_sections".avg_delay))/("Trip_sections".delay_counter+1) end,
		delay_counter = case when delay_counter is null then 1 else delay_counter+1 end
		WHERE trip_id=%s and destination=%s;
        """, (data['properties']['last_position']['delay_stop_departure'], data['properties']['last_position']['delay_stop_departure'], data['properties']['last_position']['delay_stop_departure'], data['properties']['trip']['gtfs_trip_id'], data['properties']['last_position']['gtfs_next_stop_id']))
        #filling the vehicle table from the position data
            cur.execute("""
        INSERT INTO public."Vehicle"(
	vehicle_id, vehicle_type, agency)
	VALUES (%s, %s, %s)
        ON CONFLICT (vehicle_id) DO UPDATE 
        SET vehicle_type = excluded.vehicle_type, agency = excluded.agency;
        """, (data['properties']['trip']['cis_vehicle_registration_number'], data['properties']['trip']['vehicle_type'], data['properties']['trip']['cis_agency_name'])
                   )
        i += 1
    print('Executed {} entries for table Vehicle_position'.format(i))
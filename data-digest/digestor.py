import os
import json
import psycopg2
import sys


#establishing connection to db
conn = psycopg2.connect("host=localhost port=5432 dbname=pid-portal user=postgres password=passwd") 
cur = conn.cursor()



def digest(file):
    f = open(file, 'r')
    data = [json.loads(line) for line in open(file, 'r')]
    #df = pd.read_json(file, lines=True)
    return data


def insert_vehicle_positions(folder):
    entries = [digest(entry) for entry in os.scandir(
        '{}/data/'.format(folder)) if entry.is_file()]
    i = 0
    for line in entries[0]:
        for data in line['features']:
            cur.execute("""
                    INSERT INTO public."Vehicle_position"(
                    route_id, "timestamp", bearing, calculated_delay, speed, longitude, latitude, vehicle_id, trip_id, is_canceled)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """,
                        (data['properties']['trip']['gtfs_route_id'], data['properties']['trip']['start_timestamp'],
                    data['properties']['last_position']['bearing'], data['properties']['last_position']['delay'],
                    data['properties']['last_position']['speed'], data['properties'][
                        'last_position']['lng'], data['properties']['last_position']['lat'],
                    data['properties']['trip']['cis_vehicle_registration_number'], data['properties'][
                        'trip']['gtfs_trip_id'], data['properties']['last_position']['is_canceled']
                    ))
            # filling the vehicle table from the position data
            cur.execute("""
            INSERT INTO public."Vehicle"(
    	vehicle_id, vehicle_type, agency)
    	VALUES (%s, %s, %s)
        ON CONFLICT (vehicle_id) DO UPDATE
      SET vehicle_type = excluded.vehicle_type,
      agency = excluded.agency
        ;
            """,
                        (data['properties']['trip']['cis_vehicle_registration_number'], data['properties']
                         ['trip']['vehicle_type'], data['properties']['trip']['cis_agency_name'])
                        )
            i += 1
    print('Executed {} entries for table Vehicle_position'.format(i))


def insert_stops(folder)
 entries = [digest_stops(entry) for entry in os.scandir(
     '{}/stops'.format(folder)) if entry.is_file()]
  i = 0
   for a in entries[0]['features']:

        cur.execute("""
        INSERT INTO public."Stop"(
    	stop_id, name, latitude, longitude, zone_id, wheelchair_acc)
    	VALUES (%s, %s, %s, %s, %s, %s);
        """, (a['properties']['stop_id'], a['properties']['stop_name'], a['properties']['stop_lat'], a['properties']['stop_lon'], a['properties']['zone_id'],
              get_bool_from_int_for_wheelchair(
                  a['properties']['wheelchair_boarding'])
              ))
        i += 1
    print('Executed {} entries for table Stop'.format(i))


def insert_routes(folder):
    entries = [digest_routes(entry) for entry in os.scandir(
        '{}/routes_test'.format(folder)) if entry.is_file()]
    i = 0
    for route in entries:
        for point in route[0]['features']:
            cur.execute("""
            INSERT INTO public."Route"(
            route_id, "order", distance, latitude, longitude, stop_id)
            VALUES (%s, %s, %s, %s, %s, %s);
            """,
                        (point['properties']['shape_id'], point['properties']['shape_pt_sequence'], point['properties']['shape_dist_traveled'], point['properties']['shape_pt_lat'],
                         point['properties']['shape_pt_lon'], '')
                        )
            i += 1
            # this will update the route with stops by finding route points that are within 10cm from stop location
    cur.execute("""
            UPDATE "Route"
            SET stop_id=subquery.stop_id
                FROM (
                select A.stop_id, B.route_id, B.order from "Stop" as A, "Route" as B where calculate_distance(A.latitude, A.longitude, B.latitude,B.longitude, 'K') < 0.01
                ) AS subquery
            WHERE "Route".route_id=subquery.route_id and "Route".order=subquery.order;
            """)

    print('Executed {} entries for stops'.format(i))


def insert_trips(folder):
    entries = [digest_trips(entry) for entry in os.scandir(
        '{}/trips'.format(folder)) if entry.is_file()]
    for file in entries:
        for entry in file:
            cur.execute("""
            INSERT INTO public."Trip"(
	        trip_id, route_id, shape_id, direction, bikes_allowed, headsign)
	        VALUES (%s, %s, %s, %s, %s, %s);""",
                        (entry['trip_id'], entry['route_id'], entry['shape_id'], get_bool_from_int_for_wheelchair(entry['direction_id']), get_bool_from_int_for_wheelchair(entry['bikes_allowed']),
                         entry['trip_headsign'])
                        )


if __name__ == '__main__':
    if len(sys.argv) < 1:
        print('Missing argument data folder')
        print('Correct usage is python3 digestor.py $data_folder')
        print('$data_folder is path to folder with following subfolders "vehicle_positions", "stops", "trips", "shapes"')
        exit(1)
    insert_vehicle_positions(sys.argv[0])
    insert_routes(sys.argv[0])
    insert_trips(sys.argv[0])
    insert_stops(sys.argv[0])
    conn.commit()
    conn.close()

import os
import json
import psycopg2
import sys
import insert_single_file from vehicle_position


# establishing connection to db
conn = psycopg2.connect(
    "host=localhost port=5432 dbname=pid-portal user=postgres password=passwd")
cur = conn.cursor()


def insert_vehicle_positions(folder):
    entries = []
    i = 0
    for entry in os.scandir('{}/vehicle_position/'.format(folder)):
        if entry.is_file():
            #data = digest(entry)
            # break
            print('Now working on file: {}'.format(entry))
            insert_single_file(digest(entry), folder)
            conn.commit()


def get_bool_from_int_for_wheelchair(bool_val):
    if bool_val == 1:
        return "1"
    else:
        return "0"


def digest_stops(file):
    f = open(file, 'r')
    data = [json.loads(line) for line in open(file, 'r')]
    #data = json.load(f)
    return data


def insert_stops(folder)
    entries = [digest_stops(entry) for entry in os.scandir('{}/stops'.format(folder)) if entry.is_file()]
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


def digest_routes(file):
    f = open(file, 'r')
    data = [json.loads(line) for line in open(file, 'r')]
    #data = json.load(f)
    return data





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
    conn.commit()
    print('Executed {} entries for stops'.format(i))


def digest_trips(file):
    f = open(file, 'r')
    data = [json.loads(line) for line in open(file, 'r')]
    #data = json.load(f)
    return data


def insert_trips(folder):
    def entries = [digest_trips(entry) for entry in os.scandir(
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
    conn.commit()



def digest_st_times(file):
    f = open(file, 'r')
    data = [json.loads(line) for line in open(file, 'r')]
    #data = json.load(f)
    return data

def insert_stop_times(folder):
    entries = [digest_st_times(entry) for entry in os.scandir('{}/stop_times'.format(folder)) if entry.is_file()]

    for file in entries:
        for entry in file:
            cur.execute("""
        INSERT INTO public.stop_time(
	trip_id, stop_id, sequence, arival_time, departure_time)
	VALUES (%s, %s, %s, %s, %s)
    ON CONFLICT (trip_id, stop_id, sequence) DO UPDATE 
  SET trip_id = excluded.trip_id, 
  stop_id = excluded.stop_id,
  sequence = excluded.sequence,
  arival_time = excluded.arival_time,
  departure_time = excluded.departure_time
  ;""", 
                    (entry['trip_id'], entry['stop_id'], entry['stop_sequence'], entry['arrival_time'],
                    entry['departure_time'])
                    )
    conn.commit()


def generate_route_sections()
    cur.execute("""
INSERT INTO public."Trip_sections" (source, destination, sequence, trip_id)
(select st1.stop_id as source, st2.stop_id as destination, st1.sequence, st1.trip_id
from "stop_time" as st1, "stop_time" as st2 
where st1.trip_id=st2.trip_id and st2.sequence = st1.sequence+1 
 
) on conflict DO NOTHING;
""")

    conn.commit()


if __name__ == '__main__':
    if len(sys.argv) < 1:
        print('Missing argument data folder')
        print('Correct usage is python3 digestor.py $data_folder')
        print('$data_folder is path to folder with following subfolders "vehicle_positions", "stops", "trips", "routes", "stop_times", "model"')
        print('for predictions the folder "model" has to contain prelearned prediction model dumped by pickle with filename "model.model"')
        exit(1)
    insert_vehicle_positions(sys.argv[0])
    insert_routes(sys.argv[0])
    insert_trips(sys.argv[0])
    insert_stops(sys.argv[0])
    insert_stop_times(sys.argv[0])
    generate_route_sections()
    conn.close()

import os 
import json
import psycopg2


def digest(file):
    f = open(file, 'r')
    data = [json.loads(line) for line in open(file, 'r')]
    #df = pd.read_json(file, lines=True)
    return data


if __name__ == '__main__':
    entries = [digest(entry) for entry in os.scandir('../../data/') if entry.is_file()]
    conn = psycopg2.connect("host=localhost port=5432 dbname=pid-portal user=postgres password=passwd")
    cur = conn.cursor()
    i = 0
    for line in entries[0]:
        for data in line['features']:
            cur.execute("""
                    INSERT INTO "Vehicle_position" (vehicle_id, timestamp, bearing, calculated_delay, speed, longitude, latitude)
                    VALUES (%s, %s, %s, %s, %s, %s, %s);
                    """,
                   (data['properties']['trip']['gtfs_route_id'],data['properties']['trip']['start_timestamp'], 
                    data['properties']['last_position']['bearing'], data['properties']['last_position']['delay'],
                    data['properties']['last_position']['speed'], data['properties']['last_position']['lng'], data['properties']['last_position']['lat']))
            i += 1
        conn.commit()
INSERT INTO "Route_sections" (source, destination, sequence, trip_id)
(select st1.stop_id as source, st2.stop_id as destination, st1.sequence, st1.trip_id
from "stop_time" as st1, "stop_time" as st2 
where st1.trip_id=st2.trip_id and st2.sequence = st1.sequence+1 
 
) on conflict DO NOTHING;
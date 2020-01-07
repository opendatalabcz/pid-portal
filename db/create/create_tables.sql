-- Table: public."Route"

-- DROP TABLE public."Route";

CREATE TABLE public."Route"
(
    route_id character varying(40) COLLATE pg_catalog."default" NOT NULL,
    "order" bigint NOT NULL,
    distance double precision,
    latitude double precision,
    longitude double precision,
    stop_id character varying(40) COLLATE pg_catalog."default",
    CONSTRAINT "Route_pkey" PRIMARY KEY (route_id, "order")
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public."Route"
    OWNER to postgres;


-- Table: public."Stop"

-- DROP TABLE public."Stop";

CREATE TABLE public."Stop"
(
    name character varying(100) COLLATE pg_catalog."default",
    latitude double precision,
    longitude double precision,
    zone_id character varying(40) COLLATE pg_catalog."default",
    wheelchair_acc boolean,
    stop_id character varying(40) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT stop_pkey PRIMARY KEY (stop_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public."Stop"
    OWNER to postgres;

-- Table: public."Tracked_routes"

-- DROP TABLE public."Tracked_routes";

CREATE TABLE public."Tracked_routes"
(
    user_id integer NOT NULL,
    route_id integer,
    CONSTRAINT "Tracked_routes_pkey" PRIMARY KEY (user_id),
    CONSTRAINT "Tracked_routes_route_id_key" UNIQUE (route_id)

)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public."Tracked_routes"
    OWNER to postgres;


-- Table: public."Tracked_stops"

-- DROP TABLE public."Tracked_stops";

CREATE TABLE public."Tracked_stops"
(
    user_id integer NOT NULL,
    stop_id integer,
    CONSTRAINT "Tracked_stops_pkey" PRIMARY KEY (user_id),
    CONSTRAINT "Tracked_stops_stop_id_key" UNIQUE (stop_id)

)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public."Tracked_stops"
    OWNER to postgres;


-- Table: public."Trip"

-- DROP TABLE public."Trip";

CREATE TABLE public."Trip"
(
    trip_id character varying(40) COLLATE pg_catalog."default" NOT NULL,
    route_id character varying(40) COLLATE pg_catalog."default",
    shape_id character varying(40) COLLATE pg_catalog."default",
    direction boolean,
    bikes_allowed boolean,
    headsign character varying(100) COLLATE pg_catalog."default",
    sum_delay bigint,
    n bigint,
    CONSTRAINT "Trip_pkey" PRIMARY KEY (trip_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public."Trip"
    OWNER to postgres;


-- Table: public."Trip_delay"

-- DROP TABLE public."Trip_delay";

CREATE TABLE public."Trip_delay"
(
    trip_id character varying(40) COLLATE pg_catalog."default" NOT NULL,
    day_nr bigint NOT NULL,
    avg_delay bigint,
    cnt bigint,
    CONSTRAINT "Trip_delays_pkey" PRIMARY KEY (trip_id, day_nr)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public."Trip_delay"
    OWNER to postgres;


-- Table: public."Trip_sections"

-- DROP TABLE public."Trip_sections";

CREATE TABLE public."Trip_sections"
(
    source character varying(40) COLLATE pg_catalog."default" NOT NULL,
    destination character varying(40) COLLATE pg_catalog."default" NOT NULL,
    sequence bigint,
    trip_id character varying(40) COLLATE pg_catalog."default" NOT NULL,
    last_delay bigint,
    avg_delay bigint,
    delay_counter bigint,
    CONSTRAINT "Route_sections_pkey" PRIMARY KEY (trip_id, source, destination)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public."Trip_sections"
    OWNER to postgres;


-- Table: public."User"

-- DROP TABLE public."User";

CREATE TABLE public."User"
(
    user_id integer NOT NULL,
    username character varying COLLATE pg_catalog."default",
    passwd character varying COLLATE pg_catalog."default",
    CONSTRAINT "User_pkey" PRIMARY KEY (user_id),
    CONSTRAINT "User_user_id_fkey" FOREIGN KEY (user_id)
        REFERENCES public."Tracked_routes" (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT "User_user_id_fkey1" FOREIGN KEY (user_id)
        REFERENCES public."Tracked_stops" (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public."User"
    OWNER to postgres;

-- Table: public."Vehicle"

-- DROP TABLE public."Vehicle";

CREATE TABLE public."Vehicle"
(
    vehicle_id character varying(40) COLLATE pg_catalog."default" NOT NULL,
    vehicle_type character varying(40) COLLATE pg_catalog."default",
    agency character varying(100) COLLATE pg_catalog."default",
    CONSTRAINT "Vehicle_pkey" PRIMARY KEY (vehicle_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public."Vehicle"
    OWNER to postgres;


-- FUNCTION: public.order_increment()

-- DROP FUNCTION public.order_increment();

CREATE FUNCTION public.order_increment()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$DECLARE
  v_order_inc int := 0;
BEGIN
  SELECT MAX("order") + 1 INTO v_order_inc FROM "Vehicle_positions" WHERE vehicle_id = NEW.vehicle_id;
  IF v_order_inc is null THEN
    NEW.order := 1;
  ELSE
    NEW.order := v_order_inc;
  END IF;
RETURN NEW;
END;
$BODY$;

ALTER FUNCTION public.order_increment()
    OWNER TO postgres;



-- Table: public."Vehicle_position"

-- DROP TABLE public."Vehicle_position";

CREATE TABLE public."Vehicle_position"
(
    latitude double precision,
    longitude double precision,
    "timestamp" timestamp without time zone,
    speed bigint,
    calculated_delay bigint,
    bearing bigint,
    vehicle_id character varying(20) COLLATE pg_catalog."default",
    "order" bigint NOT NULL DEFAULT nextval('"Vehicle_position_order_seq"'::regclass),
    trip_id character varying(40) COLLATE pg_catalog."default" NOT NULL,
    route_id character varying(40) COLLATE pg_catalog."default",
    is_canceled boolean,
    next_stop_id character varying(40) COLLATE pg_catalog."default",
    delay_stop_departure bigint,
    delay_stop_arrival bigint,
    distance_traveled double precision,
    predicted_delay bigint,
    CONSTRAINT "Vehicle_position_pkey" PRIMARY KEY ("order", trip_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public."Vehicle_position"
    OWNER to postgres;


-- Table: public."Vehicle_positions"

-- DROP TABLE public."Vehicle_positions";

CREATE TABLE public."Vehicle_positions"
(
    trip_id character varying(40) COLLATE pg_catalog."default" NOT NULL,
    "order" bigint NOT NULL DEFAULT nextval('"Vehicle_position_order_seq"'::regclass),
    latitude double precision,
    longitude double precision,
    "timestamp" timestamp without time zone NOT NULL,
    speed bigint,
    calculated_delay bigint,
    bearing bigint,
    vehicle_id character varying(40) COLLATE pg_catalog."default",
    route_id character varying(40) COLLATE pg_catalog."default",
    delay_stop_departure bigint,
    delay_stop_arrival bigint,
    distance_traveled double precision,
    next_stop_id character varying(40) COLLATE pg_catalog."default",
    is_canceled boolean,
    CONSTRAINT "Vehicle_positions_pkey" PRIMARY KEY (trip_id, "order", "timestamp")
) PARTITION BY RANGE ("timestamp") 
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public."Vehicle_positions"
    OWNER to postgres;

-- Partitions SQL

CREATE TABLE public.positions_01112019 PARTITION OF public."Vehicle_positions"
    FOR VALUES FROM ('2019-11-01 00:00:00') TO ('2019-11-10 00:00:00');

CREATE TABLE public.positions_11112019 PARTITION OF public."Vehicle_positions"
    FOR VALUES FROM ('2019-11-10 00:00:00') TO ('2019-11-20 00:00:00');

CREATE TABLE public.positions_20112019 PARTITION OF public."Vehicle_positions"
    FOR VALUES FROM ('2019-11-20 00:00:00') TO ('2019-11-30 00:00:00');

CREATE TABLE public.positions_30112019 PARTITION OF public."Vehicle_positions"
    FOR VALUES FROM ('2019-11-30 00:00:00') TO ('2019-12-01 00:00:00');

CREATE TABLE public.positions_31102019 PARTITION OF public."Vehicle_positions"
    FOR VALUES FROM ('2019-10-31 00:00:00') TO ('2019-11-01 00:00:00');


-- Table: public.stop_time

-- DROP TABLE public.stop_time;

CREATE TABLE public.stop_time
(
    trip_id character varying(40) COLLATE pg_catalog."default" NOT NULL,
    stop_id character varying(40) COLLATE pg_catalog."default" NOT NULL,
    sequence bigint NOT NULL,
    arival_time character varying(40) COLLATE pg_catalog."default",
    departure_time character varying(40) COLLATE pg_catalog."default",
    CONSTRAINT stop_time_pkey PRIMARY KEY (trip_id, stop_id, sequence)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.stop_time
    OWNER to postgres;
CREATE TABLE "Route" (
  "route_id" int PRIMARY KEY,
  "vehlicle_type" varchar
);

CREATE TABLE "Route_points" (
  "route_id" int PRIMARY KEY,
  "order" int PRIMARY KEY,
  "stop_id" varchar,
  "latitude" float,
  "longitude" float
);

CREATE TABLE "Stop" (
  "stop_id" int PRIMARY KEY,
  "name" varchar
);

CREATE TABLE "Vehicle" (
  "vehicle_id" int PRIMARY KEY,
  "route_id" int
);

CREATE TABLE "Vehicle_position" (
  "vehicle_id" int PRIMARY KEY,
  "order" int PRIMARY KEY,
  "latitude" float,
  "longitude" float
);

CREATE TABLE "User" (
  "user_id" int PRIMARY KEY,
  "username" varchar,
  "passwd" varchar
);

CREATE TABLE "Tracked_routes" (
  "user_id" int PRIMARY KEY,
  "route_id" int PRIMARY KEY
);

CREATE TABLE "Tracked_stops" (
  "user_id" int PRIMARY KEY,
  "stop_id" int PRIMARY KEY
);

ALTER TABLE "Route_points" ADD FOREIGN KEY ("route_id") REFERENCES "Route" ("route_id");

ALTER TABLE "Vehicle_position" ADD FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle" ("vehicle_id");

ALTER TABLE "Vehicle" ADD FOREIGN KEY ("route_id") REFERENCES "Route" ("route_id");

ALTER TABLE "Route_points" ADD FOREIGN KEY ("stop_id") REFERENCES "Stop" ("stop_id");

ALTER TABLE "User" ADD FOREIGN KEY ("user_id") REFERENCES "Tracked_routes" ("user_id");

ALTER TABLE "Route" ADD FOREIGN KEY ("route_id") REFERENCES "Tracked_routes" ("route_id");

ALTER TABLE "User" ADD FOREIGN KEY ("user_id") REFERENCES "Tracked_stops" ("user_id");

ALTER TABLE "Stop" ADD FOREIGN KEY ("stop_id") REFERENCES "Tracked_stops" ("stop_id");
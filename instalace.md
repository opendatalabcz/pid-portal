# Instalace pid-portal

## Potřebné nástroje
1. nainstalujeme PostgreSQL11, node.js, python3
   
## Inicializace databáze
1. ve složce db/create nalezneme 2 sql scripty
2. spustíme script create_chema.sql
3. spustíme script create_tables.sql

## Nahrání dat 
1. Soubory s daty musí být nahrány v jedné složce s danými podložkami, "vehicle_positions", "stops", "trips", "routes", "stop_times", "model", 
   v podložce model musí být soubor s naučeným modelem exportovaným do formátu pickle 
2. pro spuštění python skriptu je třeba nainstalovat knihovnu psycopg2
3. spuštěním skriptu /data-digest/digestor/digestor.py zde je parametrem cesta ke složce z kroku 1
4. dojde postupně ke zpracování a nahrání všech záznamů do databáze

## Spuštění backendové webové služby
1. spustíme node server pomocí node ./app/backend/server.js {ip adresa postgreSQL serveru}

## Spuštění frontend serveru
1. přejdeme do složky ./app/pid-portal
2. spustíme příkaz npm start
3. může se stát že nám backendová služba běží na stejném portu jako frontend,
  v tom případě si bude npm stěžovat, ale stačí potvrdit jiný port 
4. mělo by se otevřít okno prohlížeče s aplikací a měly by se načíst aktuální polohy vozidel z databáze
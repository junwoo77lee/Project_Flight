from flask import Flask, current_app, render_template, redirect #, jsonify
import ujson as json
# from json import dumps
from flask_pymongo import PyMongo
import pymongo
import pandas as pd
import requests
import os
import re
from collections import defaultdict
api_key = os.environ.get('FLIGHT_API_KEY', '')
# This allows "requests" module to access local server
# os.environ['NO_PROXY'] = '127.0.0.1'

# Create an instance of Flask
app = Flask(__name__)
# app.config['JSON_SORT_KEYS'] = False
# app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False


def jsonify(*args, **kwargs):
    if args and kwargs:
        raise TypeError('jsonify() behavior undefined when passed both args and kwargs')
    elif len(args) == 1:  # single args are passed directly to dumps()
        data = args[0]
    else:
        data = args or kwargs

    return current_app.response_class(
        json.dumps(data) + '\n',
        mimetype=current_app.config['JSONIFY_MIMETYPE']
    )

# Use PyMongo to establish Mongo connection
mongo = PyMongo(app, uri="mongodb://localhost:27017/flight_app")


# This project will refer to the Top 61 US airports from wikipedia
major_airports = {'ABQ', 'ANC', 'ATL', 'AUS', 'BDL', 'BHM', 'BNA', 'BOS', 'BUF', 'BUR', 'BWI', 'CLE', 'CLT', 'CMH', 'CVG', 'DAL', 'DCA', 'DEN', 'DFW', 'DTW', 'EWR', 'FLL', 'HNL', 'HOU', 'IAD', 'IAH', 'IND', 'JAX', 'JFK',
                  'LAS', 'LAX', 'LGA', 'MCI', 'MCO', 'MDW', 'MIA', 'MKE', 'MSP', 'MSY', 'OAK', 'OGG', 'OMA', 'ONT', 'ORD', 'PBI', 'PDX', 'PHL', 'PHX', 'PIT', 'RDU', 'RSW', 'SAN', 'SAT', 'SEA', 'SFO', 'SJC', 'SLC', 'SMF', 'SNA', 'STL', 'TPA'}


# def make_references(parse_type):  # parse_type is either airport, city, or both

#     # if SQL
#     # SELECT adb.codeIataAirport, adb.codeIataCity, adb.nameAirport,
#     #        adb.timezone, adb.longitudeAirport, adb.latitudeAirport
#     # FROM airport_db ad
#     #   Join major_airport ma IN adb.airport_id = ma.airport_id
#     # WHERE adb.airport_id = ma.airport_id

#     if parse_type == "airport":
#         # data from airport information API
#         airport_url = 'http://aviation-edge.com/v2/public/airportDatabase'
#         ap_params = {'key': api_key}
#         airport_json = requests.get(airport_url, params=ap_params).json()

# # { "nameAirport" : "Andrews AFB", "codeIataAirport" : "ADW", "latitudeAirport" : "38.816666",
# #  "longitudeAirport" : "-76.86667", "timezone" : "America/New_York", "codeIataCity" : "ADW" }


#         airport_data = mongo.db.airport.find( {"nameCountry": "United States"},                                                                                        
#                                               {"_id": 0, "airportId": 0, "codeIcaoAirport": 0,
#                                                "geonameId": 0, "GMT": 0, "phone": 0, "codeIso2Country": 0,
#                                                "nameCountry": 0})
        
#         airport_coords = {}
#         airport_names = {}
#         airport_timezone = {}
#         airport_city = {}
#         for airport in airport_data:
#             airport_code = airport.get('codeIataAirport')

#             if airport_code in major_airports:
#                 # Airport coordinates
#                 airport_coords[airport_code] = [float(airport.get('longitudeAirport')),
#                                                 float(airport.get('latitudeAirport'))]

#                 # Airport name
#                 if airport_code == 'PBI':
#                     airport_names[airport_code] = "Palm Beach International"
#                 else:
#                     airport_names[airport_code] = airport.get(
#                         'nameAirport') + ' Airport'

#                 # Airport timezone
#                 airport_timezone[airport_code] = airport.get('timezone')

#                 # Airport citycode
#                 airport_city[airport_code] = airport.get('codeIataCity')



#         return airport_json, airport_coords, airport_names, airport_timezone, airport_city

#     elif parse_type == "city":
#         # data from city information API
#         city_url = "http://aviation-edge.com/v2/public/cityDatabase"
#         ct_params = {"key": api_key}
#         city_json = requests.get(city_url, params=ct_params).json()

#         # For US city-state mapping: source > Wikipedia
#         df_city_state_pairs = pd.read_html(
#             "https://en.wikipedia.org/wiki/List_of_United_States_cities_by_population")[4]
#         df_city_state_pairs['City'] = df_city_state_pairs['City'].map(lambda x: re.sub(
#             r'\[.+]', '', x)).map(lambda x: x.lower()).map(lambda x: x.replace('.', ''))
#         df_city_state = df_city_state_pairs[['City', 'State[c]']].rename(
#             columns={'State[c]': 'State'})
#         # ex.) {'State': {'New York': 'New York'} }
#         city_state_dict = df_city_state.set_index('City').to_dict()
#         # hardcoding for missing values
#         city_state_dict['State'].update(
#             {'windsor locks': 'Conneticut', 'covington': 'Kentucky', 'maui': 'Hawaii', 'fort myers': 'Florida'})

#         return city_json, city_state_dict

#     elif parse_type == "both":
#         # get airport data
#         airport_json, airport_coords, airport_names, _, _ = make_references(
#             "airport")

#         # get city data
#         city_json, city_state_dict = make_references("city")

#         # For getting airport name with city/state information
#         city_names = {}
#         for airport in airport_json:
#             for city in city_json:
#                 airport_code = airport.get('codeIataAirport')
#                 airport_city = airport.get('codeIataCity')
#                 city_code = city.get('codeIataCity')
#                 city_name = city.get('nameCity')

#                 if airport_city == city_code:
#                     city_state = f"{city_name} / {city_state_dict['State'].get(city_name.lower())}"
#                     city_names[airport_code] = city_state

#         return airport_names, airport_coords, city_names


@app.route("/")
def home():

    return render_template("index.html")

@app.route("/airport-timetable")
def keit_page():

    return render_template("keit.html")

@app.route("/airport_coords")
def get_airport_coords():

    cursor = mongo.db.references.find({}, { "_id" : 0 })
    for d in cursor:
        reference_dict = d # only one, but huge documentation 

    results = [{'airport_iatacode': airport, 'airport_coords': coord}
               for airport, coord in reference_dict['airport_coords'].items()]

    return jsonify(results)


@app.route("/summary-multivariate-chart/<airport>")
def summary_multivariate(airport):

    #     # date,  duration, distance, origin, destination
    #     # 01010001, 14,      405,      MCI,     MDW

    data_filtered = mongo.db.timetable.find({"$or": [{"departure.iataCode": airport},
                                                     {"arriaval.iataCode": airport}
                                                     ]
                                             }, {"_id": 0})
    result_json = list(data_filtered)

    cursor = mongo.db.references.find({}, { "_id" : 0 })
    for d in cursor:
        reference_dict = d # only one, but huge documentation 

    results = []
    for flight in result_json:
        departure_airport = flight.get('departure').get('iataCode')
        arrival_airport = flight.get('arrival').get('iataCode')

        # if (airport == departure_airport):
        departure_time = flight.get('departure').get('scheduledTime')
        departure_timezone = reference_dict['airport_timezone'][departure_airport]
        arrival_time = flight.get('arrival').get('scheduledTime')
        arrival_timezone = reference_dict['airport_timezone'][arrival_airport]
        # else: # (airport == arrival_airport):

        departure_coords = reference_dict['airport_coords'][departure_airport]
        arrival_coords = reference_dict['airport_coords'][arrival_airport]

        results.append({
            "origin" : departure_airport,
            "origin_coords" : departure_coords,
            "origin_date" : departure_time,
            "origin_timezone" : departure_timezone,
            "destination" : arrival_airport,
            "destination_coords" : arrival_coords,
            "destination_date" : arrival_time,
            "destination_timezone" : arrival_timezone
        })

    return jsonify(results)


@app.route("/hierarchical-summary/<airport>")
def summary_hierarchy(airport):

    data_filtered = mongo.db.timetable.find({"$or": [{"departure.iataCode": airport},
                                                     {"arrival.iataCode": airport}
                                                     ]
                                             }, {"_id": 0})
    resp_json = list(data_filtered)

    inbound_airports = []
    outbound_airports = []
    inbound_airlines = []
    outbound_airlines = []
    inbound_delays = []
    outbound_delays = []

    for route in resp_json:
        inbound = route.get('arrival').get('iataCode')
        outbound = route.get('departure').get('iataCode')

        if (airport == inbound):
            origin_for_inbound = outbound
            inbound_airline = route.get('airline').get('name')

            inbound_airports.append(origin_for_inbound)
            inbound_airlines.append(inbound_airline)
            delay = route.get('arrival').get('delay')

            if delay:
                delay = int(delay)
                if (delay > 60):
                    delay = "delay > 60"
                elif (30 <= delay <= 60):
                    delay = "30 ≤ delay ≤ 60"
                elif (delay < 30):
                    delay = "delay < 30"
                else:  # delay is null
                    pass
                inbound_delays.append(delay)
            else:
                inbound_delays.append(delay)

        else:  # airport != inbound (== outbound)
            destination_for_outbound = inbound
            outbound_airline = route.get('airline').get('name')

            outbound_airports.append(destination_for_outbound)
            outbound_airlines.append(outbound_airline)
            delay = route.get('arrival').get('delay')

            if delay:
                delay = int(delay)
                if (delay > 60):
                    delay = "delay > 60"
                elif (30 <= delay <= 60):
                    delay = "30 ≤ delay ≤ 60"
                elif (delay < 30):
                    delay = "delay < 30"
                else:  # delay is null
                    pass
                outbound_delays.append(delay)
            else:
                outbound_delays.append(delay)

    # check if they don't have the same length
    assert (len(inbound_airports) == len(inbound_airlines)) and (
        len(inbound_airlines) == len(inbound_delays))
    assert (len(outbound_airports) == len(outbound_airlines)) and (
        len(outbound_airlines) == len(outbound_delays))

    # set parent category to have the same amount of element as their children
    inbound_parent = ["inbound" for _ in range(len(inbound_airports))]
    outbound_parent = ["outbound" for _ in range(len(outbound_airports))]

    def make_rawdata(parent, airports, airlines, delays):
        to_dataframe = []
        for parent, airport, airline, delay in zip(parent, airports, airlines, delays):
            to_dataframe.append(
                {"parent": parent,
                 "airport": airport,
                 "airline": airline,
                 "delay": delay})

        df = pd.DataFrame.from_records(to_dataframe)
        df['delay'] = df['delay'].map(lambda x: x if x is not None else "N/A")
        df_modified = df.groupby(['parent', 'airport', 'airline', 'delay']).agg(
            {'delay': 'count'}).sort_values(by=['airport', 'airline'])
        df_modified = df_modified.rename(
            columns={"delay": "count"}).reset_index()

        master_dict = {}
        for row in df_modified.itertuples():
            master_dict[(row[1], row[2], row[3], row[4])] = master_dict.get(
                (row[1], row[2], row[3], row[4]), 0) + row[5]

        # reassign key : value pairs from the master_dict
        def rearrange_key_value_pairs(input_dict):
            temp_dict = defaultdict(list)
            for key, value in input_dict.items():
                last_index = len(key) - 1
                if last_index > 0:
                    k = tuple(x for x in key if key.index(x) < last_index)
                    temp_dict[k].append({key[last_index]: value})
                else:
                    return input_dict
            return rearrange_key_value_pairs(temp_dict)

        intermediate_dict = rearrange_key_value_pairs(master_dict)

        temp1_list = []
        for _, item in enumerate(*intermediate_dict.values()):
            children = []
            for key, value in item.items():
                children.append(value)
                temp1_list.append({"name": key, "children": value})

        temp2_list = []
        for item in temp1_list:  # a dictionary
            #     for key, value in item.items(): # a dictionary
            children = []
            for key, value in item.items():
                if key == 'name':
                    temp = {"name": value, "children": []}   # "ABQ"
                else:  # children
                    for airline in value:
                        for k1, v1 in airline.items():
                            temp2 = {"name": k1, "children": []}

                            for delay in v1:
                                for k2, v2 in delay.items():
                                    temp3 = {"name": k2, "value": v2}
                                    temp2['children'].append(temp3)
                            temp['children'].append(temp2)
            temp2_list.append(temp)
        return temp2_list

    inbound_children = make_rawdata(
        inbound_parent, inbound_airports, inbound_airlines, inbound_delays)
    outbound_children = make_rawdata(
        outbound_parent, outbound_airports, outbound_airlines, outbound_delays)
    results_dict = {"name": airport, "children": [{"name": "INBOUND",
                                                   "children": inbound_children},
                                                  {"name": "OUTBOUND",
                                                   "children": outbound_children}
                                                  ]
                    }

    return jsonify(results_dict)


# Route that will store airport time-table data from Aviation Edge API to MongoDB
@app.route("/store-data")
def store_data():
    # get a dataset from timetable API with certain parameters
    timetable_url = 'http://aviation-edge.com/v2/public/timetable'
    tt_params = {'key': api_key,
                 'codeshared': 'Null',
                 'type': 'arrival'
                 }
    timetable_json = requests.get(timetable_url, params=tt_params).json()

    results = []
    cursor = mongo.db.references.find({}, { "_id" : 0 })
    for d in cursor:
        reference_dict = d # only one, but huge documentation 

    for schedule in timetable_json:

        depart_airport = schedule.get('departure').get('iataCode')
        arrival_airport = schedule.get('arrival').get('iataCode')

        if (depart_airport in major_airports) and (arrival_airport in major_airports):

            # for airport in airport_json:
            # if depart_airport == airport.get('codeIataAirport'):
            # schedule['departLat'] = float(
            #     airport.get('latitudeAirport'))
            schedule['departLat'] = reference_dict['airport_coords'][depart_airport][1]
            schedule['departLon'] = reference_dict['airport_coords'][depart_airport][0]

            schedule['departAirportTimezone'] = reference_dict['airport_timezones'][depart_airport]
            schedule['departCityCode'] = reference_dict['airport_cities'][depart_airport]

        # elif arrival_airport == airport.get('codeIataAirport'):
            # schedule['arrivalLat'] = float(
            #     airport.get('latitudeAirport'))
            # schedule['arrivalLon'] = float( 
            #     airport.get('longitudeAirport'))
            schedule['arrivalLat'] = reference_dict['airport_coords'][arrival_airport][1]
            schedule['arrivalLon'] = reference_dict['airport_coords'][arrival_airport][0]

            schedule['arrivalAirportTimezone'] = reference_dict['airport_timezones'][arrival_airport]
            schedule['arrivalCityCode'] = reference_dict['airport_cities'][arrival_airport]

            results.append(schedule)

    # insert the modified dataset to the MongoDB
    myclient = pymongo.MongoClient("mongodb://localhost:27017/")
    mydb = myclient["flight_app"]
    mycol = mydb["timetable"]

    mycol.create_index([("arrival", pymongo.ASCENDING),
                        ("departure", pymongo.ASCENDING),
                        ("airline", pymongo.ASCENDING),
                        ("flight", pymongo.ASCENDING),
                        ("codeshared", pymongo.ASCENDING),
                        ("type", pymongo.ASCENDING)
                        ], unique=True)

    count_insert = 0
    count_update = 0
    for data in results:
        try:
            # assuming that only no codeshared flight is a real one.
            data_insertion = mycol.insert_one(data)

            if (data_insertion.inserted_id):
                count_insert += 1

        except:  # if the duplicate found (status would be different)
            # if 'status' is different to an existing document

            cursor = mycol.find({"arrival": data.get("arrival"),
                                 "departure": data.get("departure"),
                                 "airline": data.get("airline"),
                                 "flight": data.get("flight"),
                                 "codeshared": data.get("codeshared")},
                                {"_id": 1})
            status = {"$set": {"status": data.get("status")}}

            for update in cursor:
                data_update = mycol.update_one(update, status)

                if (data_update.modified_count != 0):
                    count_update += data_update.modified_count

    return f"Posting Done. (insert: {count_insert} / update: {count_update} records)"



# Trim the stored data to easily visualize the arcs between source and target airports
@app.route("/summarize-timetable-slim")
def summarize_timetable_slim():

    resp_json = mongo.db.timetable.find(
        {}, {"departure.iataCode": 1, "arrival.iataCode": 1, "_id": 0})

    # results is a dictionary of dictionaries
    counts = {}
    # results = []
    for flight in resp_json:
        departure_airport = flight.get('departure').get('iataCode')
        arrival_airport = flight.get('arrival').get('iataCode')
        route = f'{departure_airport}-{arrival_airport}'
        counts[route] = counts.get(route, 0) + 1

    cursor = mongo.db.references.find({}, { "_id" : 0 })
    for d in cursor:
        reference_dict = d # only one, but huge documentation 
    
    # refernce_dict has 5 keys:
    # "airport_name", "airport_coords", "airport_city", "airport_timezone", "city_names"

    results = []
    for route, flight_counts in counts.items():
        departure = route.split('-')[0]
        arrival = route.split('-')[1]

        results.append({
            'departure': departure,
            'departure_name': reference_dict['airport_names'][departure],
            'departure_city': reference_dict['city_names'][departure],
            'departure_coords': reference_dict['airport_coords'][departure],
            'arrival': arrival,
            'arrival_name': reference_dict['airport_names'][arrival],
            'arrival_city': reference_dict['city_names'][arrival],
            'arrival_coords': reference_dict['airport_coords'][arrival],
            'flights': flight_counts
        })

    results = sorted(results, key=lambda x: x['departure'])

    return jsonify(results)


@app.route("/summarize-timetable")
def summarize_timetable():

    resp_json = mongo.db.timetable.find({}, {"_id": 0})

    # results is a dictionary of dictionaries
    counts = {}
    for flight in resp_json:
        departure_airport = flight.get('departure').get('iataCode')
        arrival_airport = flight.get('arrival').get('iataCode')
        route = f'{departure_airport}-{arrival_airport}'
        counts[route] = counts.get(route, 0) + 1

    cursor = mongo.db.references.find({}, { "_id" : 0 })
    for d in cursor:
        reference_dict = d # only one, but huge documentation 

    results = []
    for route, flight_counts in counts.items():
        departure = route.split('-')[0]
        arrival = route.split('-')[1]

        results.append({
            'departure': departure,
            'departure_name': reference_dict['airport_names'][departure],
            'departure_city': reference_dict['city_names'][departure],
            'departure_coords': reference_dict['airport_coords'][departure],
            'arrival': arrival,
            'arrival_name': reference_dict['airport_names'][arrival],
            'arrival_city': reference_dict['city_names'][arrival],
            'arrival_coords': reference_dict['airport_coords'][arrival],
            'flights': flight_counts
        })

    results = sorted(results, key=lambda x: x['departure'])

    return jsonify(results)


@app.route("/post-references")
def post_references():

    # AIRPORT reference
    airport_url = 'http://aviation-edge.com/v2/public/airportDatabase'
    ap_params = {'key': api_key}
    airport_json = requests.get(airport_url, params=ap_params).json()

    airport_coords = {}
    airport_names = {}
    airport_timezone = {}
    airport_cities = {}
    for airport in airport_json:
        airport_code = airport.get('codeIataAirport')

        if airport_code in major_airports:
            # Airport coordinates
            airport_coords[airport_code] = [float(airport.get('longitudeAirport')),
                                            float(airport.get('latitudeAirport'))]

            # Airport name
            if airport_code == 'PBI':
                airport_names[airport_code] = "Palm Beach International"
            else:
                airport_names[airport_code] = airport.get(
                    'nameAirport') + ' Airport'

            # Airport timezone
            airport_timezone[airport_code] = airport.get('timezone')

            # Airport citycode
            airport_cities[airport_code] = airport.get('codeIataCity')


    # CITY reference
    city_url = "http://aviation-edge.com/v2/public/cityDatabase"
    ct_params = {"key": api_key}
    city_json = requests.get(city_url, params=ct_params).json()

    # For US city-state mapping: source > Wikipedia
    df_city_state_pairs = pd.read_html(
        "https://en.wikipedia.org/wiki/List_of_United_States_cities_by_population")[4]
    df_city_state_pairs['City'] = df_city_state_pairs['City'].map(lambda x: re.sub(
        r'\[.+]', '', x)).map(lambda x: x.lower()).map(lambda x: x.replace('.', ''))
    df_city_state = df_city_state_pairs[['City', 'State[c]']].rename(
        columns={'State[c]': 'State'})
    # ex.) {'State': {'New York': 'New York'} }
    city_state_dict = df_city_state.set_index('City').to_dict()
    # hardcoding for missing values
    city_state_dict['State'].update(
        {'windsor locks': 'Conneticut', 'covington': 'Kentucky', 'maui': 'Hawaii', 'fort myers': 'Florida'})

    city_names = {}
    for airport in airport_json:
        for city in city_json:
            airport_code = airport.get('codeIataAirport')
            airport_city = airport.get('codeIataCity')
            city_code = city.get('codeIataCity')
            city_name = city.get('nameCity')

            if airport_code in major_airports:
                if airport_city == city_code:
                    city_state = f"{city_name} / {city_state_dict['State'].get(city_name.lower())}"
                    city_names[airport_code] = city_state


    reference_dict = {"airport_names" : airport_names,
                      "airport_coords" : airport_coords,    
                      "airport_cities" : airport_cities,
                      "airport_timezones" : airport_timezone,
                      "city_names" : city_names}
    
    # insert to the Mongo database
    myclient = pymongo.MongoClient("mongodb://localhost:27017/")
    mydb = myclient["flight_app"]
    mycol = mydb["references"]

    mycol.insert_one(reference_dict)

    return "Posting Done."


@app.route("/post-flighttracker")
def post_flight_tracker():

    base_url = 'http://aviation-edge.com/v2/public/flights'
    params = {'key': api_key,
              'depIata': 'DEN'
              }

    result_json = requests.get(base_url, params=params).json()

    # insert to the Mongo database
    myclient = pymongo.MongoClient("mongodb://localhost:27017/")
    mydb = myclient["flight_app"]
    mycol = mydb["flighttracker"]

    mycol.create_index([("aircraft", pymongo.ASCENDING),
                        ("airline", pymongo.ASCENDING),
                        ("arrival", pymongo.ASCENDING),
                        ("departure", pymongo.ASCENDING),
                        ("flight", pymongo.ASCENDING),
                        ("geography", pymongo.ASCENDING),
                        ("speed", pymongo.ASCENDING),
                        ("status", pymongo.ASCENDING),
                        ("system", pymongo.ASCENDING)
                        ], unique=True)

    for data in result_json:
        try:
            mycol.insert_one(data)
        except:
            pass

    return "Posting Done."


# @app.route("/get-flighttracker")
# def get_flight_tracker():

#     results = []
#     flights = mongo.db.flighttracker.find({}, {"_id": 0})

#     for flight in flights:
#         # flight['_id'] = str(flight['_id'])
#         results.append(flight)

#     return jsonify(results)


@app.route("/post-airportinfo")
def post_airport():

    base_url = 'http://aviation-edge.com/v2/public/airportDatabase'
    params = {'key': api_key}

    result_json = requests.get(base_url, params=params).json()

    # insert to the Mongo database
    myclient = pymongo.MongoClient("mongodb://localhost:27017/")
    mydb = myclient["flight_app"]
    mycol = mydb["airport"]

    mycol.create_index([("airportId", pymongo.ASCENDING),
                        ("nameAirport", pymongo.ASCENDING),
                        ("codeIataAirport", pymongo.ASCENDING),
                        ("codeIcaoAirport", pymongo.ASCENDING)
                        ], unique=True)

    for data in result_json:
        # if (data.get('nameCountry') == 'United States'):
        try:
            mycol.insert_one(data)
        except:
            pass

    return "Posting Done."


@app.route("/get-airportinfo")
def get_airport():

    results = []
    airports = mongo.db.airport.find({}, {"_id": 0})

    for airport in airports:
        # airport['_id'] = str(airport['_id'])
        results.append(airport)

    return jsonify(results)


@app.route("/post-cityinfo")
def post_city():

    base_url = 'http://aviation-edge.com/v2/public/cityDatabase'
    params = {'key': api_key}

    result_json = requests.get(base_url, params=params).json()

    # insert to the Mongo database
    myclient = pymongo.MongoClient("mongodb://localhost:27017/")
    mydb = myclient["flight_app"]
    mycol = mydb["city"]

    mycol.create_index([("cityId", pymongo.ASCENDING)], unique=True)

    for data in result_json:
        # if (data.get('nameCountry') == 'United States'):
        try:
            mycol.insert_one(data)
        except:
            pass

    return "Posting Done."


# May not be used anymore
@app.route("/get-storeddata/<airport>")
def get_storeddata(airport):
    # <airport> is either "total" or airport iata code (ex. "DEN")

    if (airport == "total"):
        data = mongo.db.timetable.find({}, {"_id": 0})
        return jsonify(list(data))

    else:
        data_filtered = mongo.db.timetable.find({"$or": [{"departure.iataCode": airport},
                                                         {"arrival.iataCode": airport}
                                                         ]
                                                 }, {"_id": 0})
        return jsonify(list(data_filtered))
        # data_as_str = json.dumps(results)
        # return Response(response=data_as_str, status=200, mimetype="application/json")



# # Route that will trigger the scrape function
# @app.route("/post-timetable")
# def post_timetable():
#     # Get dataset for both arrival and departure
#     base_url = 'http://aviation-edge.com/v2/public/timetable'
#     params = {'key': api_key,
#               #   'iataCode': 'DEN'
#               'codeshared': 'Null',
#               'type': 'arrival'
#               }

#     result_json = requests.get(base_url, params=params).json()

#     # insert to the Mongo database
#     myclient = pymongo.MongoClient("mongodb://localhost:27017/")
#     mydb = myclient["flight_app"]
#     mycol = mydb["timetable"]
#     # x = mycol.insert_many(result_json)

#     mycol.create_index([("arrival", pymongo.ASCENDING),
#                         ("departure", pymongo.ASCENDING),
#                         ("airline", pymongo.ASCENDING),
#                         ("flight", pymongo.ASCENDING),
#                         ("codeshared", pymongo.ASCENDING),
#                         ("type", pymongo.ASCENDING)
#                         ], unique=True)

#     for data in result_json:
#         # if data.get('codeshared') is None:
#         try:
#             # assuming that only no codeshared flight is a real one.
#             mycol.insert_one(data)
#         except:  # if the duplicate found (status would be different)
#             # if 'status' is different to an existing document

#             cursor = mycol.find({"arrival": data.get("arrival"),
#                                  "departure": data.get("departure"),
#                                  "airline": data.get("airline"),
#                                  "flight": data.get("flight"),
#                                  "codeshared": data.get("codeshared")},
#                                 {"_id": 1})
#             status = {"$set": {"status": data.get("status")}}

#             for update in cursor:
#                 mycol.update_one(update, status)

#     return f"Posting Done. ({len(result_json)} records)"


# @app.route("/get-timetable")
# def get_timetable():

#     results = []
#     timetable = mongo.db.timetable.find({}, {"_id": 0})

#     for schedule in timetable:
#         # schedule['_id'] = str(schedule['_id'])
#         results.append(schedule)

#     return jsonify(results)



if __name__ == "__main__":
    app.run(debug=True)

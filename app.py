from flask import Flask, render_template, redirect, jsonify, json
from flask_pymongo import PyMongo
import pymongo
import requests
import os

from collections import defaultdict, Counter


api_key = os.environ.get('FLIGHT_API_KEY', '')
# This allows "requests" module to access local server
# os.environ['NO_PROXY'] = '127.0.0.1'

# Create an instance of Flask
app = Flask(__name__)

# Use PyMongo to establish Mongo connection
mongo = PyMongo(app, uri="mongodb://localhost:27017/flight_app")


# to be used as a global object
airport_url = 'http://aviation-edge.com/v2/public/airportDatabase'
ap_params = {'key': api_key}
airport_json = requests.get(airport_url, params=ap_params).json()

# for quick search: O(1)
airport_ref = {}
airport_coords = {}
for airport in airport_json:
    airport_ref[airport.get('codeIataAirport')
                ] = airport.get('codeIso2Country')
    airport_coords[airport.get('codeIataAirport')] = [float(airport.get('longitudeAirport')),
                                                      float(airport.get('latitudeAirport'))]


# Route to render index.html template using data from Mongo
@app.route("/")
def home():

    # Find one record of data from the mongo database
    #

    # Return template and data
    # render_template("index.html", vacation=destination_data)
    return render_template("index.html")

# Route that will trigger the scrape function
@app.route("/store-data")
def store_data():
    # get a dataset from timetable API with certain parameters
    timetable_url = 'http://aviation-edge.com/v2/public/timetable'
    tt_params = {'key': api_key,
                 #   'iataCode': 'DEN'
                 'codeshared': 'Null',
                 'type': 'arrival'
                 }
    timetable_json = requests.get(timetable_url, params=tt_params).json()

    # get a airport information dataset to join with the dataset from above
    # in order to filter out non-US airports
    # airport_url = 'http://aviation-edge.com/v2/public/airportDatabase'
    # ap_params = {'key': api_key}
    # airport_json = requests.get(airport_url, params=ap_params).json()

    # # for quick search: O(1)
    # airport_ref = {}
    # for airport in airport_json:
    #     airport_ref[airport.get('codeIataAirport')] = airport.get('codeIso2Country')

    # US 61 busiest airports from wikipedia
    major_airports = {'ABQ', 'ANC', 'ATL', 'AUS', 'BDL', 'BHM', 'BNA', 'BOS', 'BUF', 'BUR', 'BWI', 'CLE', 'CLT', 'CMH', 'CVG', 'DAL', 'DCA', 'DEN', 'DFW', 'DTW', 'EWR', 'FLL', 'HNL', 'HOU', 'IAD', 'IAH', 'IND', 'JAX', 'JFK',
                      'LAS', 'LAX', 'LGA', 'MCI', 'MCO', 'MDW', 'MIA', 'MKE', 'MSP', 'MSY', 'OAK', 'OGG', 'OMA', 'ONT', 'ORD', 'PBI', 'PDX', 'PHL', 'PHX', 'PIT', 'RDU', 'RSW', 'SAN', 'SAT', 'SEA', 'SFO', 'SJC', 'SLC', 'SMF', 'SNA', 'STL', 'TPA'}

    results = []
    for schedule in timetable_json:

        depart_airport = schedule.get('departure').get('iataCode')
        arrival_airport = schedule.get('arrival').get('iataCode')

        if (airport_ref[depart_airport] == 'US') and (airport_ref[arrival_airport] == 'US'):

            if (depart_airport in major_airports) and (arrival_airport in major_airports):

                for airport in airport_json:
                    if depart_airport == airport.get('codeIataAirport'):
                        schedule['departLat'] = float(
                            airport.get('latitudeAirport'))
                        schedule['departLon'] = float(
                            airport.get('longitudeAirport'))
                        schedule['departAirportTimezone'] = airport.get(
                            'timezone')
                        schedule['departCityCode'] = airport.get(
                            'codeIataCity')

                    elif arrival_airport == airport.get('codeIataAirport'):
                        schedule['arrivalLat'] = float(
                            airport.get('latitudeAirport'))
                        schedule['arrivalLon'] = float(
                            airport.get('longitudeAirport'))
                        schedule['arrivalAirportTimezone'] = airport.get(
                            'timezone')
                        schedule['arrivalCityCode'] = airport.get(
                            'codeIataCity')

                results.append(schedule)

    # insert to the Mongo database
    myclient = pymongo.MongoClient("mongodb://localhost:27017/")
    mydb = myclient["flight_app"]
    mycol = mydb["timetable"]
    # x = mycol.insert_many(result_json)

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

    return f"Posting Done (insert: {count_insert} / update: {count_update} records)"


@app.route("/get-storeddata")
def get_storeddata():

    results = []
    data = mongo.db.timetable.find({}, {"_id": 0})

    for schedule in data:
        # schedule['_id'] = str(schedule['_id'])
        results.append(schedule)

    return jsonify(results)


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

#     return f"Posting Done ({len(result_json)} records)"


# @app.route("/get-timetable")
# def get_timetable():

#     results = []
#     timetable = mongo.db.timetable.find({}, {"_id": 0})

#     for schedule in timetable:
#         # schedule['_id'] = str(schedule['_id'])
#         results.append(schedule)

#     return jsonify(results)


# Trim the stored data to easily visualize the arcs between source and target airports
@app.route("/summarize-timetable")
def summarize_timetable():

    resp_json = requests.get("http://127.0.0.1:5000/get-storeddata").json()

    # results is a dictionary of dictionaries
    counts = {}  # defaultdict(Counter)

    for flight in resp_json:
        departure_airport = flight.get('departure').get('iataCode')
        arrival_airport = flight.get('arrival').get('iataCode')
        route = f'{departure_airport}-{arrival_airport}'
        counts[route] = counts.get(route, 0) + 1

    results = []
    for route, flights in counts.items():
        departure = route.split('-')[0]
        arrival = route.split('-')[1]

        results.append({
            'departure': departure,
            'departure_coords': airport_coords[departure],
            'arrival': arrival,
            'arrival_coords': airport_coords[arrival],
            'flights': flights
        })

    results = sorted(results, key=lambda x: x['departure'])

    return jsonify(results)


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
    # x = mycol.insert_many(result_json)

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

    return "Posting Done"


@app.route("/get-flighttracker")
def get_flight_tracker():

    results = []
    flights = mongo.db.flighttracker.find()

    for flight in flights:
        flight['_id'] = str(flight['_id'])
        results.append(flight)

    return jsonify(results)


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

    return "Posting Done"


@app.route("/get-airportinfo")
def get_airport():

    results = []
    airports = mongo.db.airport.find()

    for airport in airports:
        airport['_id'] = str(airport['_id'])
        results.append(airport)

    return jsonify(results)


@app.route("/post-cityinfo")
def post_cities():

    base_url = 'https://aviation-edge.com/v2/public/cityDatabase'
    params = {'key': api_key}

    result_json = requests.get(base_url, params=params).json()

    # insert to the Mongo database
    myclient = pymongo.MongoClient("mongodb://localhost:27017/")
    mydb = myclient["flight_app"]
    mycol = mydb["cities"]

    mycol.create_index([("cityId", pymongo.ASCENDING),
                        ("nameCity", pymongo.ASCENDING),
                        ("codeIataCity", pymongo.ASCENDING),
                        ("codeIso2Country", pymongo.ASCENDING)
                        ], unique=True)

    for data in result_json:
        try:
            mycol.insert_one(data)
        except:
            pass

    return "Posting Done"


@app.route("/get-cityinfo")
def get_cities():

    results = []
    cities = mongo.db.cities.find()

    for city in cities:
        city['_id'] = str(city['_id'])
        results.append(city)

    return jsonify(results)


if __name__ == "__main__":
    app.run(debug=True)

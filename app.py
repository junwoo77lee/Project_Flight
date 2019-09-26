from flask import Flask, render_template, redirect, jsonify
from flask_pymongo import PyMongo
import pymongo
import requests
import os
api_key = os.environ.get('FLIGHT_API_KEY', '')


# Create an instance of Flask
app = Flask(__name__)

# Use PyMongo to establish Mongo connection
mongo = PyMongo(app, uri="mongodb://localhost:27017/flight_app")


# Route to render index.html template using data from Mongo
@app.route("/")
def home():

    # Find one record of data from the mongo database
    #

    # Return template and data
    # render_template("index.html", vacation=destination_data)
    return render_template("index.html")


# Route that will trigger the scrape function
@app.route("/post-timetable")
def post_timetable():
  
    base_url = 'http://aviation-edge.com/v2/public/timetable'
    params = {'key': api_key,
              'iataCode': 'DEN',
              'type': 'departure'
              }

    result_json = requests.get(base_url, params=params).json()

    # insert to the Mongo database
    myclient = pymongo.MongoClient("mongodb://localhost:27017/")
    mydb = myclient["flight_app"]
    mycol = mydb["timetable"]
    # x = mycol.insert_many(result_json)

    mycol.create_index([("airline", pymongo.ASCENDING),
                        ("arrival", pymongo.ASCENDING),
                        ("codeshared", pymongo.ASCENDING),
                        ("departure", pymongo.ASCENDING),
                        ("flight", pymongo.ASCENDING),
                        ("status", pymongo.ASCENDING),
                        ("type", pymongo.ASCENDING)
                        ], unique=True)
                        
    for data in result_json:
        try:
            mycol.insert_one(data)
        except:
            pass

    return "Posting Done"

@app.route("/get-timetable")
def get_timetable():

    results = []
    timetable = mongo.db.timetable.find()
    # timetable_json = jsonify(timetable)

    for schedule in timetable:
        schedule['_id'] = str(schedule['_id'])
        results.append(schedule)

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
    # timetable_json = jsonify(timetable)

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
        if (data.get('nameCountry') == 'United States'):
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


if __name__ == "__main__":
    app.run(debug=True)

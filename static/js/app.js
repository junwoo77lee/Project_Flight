function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
  }



urlTimeTable = '/get-timetable';  // departure, arrival airports, flight number, status
urlTracker = '/get-flighttracker'; // flight coordinates, status
urlAirport = '/get-airportinfo'; // airport coordinates


// TIME TABLE
// {'type': 'departure',
//  'status': 'active',
//  'departure': {'iataCode': 'DEN',
//   'icaoCode': 'KDEN',
//   'terminal': None,
//   'gate': 'B29',
//   'baggage': None,
//   'delay': None,
//   'scheduledTime': '2019-09-25T22:50:00.000',
//   'estimatedTime': '2019-09-25T22:50:00.000',
//   'actualTime': None,
//   'estimatedRunway': None,
//   'actualRunway': None},
//  'arrival': {'iataCode': 'BOS',
//   'icaoCode': 'KBOS',
//   'terminal': 'B',
//   'gate': 'B27',
//   'baggage': None,
//   'delay': None,
//   'scheduledTime': '2019-09-26T04:46:00.000',
//   'estimatedTime': None,
//   'actualTime': None,
//   'estimatedRunway': None,
//   'actualRunway': None},
//  'airline': {'name': 'United Airlines', 'iataCode': 'UA', 'icaoCode': 'UAL'},
//  'flight': {'number': '1606', 'iataNumber': 'UA1606', 'icaoNumber': 'UAL1606'},
//  'codeshared': None}

// FLIGHT TRACKER
// {'aircraft': {'iataCode': 'B738',
//               'icao24': '',
//               'icaoCode': 'B738',
//               'regNumber': 'N76503'},
//  'airline': {'iataCode': 'UA', 'icaoCode': 'UAL'},
//  'arrival': {'iataCode': 'LGA', 'icaoCode': 'KLGA'},
//  'departure': {'iataCode': 'DEN', 'icaoCode': 'KDEN'},
//  'flight': {'iataNumber': 'UA406', 'icaoNumber': 'UAL406', 'number': '406'},
//  'geography': {'altitude': 11277.6,
//                'direction': 88.34,
//                'latitude': 42.0506,
//                'longitude': -88.4931},
//  'speed': {'horizontal': 1024.6, 'isGround': 0, 'vertical': 0},
//  'status': 'en-route',
//  'system': {'squawk': '6261', 'updated': '1569454200'}}

// AIRPORT
// {'airportId': '5',
//  'nameAirport': 'Apalachicola Regional',
//  'codeIataAirport': 'AAF',
//  'codeIcaoAirport': 'KAAF',
//  'latitudeAirport': '29.733334',
//  'longitudeAirport': '-84.98333',
//  'geonameId': '4146153',
//  'timezone': 'America/New_York',
//  'GMT': '-5',
//  'phone': '',
//  'nameCountry': 'United States',
//  'codeIso2Country': 'US',
//  'codeIataCity': 'AAF'}

Promise.all([d3.json(urlTimeTable),
d3.json(urlTracker),
d3.json(urlAirport)])
    .then(([timeTable, actualFlightData, airportInfo]) => {
        // console.log(timeTable);
        // console.log(actualFlightData);
        // console.log(airportInfo);

        // Reorganize airport timetable data into an object
        let masterObj = [];
        masterObj = timeTable.map(item => {
            return {
                status: item.status,
                departIata: item.departure.iataCode,
                departDelay: item.departure.delay,
                departSchTime: item.departure.scheduledTime,
                arrivalIata: item.arrival.iataCode,
                arrivalDelay: item.arrival.delay,
                arrivalSchTime: item.arrival.scheduledTime,
                airlineName: item.airline.name,
                flightIata: item.flight.iataNumber,
                flightIcao: item.flight.icaoNumber,
            }
        });

        // Merge with airport dataset to extract coordinates information for each airport 
        airportInfo.forEach(airport => {
            masterObj.forEach(item => {
                if (item.departIata === airport.codeIataAirport) {
                    item['departLat'] = Number(airport.latitudeAirport);
                    item['departLon'] = Number(airport.longitudeAirport);
                } else if (item.arrivalIata === airport.codeIataAirport) {
                    item['arrivalLat'] = Number(airport.latitudeAirport);
                    item['arrivalLon'] = Number(airport.longitudeAirport);
                } else {
                    
                }
            }); 
        });

        // Merge with Flight tracker dataset to extract currenct positon, speed, and direction
        actualFlightData.forEach(flight => {
            masterObj.forEach(item => {
                if ((item.departIata === flight.departure.iataCode) &&
                   (item.arrivalIata === flight.arrival.iataCode) &&
                   (item.flightIcao === flight.flight.icaoNumber)) {
                       item['currentLat'] = flight.geography.latitude;
                       item['currentLon'] = flight.geography.longitude;
                       item['currentAlt'] = flight.geography.altitude;
                       item['currentSpeedH'] = flight.speed.horizontal;
                       item['currentSpeedV'] = flight.speed.vertical;
                       item['currentStatus'] = flight.status;
                       item['currentUpdateAt'] = timeConverter(Number(flight.system.updated));
                   }
            });
        });

        console.log(masterObj);
        

    });


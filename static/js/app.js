function timeConverterToLocale(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours() < 10 ? '0' + a.getHours() : a.getHours();
    var min = a.getMinutes() < 10 ? '0' + a.getMinutes() : a.getMinutes();
    var sec = a.getSeconds() < 10 ? '0' + a.getSeconds() : a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
    return time;
}

function timeConverterToUTC(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getUTCFullYear();
    var month = months[a.getUTCMonth()];
    var date = a.getUTCDate();
    var hour = a.getUTCHours() < 10 ? '0' + a.getUTCHours() : a.getUTCHours();
    var min = a.getUTCMinutes() < 10 ? '0' + a.getUTCMinutes() : a.getUTCMinutes();
    var sec = a.getUTCSeconds() < 10 ? '0' + a.getUTCSeconds() : a.getUTCSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
    return time;
}


const svgWidth = 960;
const svgHeight = 800;
const rotated = 100; // for mercator()


// Geo Projection
const projection = d3.geoMercator() //.geoAlbersUsa()
    .scale(1000)
    .translate([svgWidth / 2, svgHeight / 2])
    .rotate([rotated, -35, 0]);

const path = d3.geoPath(projection);


urlTimeTable = '/get-timetable';  // departure, arrival airports, flight number, status
urlTracker = '/get-flighttracker'; // flight coordinates, status
urlAirport = '/get-airportinfo'; // airport coordinates
urlStateJson = '/get-statejson'; // GeoJSon for US states
urlCities = '/get-cityinfo'; // city information to match city iataCode


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

// CITIES
// {'cityId': '1',
//  'nameCity': 'Anaa',
//  'codeIataCity': 'AAA',
//  'codeIso2Country': 'PF',
//  'latitudeCity': '-17.05',
//  'longitudeCity': '-145.41667',
//  'timezone': 'Pacific/Tahiti',
//  'GMT': '-10',
//  'geonameId': '0'}


const svg = d3.select('#map').append('svg')
    .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    .attr('preserveAspectRatio', 'xMinYMin');

const map = svg.append('g')
// .attr('transform', `translate(${svgWidth / 2}, ${svgHeight / 2})`);



Promise.all([d3.json(urlTimeTable),
d3.json(urlTracker),
d3.json(urlAirport),
d3.json(urlStateJson),
d3.json(urlCities)])
    .then(([timeTable, actualFlightData, airportInfo, usState, cityData]) => {
        // console.log(timeTable);
        // console.log(actualFlightData);
        // console.log(airportInfo);
        // console.log(usState);

        // Reorganize airport timetable data into an object
        let masterObj = [];
        masterObj = timeTable.map(item => {
            return {
                status: item.status,
                departAirportCode: item.departure.iataCode,
                departDelay: item.departure.delay,
                departSchTime: item.departure.scheduledTime,
                arrivalAirportCode: item.arrival.iataCode,
                arrivalDelay: item.arrival.delay,
                arrivalSchTime: item.arrival.scheduledTime,
                airlineName: item.airline.name,
                flightIataCode: item.flight.iataNumber,
                flightIcaoCode: item.flight.icaoNumber,
            }
        });

        // Merge with airport dataset to extract coordinates information for each airport 
        airportInfo.forEach(airport => {
            masterObj.forEach(item => {
                if (item.departAirportCode === airport.codeIataAirport) {
                    item['departLat'] = Number(airport.latitudeAirport);
                    item['departLon'] = Number(airport.longitudeAirport);
                    item['departAirportTimezone'] = airport.timezone;
                    item['departCityCode'] = airport.codeIataCity;
                } else if (item.arrivalAirportCode === airport.codeIataAirport) {
                    item['arrivalLat'] = Number(airport.latitudeAirport);
                    item['arrivalLon'] = Number(airport.longitudeAirport);
                    item['arrivalAirportTimezone'] = airport.timezone;
                    item['arrivalCityCode'] = airport.codeIataCity;
                } else {
                    // nothing to do here
                }
            });
        });

        // Calculate the duration between departure and arrival time after adjusting the timezone difference
        // Use moment.js library to do this
        masterObj.forEach(item => {
            if (item.arrivalSchTime && item.departSchTime) {
                item['departSchTimeUTC'] = moment.tz(item.departSchTime, item.departAirportTimezone).utc().format();
                item['arrivalSchTimeUTC'] = moment.tz(item.arrivalSchTime, item.arrivalAirportTimezone).utc().format();
                item['duration'] = ((moment.tz(item.arrivalSchTime, item.arrivalAirportTimezone).utc().valueOf() -
                                   moment.tz(item.departSchTime, item.departAirportTimezone).utc().valueOf()) / 1000) / 60 / 60 // unit: hours
            }
        });



        // Merge with Flight tracker dataset to extract currenct positon, speed, and direction
        actualFlightData.forEach(flight => {
            masterObj.forEach(item => {
                if ((item.departAirportCode === flight.departure.iataCode) &&
                    (item.arrivalAirportCode === flight.arrival.iataCode) &&
                    (item.flightIcaoCode === flight.flight.icaoNumber)) {
                    item['currentLat'] = flight.geography.latitude;
                    item['currentLon'] = flight.geography.longitude;
                    item['currentAlt'] = flight.geography.altitude;
                    item['currentDirection'] = flight.geography.direction;
                    item['currentSpeedH'] = flight.speed.horizontal;
                    item['currentSpeedV'] = flight.speed.vertical;
                    item['currentStatus'] = flight.status;
                    item['currentUpdateAt'] = timeConverterToLocale(Number(flight.system.updated)); // Unix timestamp is based on UTC (== 'GMT -0'), but it is converted to be based on local time
                }
            });
        });

        cityData.forEach(city => {
            masterObj.forEach(item => {
                if (item.departCityCode == city.codeIataCity) {
                    item['departCityName'] = city.nameCity;
                }
                if (item.arrivalCityCode == city.codeIataCity) {
                    item['arrivalCityName'] = city.nameCity;
                }
            });
        });


        console.log(masterObj);

        let currentObj = [];
        masterObj.forEach(item => {
            if (item.currentLat) {
                currentObj.push(item);
            }
        });

        console.log(currentObj);

        drawMap(path, usState.features, masterObj);
        drawArc(path, masterObj);

    });



// Draw a base map by states
function drawMap(geoPath, stateFeature, masterData) {

    map.selectAll('path .state')
        .data(stateFeature)
        .enter()
        .append('path')
        .classed('state', true)
        .attr("name", function (d) {
            return d.properties.NAME;
        })
        .attr("id", function (d) {  // contry code ex. 'AFG'
            return d.properties.STATE;
        })
        .attr("d", geoPath)
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('stroke-width', '2');

}

// Draw arcs between airports
function drawArc(geoPath, coordinatesObj) {

    const arcs = svg.append('g')

    var lineStrings = [];
    coordinatesObj.forEach(function (obj) {
        lineStrings.push({
            type: "LineString",
            coordinates: [[obj.departLon, obj.departLat],
            [obj.arrivalLon, obj.arrivalLat]],
            routes: [obj.departAirportCode, obj.arrivalAirportCode],
            flight: {
                icaoNumber: obj.flightIcao,
                departScheduledTime: obj.departSchTime,
                arrivalScheduledTime: obj.arrivalSchTime,
                status: obj.status,
                currentStatus: obj.currentStatus
            }
        });
    });

    // console.log(lineStrings);

    // lineStrings.forEach(d => {
    //     d.coordinates.forEach(c => {
    //         if (!c[0] || !c[1]) {
    //             console.log(d);
    //         }
    //     });
    // });



    // Add the path
    const lines = arcs.selectAll('path .arcs')
        .data(lineStrings)
        .enter()
        .append('path')
        .attr('class', 'arcs')
        .attr('id', d => {
            return `From: ${d.routes[0]} To: ${d.routes[1]}`
        })
        .attr("d", geoPath)
        .style("fill", "none")
        .style("stroke", "darkred")
        .style("stroke-width", 1)

    // anim(lines, lineStrings);
    // updateTooptips(arcs);

}


function twoArc(c) {
    var source = projection(c[0]),
        target = projection(c[1]),
        mid = projection([
               (source[0] + target[0] - (Math.sqrt(3))*(target[1]-source[1]))/2,
               (source[1] + target[1] + (Math.sqrt(3))*(target[0]-source[0]))/2
             ]);
        // mid = [(source[0] + target[0]) / 2, (source[1] + target[1]) / 2],
        // dx1 = mid[0] - source[0],
        // dx2 = target[0] - mid[0],
        // dy1 = mid[1] - source[1],
        // dy2 = target[1] - mid[1],
        // dr1 = Math.sqrt(dx1 * dx1 + dy1 * dy1),
        // dr2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    // var rv = "M";
    // rv += source[0] + "," + source[1];
    // rv += "A" + dr1 + "," + dr1 + " 0 0,1 ";
    // rv += mid[0] + "," + mid[1];
    // rv += "A" + dr2 + "," + dr2 + " 0 0,0 ";
    // rv += target[0] + "," + target[1];

    let rv = "M";
    rv += source[0] + "," + source[1];
    rv += "Q" + mid[0] + "," + mid[1];
    rv += target[0] + "," + target[1];

    return rv;
}

function anim(lines, lineStrings) {

    lines.data(lineStrings)
        .attr('d', string => {
            return twoArc(string.coordinates);
        });

    lines.transition()
        .duration(2000)
        .attrTween("stroke-dasharray", function () {
            var len = this.getTotalLength();
            return function (t) {
                return (d3.interpolateString("0," + len, len + ",0"))(t)
            };
        })
        .on('end', anim);
}

function updateTooptips(arcGroup) {

    const toolTip = d3.tip()
        // .attr('class', 'd3-tip')
        .offset([180, -100])
        .html(function (d) {
            return (`<h5>From: ${d.routes[0]}</h5><br>
            <h5>To: ${d.routes[1]}</h5>`);
        });

    arcGroup.call(toolTip);

    arcGroup.on('mouseover', function (data) {
        toolTip.show(data, this);
    })
        .on('mouseout', function (data) {
            toolTip.hide(data, this);
        });

    return arcGroup;
}
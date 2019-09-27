function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
    return time;
}


const svgWidth = 960;
const svgHeight = 800;
const rotated = 100;


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

const svg = d3.select('#map').append('svg')
    .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    .attr('preserveAspectRatio', 'xMinYMin');

const map = svg.append('g')
// .attr('transform', `translate(${svgWidth / 2}, ${svgHeight / 2})`);



Promise.all([d3.json(urlTimeTable),
d3.json(urlTracker),
d3.json(urlAirport),
d3.json(urlStateJson)])
    .then(([timeTable, actualFlightData, airportInfo, usState]) => {
        // console.log(timeTable);
        // console.log(actualFlightData);
        // console.log(airportInfo);
        // console.log(usState);

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

        let currentObj = [];
        masterObj.forEach(item => {
            if (item.currentLat) {
                currentObj.push(item);
            }
        });

        // console.log(currentObj);

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
            routes: [obj.departIata, obj.arrivalIata],
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
    arcs.selectAll('path .arcs')
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
    
    updateTooptips(arcs);

}

function updateTooptips(arcGroup) {
  
    const toolTip = d3.tip()
        // .attr('class', 'd3-tip')
        .offset([180, -100])
        .html(function(d) {
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
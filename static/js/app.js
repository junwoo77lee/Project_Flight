// APIs output data reference
// TIME TABLE API
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

// FLIGHT TRACKER API
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

// AIRPORT API
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

// CITIES API
// {'cityId': '1',
//  'nameCity': 'Anaa',
//  'codeIataCity': 'AAA',
//  'codeIso2Country': 'PF',
//  'latitudeCity': '-17.05',
//  'longitudeCity': '-145.41667',
//  'timezone': 'Pacific/Tahiti',
//  'GMT': '-10',
//  'geonameId': '0'}

// Special JS libraries for project
import LatLon from "https://cdn.jsdelivr.net/npm/geodesy@2.2.0/latlon-spherical.min.js"


function timeConverterToLocale(UNIX_timestamp) {
    // ISO 8601 format
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = (a.getMonth() + 1) < 10 ? `0${(a.getMonth() + 1)}` : (a.getMonth() + 1); //months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours() < 10 ? `0${a.getHours()}` : a.getHours();
    var min = a.getMinutes() < 10 ? `0${a.getMinutes()}` : a.getMinutes();
    var sec = a.getSeconds() < 10 ? `0${a.getSeconds()}` : a.getSeconds();
    var time = `${year}-${month}-${date} ${hour}:${min}:${sec}`;
    return time;
}

function timeConverterToUTC(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getUTCFullYear();
    var month = (a.getUTCMonth() + 1) < 10 ? `0${(a.getUTCMonth() + 1)}` : (a.getUTCMonth() + 1); //months[a.getUTCMonth()];
    var date = a.getUTCDate();
    var hour = a.getUTCHours() < 10 ? `0${a.getUTCHours()}` : a.getUTCHours();
    var min = a.getUTCMinutes() < 10 ? `0${a.getUTCMinutes()}` : a.getUTCMinutes();
    var sec = a.getUTCSeconds() < 10 ? `0${a.getUTCSeconds()}` : a.getUTCSeconds();
    var time = `${year}-${month}-${date} ${hour}:${min}:${sec}`;
    return time;
}


const svgWidth = 960;
const svgHeight = 800;
const rotated = 100; // for mercator()

const svg = d3.select('#container').append('svg')
    .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    .attr('preserveAspectRatio', 'xMinYMin');

const groups = {
    basemap: svg.append('g').attr('id', 'basemap'),
    airports: svg.append('g').attr('id', 'airports'),
    flights: svg.append('g').attr('id', 'flights')
};
// .attr('transform', `translate(${svgWidth / 2}, ${svgHeight / 2})`);

// Geo Projection
const projection = d3.geoAlbers()
    .scale(1280)
    .translate([480, 300]);
// .scale(1000)
// .translate([svgWidth / 2, svgHeight / 2])

const urls = {
    timeTable: '/get-storeddata', // departure, arrival airports, flight number, status
    flightSummary: '/summarize-timetable', // to have a slim version of dataset which contains only departure airport, arrival airport and each flight counts between two locations.
    tracker: '/get-flighttracker', // flight coordinates, status
    // airport: '/get-airportinfo', // flight coordinates, status
    map: 'https://unpkg.com/us-atlas@1/us/10m.json', // GeoJSON for US states
    // cities: '/get-cityinfo' // city information to match city iataCode
};

// load and draw base map
d3.json(urls.map).then(drawMap);


const promises = [
    d3.json(urls.timeTable),
    d3.json(urls.flightSummary),
    d3.json(urls.tracker)
    // d3.json(urls.airport),
    // d3.json(urls.cities)
];

Promise.all(promises).then(processData);

function processData(responses) {

    const timeTable = responses[0];
    const flightSummary = responses[1];
    const tracker = responses[2];

    // console.log(timeTable);
    // console.log(Object.keys(flightSummary).length);
    // console.log(flightSummary);

    drawFlights(flightSummary);

    // Reorganize airport timetable data into an object
    // let masterObj = mergeData(timeTable, tracker);//, airportInfo, cityInfo);

    // masterObj.forEach(item => {
    //     if (!item.departSchTimeUTC) {
    //         console.log(item);
    //     }
    // });
    // console.log(masterObj);

    // // let currentObj = masterObj.filter(item => item.currentLat);
    // // currentObj = estimates(currentObj);

    // // console.log(currentObj);
    // // console.log(d3.extent(currentObj));


    // drawArc(masterObj);

}

// draw flights between departure and arrival airport and animate them
function drawFlights(summary) {

    const flights = groups.flights;
    const path = d3.geoPath(projection);
    const planeScale = d3.scaleLinear()
        .domain(d3.extent(summary, d => d.flights))
        .range([1, 5]);

    // console.log(planeScale(26));
    // console.log(planeScale(2));
    // console.log(planeScale(50));

    function fly(departure, arrival, flightCount) {

        // // const enter = flights.selectAll("path .route")
        // //     .data(summary, function(d) {
        // //         return { type: "LineString", coordinates: [d.departure_coords, d.arrival_coords] } 
        // //     }).enter()

        // enter.append("path")
        //     .attr("class", "route")
        //     .attr("d", path);

        // enter.append("path")
        //     .attr("class", "plane")
        //     .attr("d", "m25.21488,3.93375c-0.44355,0 -0.84275,0.18332 -1.17933,0.51592c-0.33397,0.33267 -0.61055,0.80884 -0.84275,1.40377c-0.45922,1.18911 -0.74362,2.85964 -0.89755,4.86085c-0.15655,1.99729 -0.18263,4.32223 -0.11741,6.81118c-5.51835,2.26427 -16.7116,6.93857 -17.60916,7.98223c-1.19759,1.38937 -0.81143,2.98095 -0.32874,4.03902l18.39971,-3.74549c0.38616,4.88048 0.94192,9.7138 1.42461,13.50099c-1.80032,0.52703 -5.1609,1.56679 -5.85232,2.21255c-0.95496,0.88711 -0.95496,3.75718 -0.95496,3.75718l7.53,-0.61316c0.17743,1.23545 0.28701,1.95767 0.28701,1.95767l0.01304,0.06557l0.06002,0l0.13829,0l0.0574,0l0.01043,-0.06557c0,0 0.11218,-0.72222 0.28961,-1.95767l7.53164,0.61316c0,0 0,-2.87006 -0.95496,-3.75718c-0.69044,-0.64577 -4.05363,-1.68813 -5.85133,-2.21516c0.48009,-3.77545 1.03061,-8.58921 1.42198,-13.45404l18.18207,3.70115c0.48009,-1.05806 0.86881,-2.64965 -0.32617,-4.03902c-0.88969,-1.03062 -11.81147,-5.60054 -17.39409,-7.89352c0.06524,-2.52287 0.04175,-4.88024 -0.1148,-6.89989l0,-0.00476c-0.15655,-1.99844 -0.44094,-3.6683 -0.90277,-4.8561c-0.22699,-0.59493 -0.50356,-1.07111 -0.83754,-1.40377c-0.33658,-0.3326 -0.73578,-0.51592 -1.18194,-0.51592l0,0l-0.00001,0l0,0z");

        var route = flights.append("path")
            .datum({ type: "LineString", coordinates: [departure, arrival] })
            .attr("class", "route")
            .attr("d", path);

        var plane = flights.append("path")
            .attr("class", "plane")
            .attr("d", "m25.21488,3.93375c-0.44355,0 -0.84275,0.18332 -1.17933,0.51592c-0.33397,0.33267 -0.61055,0.80884 -0.84275,1.40377c-0.45922,1.18911 -0.74362,2.85964 -0.89755,4.86085c-0.15655,1.99729 -0.18263,4.32223 -0.11741,6.81118c-5.51835,2.26427 -16.7116,6.93857 -17.60916,7.98223c-1.19759,1.38937 -0.81143,2.98095 -0.32874,4.03902l18.39971,-3.74549c0.38616,4.88048 0.94192,9.7138 1.42461,13.50099c-1.80032,0.52703 -5.1609,1.56679 -5.85232,2.21255c-0.95496,0.88711 -0.95496,3.75718 -0.95496,3.75718l7.53,-0.61316c0.17743,1.23545 0.28701,1.95767 0.28701,1.95767l0.01304,0.06557l0.06002,0l0.13829,0l0.0574,0l0.01043,-0.06557c0,0 0.11218,-0.72222 0.28961,-1.95767l7.53164,0.61316c0,0 0,-2.87006 -0.95496,-3.75718c-0.69044,-0.64577 -4.05363,-1.68813 -5.85133,-2.21516c0.48009,-3.77545 1.03061,-8.58921 1.42198,-13.45404l18.18207,3.70115c0.48009,-1.05806 0.86881,-2.64965 -0.32617,-4.03902c-0.88969,-1.03062 -11.81147,-5.60054 -17.39409,-7.89352c0.06524,-2.52287 0.04175,-4.88024 -0.1148,-6.89989l0,-0.00476c-0.15655,-1.99844 -0.44094,-3.6683 -0.90277,-4.8561c-0.22699,-0.59493 -0.50356,-1.07111 -0.83754,-1.40377c-0.33658,-0.3326 -0.73578,-0.51592 -1.18194,-0.51592l0,0l-0.00001,0l0,0z");


        transition(plane, route, flightCount);
    }

    function transition(plane, route, flightCount) {
        const l = route.node().getTotalLength();
        // console.log(route.node())
        plane.transition()
            .duration(l * 50)
            .attrTween("transform", delta(route.node(), flightCount))
            .on("end", () => { route.remove(); })
            .remove();
    }

    function delta(arc, flightCount) {
        var l = arc.getTotalLength();

        return function (i) {
            return function (t) {

                var p = arc.getPointAtLength(t * l);

                var t2 = Math.min(t + 0.05, 1);
                var p2 = arc.getPointAtLength(t2 * l);

                var x = p2.x - p.x;
                var y = p2.y - p.y;
                var r = 90 - Math.atan2(-y, x) * 180 / Math.PI;

                var s = Math.min(Math.sin(Math.PI * t) * 0.7 * planeScale(flightCount), 0.3);

                return `translate(${p.x}, ${p.y}) scale(${s}) rotate(${r})`;
            }
        }
    }

    let i = 0;
    setInterval(function () {
        if (i > summary.length - 1) {
            i = 0;
        }
        var pair = summary[i];
        
        // fly(summary);
        fly(pair.departure_coords, pair.arrival_coords, pair.flights);
        
        i++;
    }, 50);

}


function mergeData(timeTable, tracker) { //, airportInfo, cityInfo) {

    // let masterObj = [];
    // // timetable is based on type="arrival" dataset
    // masterObj = timeTable.map(item => {
    //     return {
    //         status: item.status,
    //         departAirportCode: item.departure.iataCode,
    //         departDelay: parseInt(item.departure.delay),
    //         departSchTime: item.departure.scheduledTime,
    //         departLat: item.departLat,
    //         departLon: item.departLon,
    //         departTimeZone: item.departAirportTimezone,
    //         departCity: item.departCityCode,
    //         arrivalAirportCode: item.arrival.iataCode,
    //         arrivalDelay: parseInt(item.arrival.delay),
    //         arrivalSchTime: item.arrival.scheduledTime,
    //         arrivalLat: item.arrivalLat,
    //         arrivalLon: item.arrivalLon,
    //         arrivalTimeZone: item.arrivalAirportTimezone,
    //         arrivalCity: item.arrivalCityCode,
    //         airlineName: item.airline.name,
    //         airlineIataCode: item.airline.iataCode,
    //         airlineIcaoCode: item.airline.icaoCode,
    //         flightIataCode: item.flight.iataNumber,
    //         flightIcaoCode: item.flight.icaoNumber,
    //         departSchTimeUTC: moment.tz(item.departSchTime, item.departAirportTimezone).utc().format(),
    //         arrivalSchTimeUTC: moment.tz(item.arrivalSchTime, item.arrivalAirportTimezone).utc().format(),
    //         duration: ((moment.tz(item.arrivalSchTime, item.arrivalAirportTimezone).utc().valueOf() -
    //             moment.tz(item.departSchTime, item.departAirportTimezone).utc().valueOf()) / 1000) / 60 / 60 // unit: hours
    //     }
    // });

    timeTable.forEach(item => {
        // return {
        // status: item.status,
        // departAirportCode: item.departure.iataCode,
        item.departure.delay = item.departure.delay !== null ? parseInt(item.departure.delay) : null;
        // departSchTime: item.departure.scheduledTime,
        // departLat: item.departLat,
        // departLon: item.departLon,
        // departTimeZone: item.departAirportTimezone,
        // departCity: item.departCityCode,
        // arrivalAirportCode: item.arrival.iataCode,
        item.arrival.delay = item.arrival.delay !== null ? parseInt(item.arrival.delay) : null;
        // arrivalDelay: parseInt(item.arrival.delay),
        // arrivalSchTime: item.arrival.scheduledTime,
        // arrivalLat: item.arrivalLat,
        // arrivalLon: item.arrivalLon,
        // arrivalTimeZone: item.arrivalAirportTimezone,
        // arrivalCity: item.arrivalCityCode,
        // airlineName: item.airline.name,
        // airlineIataCode: item.airline.iataCode,
        // airlineIcaoCode: item.airline.icaoCode,
        // flightIataCode: item.flight.iataNumber,
        // flightIcaoCode: item.flight.icaoNumber,
        item['departSchTimeUTC'] = moment.tz(item.departure.scheduledTime, item.departAirportTimezone).utc().format();
        item['arrivalSchTimeUTC'] = moment.tz(item.arrival.scheduledTime, item.arrivalAirportTimezone).utc().format();
        item['duration'] = ((moment.tz(item.arrival.scheduledTime, item.arrivalAirportTimezone).utc().valueOf() -
            moment.tz(item.departure.scheduledTime, item.departAirportTimezone).utc().valueOf()) / 1000) / 60 / 60 // unit: hours
        // }
    });
    // // Calculate the duration between departure and arrival time after adjusting the timezone difference
    // // Use moment.js library to do this
    // masterObj.forEach(item => {
    //     if (item.arrivalSchTime && item.departSchTime) {
    //         item['departSchTimeUTC'] = moment.tz(item.departSchTime, item.departAirportTimezone).utc().format();
    //         item['arrivalSchTimeUTC'] = moment.tz(item.arrivalSchTime, item.arrivalAirportTimezone).utc().format();
    //         item['duration'] = ((moment.tz(item.arrivalSchTime, item.arrivalAirportTimezone).utc().valueOf() -
    //             moment.tz(item.departSchTime, item.departAirportTimezone).utc().valueOf()) / 1000) / 60 / 60 // unit: hours
    //     }
    // });

    // Merge with Flight tracker dataset to extract currenct positon, speed, and direction
    tracker.forEach(flight => {
        timeTable.forEach(item => {

            const tracker_update = timeConverterToLocale(Number(flight.system.updated))

            if ((item.departAirportCode === flight.departure.iataCode) &&
                (item.arrivalAirportCode === flight.arrival.iataCode) &&
                (item.flightIcaoCode === flight.flight.icaoNumber) &&
                (item.departSchTime.slice(0, 10) === tracker_update.slice(0, 10))) {
                item['currentLat'] = flight.geography.latitude;
                item['currentLon'] = flight.geography.longitude;
                item['currentAlt'] = flight.geography.altitude;
                item['currentDirection'] = flight.geography.direction;
                item['currentSpeedH'] = flight.speed.horizontal;
                item['currentSpeedV'] = flight.speed.vertical;
                item['currentStatus'] = flight.status;
                item['currentUpdateAt'] = tracker_update; // Unix timestamp is based on UTC (== 'GMT -0'), but it is converted to be based on local time
            }
        });
    });

    // cityInfo.forEach(city => {
    //     masterObj.forEach(item => {
    //         if (item.departCityCode == city.codeIataCity) {
    //             item['departCityName'] = city.nameCity;
    //         }
    //         if (item.arrivalCityCode == city.codeIataCity) {
    //             item['arrivalCityName'] = city.nameCity;
    //         }
    //     });
    // });

    return timeTable;
}


// draws the underlying map
function drawMap(map) {
    // remove non-continental states
    map.objects.states.geometries = map.objects.states.geometries.filter(isContinental);

    // console.log(map);

    // run topojson on remaining states and adjust projection
    let land = topojson.merge(map, map.objects.states.geometries);

    // use null projection; data is already projected
    let path = d3.geoPath();

    // draw base map
    groups.basemap.append("path")
        .datum(land)
        .attr("class", "land")
        .attr("d", path);

    // draw interior borders
    groups.basemap.append("path")
        .datum(topojson.mesh(map, map.objects.states, (a, b) => a !== b))
        .attr("class", "border interior")
        .attr("d", path);

    // draw exterior borders
    groups.basemap.append("path")
        .datum(topojson.mesh(map, map.objects.states, (a, b) => a === b))
        .attr("class", "border exterior")
        .attr("d", path);
}

function isContinental(state) {
    var id = parseInt(state.id);
    return id < 60 && id !== 2 && id !== 15;
}


function typeAirport(airport) {
    airport.longitude = parseFloat(airport.longitude);
    airport.latitude = parseFloat(airport.latitude);

    // use projection hard-coded to match topojson data
    let coords = projection([airport.longitude, airport.latitude]);
    airport.x = coords[0];
    airport.y = coords[1];

    airport.outgoing = 0;  // eventually tracks number of outgoing flights
    airport.incoming = 0;  // eventually tracks number of incoming flights

    airport.flights = [];  // eventually tracks outgoing flights

    return airport;
}

function estimates(obj) {

    obj.forEach(item => {
        let source = new LatLon(item.departLat, item.departLon);
        let target = new LatLon(item.arrivalLat, item.arrivalLon);

        item.distance = source.distanceTo(target);   // unit: meter
        item.midPoint = source.midpointTo(target).toGeoJSON();  // Lon Lat
    });

    return obj;
}


// Draw arcs between airports
function drawArc(coordinatesObj) {

    const path = d3.geoPath(projection);
    const arcs = svg.append('g');

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
    groups.flights.selectAll('path .arcs')
        .data(lineStrings)
        .enter()
        .append('path')
        .attr('class', 'arcs')
        .attr('id', d => {
            return `From: ${d.routes[0]} To: ${d.routes[1]}`
        })
        .attr("d", path)
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
            (source[0] + target[0] - (Math.sqrt(3)) * (target[1] - source[1])) / 2,
            (source[1] + target[1] + (Math.sqrt(3)) * (target[0] - source[0])) / 2
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
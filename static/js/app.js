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
// import drawHierarchicalBarChart  from "/static/js/hierarchical_barchart.js"

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

// function timeConverterToUTC(UNIX_timestamp) {
//     var a = new Date(UNIX_timestamp * 1000);
//     var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//     var year = a.getUTCFullYear();
//     var month = (a.getUTCMonth() + 1) < 10 ? `0${(a.getUTCMonth() + 1)}` : (a.getUTCMonth() + 1); //months[a.getUTCMonth()];
//     var date = a.getUTCDate();
//     var hour = a.getUTCHours() < 10 ? `0${a.getUTCHours()}` : a.getUTCHours();
//     var min = a.getUTCMinutes() < 10 ? `0${a.getUTCMinutes()}` : a.getUTCMinutes();
//     var sec = a.getUTCSeconds() < 10 ? `0${a.getUTCSeconds()}` : a.getUTCSeconds();
//     var time = `${year}-${month}-${date} ${hour}:${min}:${sec}`;
//     return time;
// }


const svgWidth = 960; //document.documentElement.clientWidth; // 960;
const svgHeight = 600; //document.documentElement.clientWidth; //800;
// const rotated = 100; // for mercator()

const svg = d3.select('#d3-map').append('svg')
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
    // timeTable: '/get-storeddata/total', // departure, arrival airports, flight number, status
    flightSummary: '/summarize-timetable-slim', // to have a slim version of dataset which contains only departure airport, arrival airport and each flight counts between two locations.
    tracker: '/get-flighttracker', // flight coordinates, status
    map: 'https://unpkg.com/us-atlas@1/us/10m.json', // GeoJSON for US states
    airports: '/airport_coords', // draw airport locations with circle
};

const promises = [
    d3.json(urls.map),
    d3.json(urls.flightSummary),
    d3.json(urls.tracker),
    d3.json(urls.airports)
];

Promise.all(promises).then(dataArray => {
    d3.select("#loader").style("visibility", "hidden")
    processData(dataArray);
});

function processData(responses) {

    const geojson = responses[0];
    // const timeTable = responses[1];
    const flightSummary = responses[1];
    const tracker = responses[2];
    const airports = responses[3];
    const airport_menu = d3.select('#airportSelector')

    // Organize selections on drop-down menus
    dropDownMenuOrganizer(flightSummary, "arrival_name", "airportSelector");

    //draw a map
    drawMap(geojson);
    //draw circles to represent airports onto the map
    drawAirports(airports, flightSummary); // When click an airport, the flight animation restarts based on the clicked airport and only for it.

    let airportCode = null; // interacting with DOM select

    //draw flight animation between each departure and arrival airport
    drawFlights(flightSummary, airportCode);

    airport_menu.on('change', function() {
        if (airportCode) {
            d3.select(`circle#${airportCode}`)
                .attr('fill', 'white')
                .attr('stroke-width', 1)
                .attr('stroke', '#252525');
        }

        airportCode = (this.options[this.selectedIndex].text).slice(0, 3);

        d3.select(this)
            .attr('fill', 'red')
            .attr('stroke-width', 3)
            .attr('stroke', 'black');

        clearInterval(refreshIntervalId); // refresh the looping of "setInterval" 
        drawFlights(flightSummary, airportCode);

        d3.select("#hb").html("");
        drawHierarchicalBarChart(airportCode);
    });

}


function drawAirports(airportCoords, flightSummary) {

    const airports = groups.airports;

    let isClicked = false;
    let clickedId;

    airports.selectAll('circle .airport')
        .data(airportCoords)
        .enter()
        .append('circle')
        .attr('class', 'airport')
        .attr('id', d => d.airport_iatacode)
        .attr('cx', d => projection(d.airport_coords)[0])
        .attr('cy', d => projection(d.airport_coords)[1])
        .attr('r', 8)
        .attr('fill', 'white')
        .on('mouseover', function() {
            if (this.id === clickedId) {
                isClicked = true;
            } else {
                isClicked = false;
                d3.select(this)
                    .attr('fill', 'rgb(232, 231, 189)')
                    .attr('stroke-width', 3)
                    .attr('box-shadow', '5px rgba(0,0,0,0.2)');

                //     .attr('fill', 'red') //d3.rgb(232, 231, 189))
                //     // .attr('box-shadow', '5px rgba(0,0,0,0.2)')
            }
        })
        .on('mouseout', function() {
            if (isClicked === false) {
                d3.select(this)
                    .attr('fill', 'white')
                    .attr('stroke-width', 1)
                    .attr('stroke', '#252525');
            }
        })
        .on('click', function() {
            if (isClicked = true && (this.id === clickedId)) {} else {
                // Implement the unclicked effect for previously clicked airport
                d3.select(`circle#${clickedId}`)
                    .attr('fill', 'white')
                    .attr('stroke-width', 1)
                    .attr('stroke', '#252525');

                isClicked = true;
                clickedId = this.id;
                d3.select(this)
                    .attr('fill', 'red')
                    .attr('stroke-width', 3)
                    .attr('stroke', 'black');

                clearInterval(refreshIntervalId); // refresh the looping of "setInterval" 

                drawFlights(flightSummary, this.id);

                d3.select("#hb").html("");
                drawHierarchicalBarChart(this.id);
            }
        });
}

// draw flights between departure and arrival airport and animate them
function drawFlights(summary, airportCode) {
    // referenced www.tnoda.com

    if (airportCode) {
        summary = summary.filter(item => {
            return (item.arrival === airportCode || item.departure === airportCode)
        });
    }

    const flights = groups.flights;
    // flights.attr("opacity", 1);

    const path = d3.geoPath(projection);
    const planeScale = d3.scaleSqrt()
        .domain(d3.extent(summary, d => d.flights))
        .range([0.3, 2]);


    function fly(departure, arrival, flightCount) {

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

        return function(i) {
            return function(t) {

                var p = arc.getPointAtLength(t * l);

                var t2 = Math.min(t + 0.05, 1);
                var p2 = arc.getPointAtLength(t2 * l);

                var x = p2.x - p.x;
                var y = p2.y - p.y;
                var r = 90 - Math.atan2(-y, x) * 180 / Math.PI;
                var s = Math.min(Math.sin(Math.PI * t) * 0.7, 0.3) * 1.3;

                // let s;
                // if (t <= 0.5) {
                //     s = (l /300) * ((planeScale(flightCount) / 0.5) * t) + 0.2;
                // } else {
                //     s = (l /300) * ((planeScale(flightCount) / 0.5) * (1 - t)) + 0.2;
                // };

                return `translate(${p.x}, ${p.y}) scale(${s}) rotate(${r})`;
            }
        }
    }

    let i = 0;
    window.refreshIntervalId = setInterval(function() {
        if (i > summary.length - 1) {
            i = 0;
        }
        var pair = summary[i];

        // fly(summary);
        fly(pair.departure_coords, pair.arrival_coords, pair.flights);

        i++;
    }, 150);

}


multivariateChart("DEN"); // call the function with an sample argument "DEN". We need to change this a variable containing airport code.

function multivariateChart(airport) {

    d3.json(`http://127.0.0.1:5000/summary-multivariate-chart/${airport}`)
        .then(response => {
            const dateTime = mergeData(response);
            console.log(dateTime);
        });
}


function mergeData(timeTable) { //}, tracker) {

    timeTable.forEach(item => {
        // item.departure.delay = item.departure.delay !== null ? parseInt(item.departure.delay) : null;
        // item.arrival.delay = item.arrival.delay !== null ? parseInt(item.arrival.delay) : null;
        // item['departSchTimeUTC'] = moment.tz(item.departure.scheduledTime, item.departAirportTimezone).utc().format();
        // item['arrivalSchTimeUTC'] = moment.tz(item.arrival.scheduledTime, item.arrivalAirportTimezone).utc().format();
        item['duration'] = ((moment.tz(item.destination_date, item.destination_timezone).utc().valueOf() -
                moment.tz(item.origin_date, item.origin_timezone).utc().valueOf()) / 1000) / 60 / 60 // unit: hours

        let source = new LatLon(item.origin_coords[1], item.origin_coords[0]);
        let target = new LatLon(item.destination_coords[1], item.destination_coords[0]);

        item.distance = source.distanceTo(target, 3959); // unit: miles
        item.midPoint = source.midpointTo(target).toGeoJSON(); // Lon Lat
    });

    // Merge with Flight tracker dataset to extract currenct positon, speed, and direction
    // tracker.forEach(flight => {
    //     timeTable.forEach(item => {

    //         const tracker_update = timeConverterToLocale(Number(flight.system.updated))

    //         if ((item.departAirportCode === flight.departure.iataCode) &&
    //             (item.arrivalAirportCode === flight.arrival.iataCode) &&
    //             (item.flightIcaoCode === flight.flight.icaoNumber) &&
    //             (item.departSchTime.slice(0, 10) === tracker_update.slice(0, 10))) {
    //             item['currentLat'] = flight.geography.latitude;
    //             item['currentLon'] = flight.geography.longitude;
    //             item['currentAlt'] = flight.geography.altitude;
    //             item['currentDirection'] = flight.geography.direction;
    //             item['currentSpeedH'] = flight.speed.horizontal;
    //             item['currentSpeedV'] = flight.speed.vertical;
    //             item['currentStatus'] = flight.status;
    //             item['currentUpdateAt'] = tracker_update; // Unix timestamp is based on UTC (== 'GMT -0'), but it is converted to be based on local time
    //         }
    //     });
    // });

    return timeTable;
}


function estimates(obj) {

    obj.forEach(item => {
        let source = new LatLon(item.departLat, item.departLon);
        let target = new LatLon(item.arrivalLat, item.arrivalLon);

        item.distance = source.distanceTo(target); // unit: meter
        item.midPoint = source.midpointTo(target).toGeoJSON(); // Lon Lat
    });

    return obj;
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


function updateTooptips(arcGroup) {

    const toolTip = d3.tip()
        // .attr('class', 'd3-tip')
        .offset([180, -100])
        .html(function(d) {
            return (`<h5>From: ${d.routes[0]}</h5><br>
            <h5>To: ${d.routes[1]}</h5>`);
        });

    arcGroup.call(toolTip);

    arcGroup.on('mouseover', function(data) {
            toolTip.show(data, this);
        })
        .on('mouseout', function(data) {
            toolTip.hide(data, this);
        });

    return arcGroup;
}


function dropDownMenuOrganizer(jsonData, feature, selector) {
    // Assign items to dropdown selections
    // Sort them and prevent duplicates
    const dropDownAirports = document.getElementById(selector);
    const options = {};

    jsonData.sort((a, b) => {
        if (a.arrival > b.arrival) {
            return 1
        } else {
            return -1
        }
    }).forEach((item, index) => {
        const option = `${item.arrival}: ${item[feature]}, (${item.arrival_city})`
        if (!options[option]) {
            options[option] = true;
            dropDownAirports.options[dropDownAirports.options.length] = new Option(option, index);
        }
    });
}
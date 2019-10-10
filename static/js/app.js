// Special JS libraries for project
import LatLon from "https://cdn.jsdelivr.net/npm/geodesy@2.2.0/latlon-spherical.min.js"
import multivariateChart from '/static/js/cross_filter_chart.js'


const svgWidth = 960; //document.documentElement.clientWidth; // 960;
const svgHeight = 600; //document.documentElement.clientWidth; //800;
const legendWidth = document.documentElement.clientWidth;
const legendHeight = document.documentElement.clientHeight / 4;
// const rotated = 100; // for mercator()

const svg = d3.select('#d3-map').append('svg')
    .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    .attr('preserveAspectRatio', 'xMinYMin');

const legendSvg = d3.select("#legend").append('svg')
    .attr('viewBox', `0 0 ${legendWidth} ${legendHeight}`)
    .attr('preserveAspectRatio', 'xMinYMin');

const groups = {
    basemap: svg.append('g').attr('id', 'basemap'),
    airports: svg.append('g').attr('id', 'airports'),
    flights: svg.append('g').attr('id', 'flights'),
    scheduledPaths: svg.append('g').attr('id', 'scheduledPaths'),
    currentFlights: svg.append('g').attr('id', 'currentFlights'),
    legend: legendSvg.append('g').attr('id', 'legendGroup')
};

// Geo Projection
const projection = d3.geoAlbers()
    .scale(1280)
    .translate([480, 300]);

// initial printing the bound type for crossfilter chart
let boundType = d3.select('input[name="bound-type"]:checked').node().id; // (global variable) listener for bound type (ex. arrival) to be an argument for crossfilter chart
d3.select("#bound-type-marker").text(boundType);

const urls = {
    flightSummary: '/summarize-timetable-slim', // to have a slim version of dataset which contains only departure airport, arrival airport and each flight counts between two locations.
    map: 'https://unpkg.com/us-atlas@1/us/10m.json', // GeoJSON for US states
    airports: '/airport_coords', // draw airport locations with circle
};

const promises = [
    d3.json(urls.map),
    d3.json(urls.flightSummary),
    d3.json(urls.airports)
];

Promise.all(promises).then(dataArray => {
    d3.select("#loader").style("visibility", "hidden");
    processData(dataArray);
});

function processData(responses) {

    const geojson = responses[0];
    const flightSummary = responses[1];
    const airports = responses[2];
    const airport_menu = d3.select('#airportSelector');
    const animationTypeButton = d3.selectAll("input[name='optradio']");
    const boundTypeButton = d3.selectAll("input[name='bound-type']");

    // listening to a change of the radio buttons to show/hide a legend
    animationTypeButton.on("change", function() {

        // draw a legend with two airplane svgs and their texts
        const legend = groups.legend;
        const planeRed = legend.append("path")
            .attr("d", "m25.21488,3.93375c-0.44355,0 -0.84275,0.18332 -1.17933,0.51592c-0.33397,0.33267 -0.61055,0.80884 -0.84275,1.40377c-0.45922,1.18911 -0.74362,2.85964 -0.89755,4.86085c-0.15655,1.99729 -0.18263,4.32223 -0.11741,6.81118c-5.51835,2.26427 -16.7116,6.93857 -17.60916,7.98223c-1.19759,1.38937 -0.81143,2.98095 -0.32874,4.03902l18.39971,-3.74549c0.38616,4.88048 0.94192,9.7138 1.42461,13.50099c-1.80032,0.52703 -5.1609,1.56679 -5.85232,2.21255c-0.95496,0.88711 -0.95496,3.75718 -0.95496,3.75718l7.53,-0.61316c0.17743,1.23545 0.28701,1.95767 0.28701,1.95767l0.01304,0.06557l0.06002,0l0.13829,0l0.0574,0l0.01043,-0.06557c0,0 0.11218,-0.72222 0.28961,-1.95767l7.53164,0.61316c0,0 0,-2.87006 -0.95496,-3.75718c-0.69044,-0.64577 -4.05363,-1.68813 -5.85133,-2.21516c0.48009,-3.77545 1.03061,-8.58921 1.42198,-13.45404l18.18207,3.70115c0.48009,-1.05806 0.86881,-2.64965 -0.32617,-4.03902c-0.88969,-1.03062 -11.81147,-5.60054 -17.39409,-7.89352c0.06524,-2.52287 0.04175,-4.88024 -0.1148,-6.89989l0,-0.00476c-0.15655,-1.99844 -0.44094,-3.6683 -0.90277,-4.8561c-0.22699,-0.59493 -0.50356,-1.07111 -0.83754,-1.40377c-0.33658,-0.3326 -0.73578,-0.51592 -1.18194,-0.51592l0,0l-0.00001,0l0,0z")
            .attr("fill", "red")
            .attr('transform', `translate(${legendWidth / 6}, ${legendHeight / 6}) scale(1.5) rotate(90)`)

        legend.append('text')
            .text('Outbound')
            .attr('fill', 'red')
            .attr("x", `${legendWidth / 10 - 70}`)
            .attr("y", `${legendHeight / 5}`)
            .attr('transform', 'scale(3)')

        const planeBlue = legend.append("path")
            .attr("d", "m25.21488,3.93375c-0.44355,0 -0.84275,0.18332 -1.17933,0.51592c-0.33397,0.33267 -0.61055,0.80884 -0.84275,1.40377c-0.45922,1.18911 -0.74362,2.85964 -0.89755,4.86085c-0.15655,1.99729 -0.18263,4.32223 -0.11741,6.81118c-5.51835,2.26427 -16.7116,6.93857 -17.60916,7.98223c-1.19759,1.38937 -0.81143,2.98095 -0.32874,4.03902l18.39971,-3.74549c0.38616,4.88048 0.94192,9.7138 1.42461,13.50099c-1.80032,0.52703 -5.1609,1.56679 -5.85232,2.21255c-0.95496,0.88711 -0.95496,3.75718 -0.95496,3.75718l7.53,-0.61316c0.17743,1.23545 0.28701,1.95767 0.28701,1.95767l0.01304,0.06557l0.06002,0l0.13829,0l0.0574,0l0.01043,-0.06557c0,0 0.11218,-0.72222 0.28961,-1.95767l7.53164,0.61316c0,0 0,-2.87006 -0.95496,-3.75718c-0.69044,-0.64577 -4.05363,-1.68813 -5.85133,-2.21516c0.48009,-3.77545 1.03061,-8.58921 1.42198,-13.45404l18.18207,3.70115c0.48009,-1.05806 0.86881,-2.64965 -0.32617,-4.03902c-0.88969,-1.03062 -11.81147,-5.60054 -17.39409,-7.89352c0.06524,-2.52287 0.04175,-4.88024 -0.1148,-6.89989l0,-0.00476c-0.15655,-1.99844 -0.44094,-3.6683 -0.90277,-4.8561c-0.22699,-0.59493 -0.50356,-1.07111 -0.83754,-1.40377c-0.33658,-0.3326 -0.73578,-0.51592 -1.18194,-0.51592l0,0l-0.00001,0l0,0z")
            .attr("fill", "blue")
            .attr('transform', `translate(${legendWidth / 2}, ${legendHeight / 6}) scale(1.5) rotate(90)`)

        legend.append('text')
            .text('Inbound')
            .attr('fill', 'blue')
            .attr("x", `${legendWidth / 10 + 120}`)
            .attr("y", `${legendHeight / 5}`)
            .attr('transform', 'scale(3)')

        if (this.id === "current-flights") {
            // display a legend
            legend.attr("visibility", "visible");
        } else { // "unlimited"
            // hide the legend
            legend.attr("visibility", "hidden");
        }
    });

    boundTypeButton.on("change", function() {
        boundType = this.id;
        d3.select("#bound-type-marker").text(this.id);
    });
    // Organize selections on drop-down menus
    dropDownMenuOrganizer(flightSummary, "arrival_name", "airportSelector");

    //draw a map
    drawMap(geojson);
    //draw circles to represent airports onto the map
    drawAirports(airports, flightSummary); // When click an airport, the flight animation restarts based on the clicked airport and only for it.

    let airportCode = null; // initialization and it can be interacting with DOM selection

    //draw flight animation between each departure and arrival airport
    drawFlights(flightSummary, airportCode);

    airport_menu.on('change', function() {
        if (document.getElementById("unlimited").checked) {

            if (airportCode) {
                d3.select(`circle#${airportCode}`)
                    .attr('fill', 'white')
                    .attr('stroke-width', 1)
                    .attr('stroke', '#252525');
            }

            airportCode = (this.options[this.selectedIndex].text).slice(0, 3);

            // display the airport information
            createAirportTable(airportCode);

            clearInterval(refreshIntervalId); // refresh the looping of "setInterval" 
            drawFlights(flightSummary, airportCode);

            d3.select(this)
                .attr('fill', 'red')
                .attr('stroke-width', 3)
                .attr('stroke', 'black');

            d3.select("#hierarchical-barchart").html("");
            drawHierarchicalBarChart(airportCode);

            // crossfilter chart
            multivariateChart(airportCode, boundType);

        } else if (document.getElementById("current-flights").checked) {

            // remove previous animation before calling another one
            d3.select("#scheduledPaths").html("");
            d3.select("#currentFlights").html("");

            if (airportCode) {
                d3.select(`circle#${airportCode}`)
                    .attr('fill', 'white')
                    .attr('stroke-width', 1)
                    .attr('stroke', '#252525');
            }

            airportCode = (this.options[this.selectedIndex].text).slice(0, 3);

            // display the airport information
            createAirportTable(airportCode);
            // crossfilter chart
            // multivariateChart(airportCode, boundType);

            d3.select(this)
                .attr('fill', 'red')
                .attr('stroke-width', 3)
                .attr('stroke', 'black');

            // clear out the previous flying animation and hierarchical barchart before showing current flight progresses
            clearInterval(refreshIntervalId); // refresh the looping of "setInterval" 
            d3.select("#flights").html("");
            d3.select("#hierarchical-barchart").html("");

            // show current flight progresses
            drawScheduledPaths(airportCode);

        }
    });

}


function createAirportTable(code) {
    // Grabbing data from CSV File in Data Folder
    d3.csv("/static/data/airportdata.csv").then(function(airportData) {

        let currentAirport = null
            // loop for airport IATA code
        for (var i = 0; i < airportData.length; i++) {
            var record = airportData[i]
            if (record["IATACode"] == code) {
                currentAirport = record
            };

        }
        // created the actual table here
        // target empty div with d3.select
        let infoPanel = d3.select("#airportInfo")
            //use d3.append to build HTML elements to hold text
        infoPanel.html("");
        infoPanel.append("p").classed('airport_info', true).text("Name: " + currentAirport["Airports"])
        infoPanel.append("p").classed('airport_info', true).text("IATA Code: " + currentAirport["IATACode"])
        infoPanel.append("p").classed('airport_info', true).text("Logo: ").append('img').attr('src', currentAirport["img_link"]).attr('width', 200).attr('height', 150);
        infoPanel.append("p").classed('airport_info', true).text("Rank (2018): " + currentAirport["2018_airportRank"]);
        infoPanel.append("p").classed('airport_info', true).text("City: " + currentAirport["City"])
        infoPanel.append("p").classed('airport_info', true).text("State: " + currentAirport["State"])
        infoPanel.append("p").classed('airport_info', true).text("Website: ").append('a').text(currentAirport["website"]).attr('href', `${currentAirport["website"]}`).attr("target", "_blank")

    });
};


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
            if (document.getElementById("unlimited").checked) {
                if (isClicked = true && (this.id === clickedId)) {
                    // remove the previously displayed paths and highlighted airport circle
                    d3.select("#scheduledPaths").html("");
                    d3.select("#currentFlights").html("");

                    clearInterval(refreshIntervalId); // refresh the looping of "setInterval" 
                    drawFlights(flightSummary, this.id);

                    // // display the airport information
                    // createAirportTable(clickedId);
                    d3.select("#hierarchical-barchart").html("");
                    drawHierarchicalBarChart(this.id);

                    // crossfilter chart
                    multivariateChart(clickedId, boundType);

                } else {
                    // remove the previously displayed paths and highlighted airport circle
                    d3.select("#scheduledPaths").html("");
                    d3.select("#currentFlights").html("");
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

                    // display the airport information
                    createAirportTable(clickedId);

                    clearInterval(refreshIntervalId); // refresh the looping of "setInterval" 
                    drawFlights(flightSummary, this.id);

                    d3.select("#hierarchical-barchart").html("");
                    drawHierarchicalBarChart(this.id);

                    // crossfilter chart
                    multivariateChart(clickedId, boundType);
                }

            } else if (document.getElementById("current-flights").checked) {
                if (isClicked = true && (this.id === clickedId)) {
                    // remove previous animation before calling another one
                    d3.select("#scheduledPaths").html("");
                    d3.select("#currentFlights").html("");

                    clearInterval(refreshIntervalId); // refresh the looping of "setInterval" 
                    d3.select("#flights").html("");

                    // show current flight progresses
                    drawScheduledPaths(clickedId);

                    d3.select("#hierarchical-barchart").html("");
                    drawHierarchicalBarChart(this.id);

                    // crossfilter chart
                    multivariateChart(clickedId, boundType);

                } else {

                    // remove the previously displayed paths and highlighted airport circle
                    d3.select("#hour-chart").html("");
                    d3.select("#scheduledPaths").html("");
                    d3.select("#currentFlights").html("");
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

                    // display the airport information
                    createAirportTable(clickedId);
                    // crossfilter chart
                    // multivariateChart(clickedId, boundType);

                    // show current flight progresses
                    drawScheduledPaths(clickedId);

                    // clear out the previous flying animation and hierarchical barchart before showing current flight progresses
                    clearInterval(refreshIntervalId); // refresh the looping of "setInterval" 
                    d3.select("#flights").html("");

                    d3.select("#hierarchical-barchart").html("");
                    drawHierarchicalBarChart(this.id);

                    // crossfilter chart
                    multivariateChart(clickedId, boundType);
                }
            }
        });
}

// draw flights between departure and arrival airport and animate them
function drawFlights(flightSummary, airportCode) {
    // referenced www.tnoda.com
    let summary;

    if (airportCode) {
        summary = flightSummary.filter(item => {
            return (item.arrival === airportCode || item.departure === airportCode)
        });
    } else {
        summary = flightSummary;
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

                // different way of flying: linear method about the culmination (0.5)
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


function drawScheduledPaths(airportCode) {

    d3.json(`/summary-current-flights/${airportCode}`)
        .then(schedules => {
            const trackerCombined = combineScheduleAndTracker(schedules);
            drawCurrentFlights(trackerCombined, airportCode);
        });
}


function drawCurrentFlights(trackerCombined, airportCode) {

    // draw the scheduled path between departure and arrival airport
    // on top of that, draw another path whichs show flight's current location and its animation
    // in the scheduled path
    // Tooltip?:
    // show the scheduled duration
    // show the estimated duration and possible delay info based on the time left (distance left [m] / speed [m/s])


    // referenced www.tnoda.com

    const scheduledPaths = groups.scheduledPaths;
    const currentFlights = groups.currentFlights;

    const path = d3.geoPath(projection);


    function fly(flightObj) {

        const fullArc = scheduledPaths.append("path")
            .datum({ type: "LineString", coordinates: [flightObj.departureCoords, flightObj.arrivalCoords] })
            .attr("class", "today_route")
            .attr("d", path)
            .attr("stroke", () => {
                if (flightObj.boundType === "inBound") {
                    return 'blue';
                } else { return 'red'; }
            });

        var currentArc = currentFlights.append("path")
            .datum({ type: "LineString", coordinates: [flightObj.departureCoords, flightObj.intermediateCoords] })
            .attr("class", "today_progress")
            .attr("d", path);

        var plane = currentFlights.append("path")
            .attr("class", "plane")
            .attr("d", "m25.21488,3.93375c-0.44355,0 -0.84275,0.18332 -1.17933,0.51592c-0.33397,0.33267 -0.61055,0.80884 -0.84275,1.40377c-0.45922,1.18911 -0.74362,2.85964 -0.89755,4.86085c-0.15655,1.99729 -0.18263,4.32223 -0.11741,6.81118c-5.51835,2.26427 -16.7116,6.93857 -17.60916,7.98223c-1.19759,1.38937 -0.81143,2.98095 -0.32874,4.03902l18.39971,-3.74549c0.38616,4.88048 0.94192,9.7138 1.42461,13.50099c-1.80032,0.52703 -5.1609,1.56679 -5.85232,2.21255c-0.95496,0.88711 -0.95496,3.75718 -0.95496,3.75718l7.53,-0.61316c0.17743,1.23545 0.28701,1.95767 0.28701,1.95767l0.01304,0.06557l0.06002,0l0.13829,0l0.0574,0l0.01043,-0.06557c0,0 0.11218,-0.72222 0.28961,-1.95767l7.53164,0.61316c0,0 0,-2.87006 -0.95496,-3.75718c-0.69044,-0.64577 -4.05363,-1.68813 -5.85133,-2.21516c0.48009,-3.77545 1.03061,-8.58921 1.42198,-13.45404l18.18207,3.70115c0.48009,-1.05806 0.86881,-2.64965 -0.32617,-4.03902c-0.88969,-1.03062 -11.81147,-5.60054 -17.39409,-7.89352c0.06524,-2.52287 0.04175,-4.88024 -0.1148,-6.89989l0,-0.00476c-0.15655,-1.99844 -0.44094,-3.6683 -0.90277,-4.8561c-0.22699,-0.59493 -0.50356,-1.07111 -0.83754,-1.40377c-0.33658,-0.3326 -0.73578,-0.51592 -1.18194,-0.51592l0,0l-0.00001,0l0,0z")
            .style("fill", () => {
                if (flightObj.boundType === "inBound") {
                    return 'blue';
                } else { return 'red'; }
            });


        transition(plane, currentArc, fullArc, flightObj);
    }

    function transition(plane, currentArc, fullArc, flightObj) {
        const long = fullArc.node().getTotalLength();
        const short = currentArc.node().getTotalLength();

        plane.transition()
            .duration(long * 50)
            .attrTween("transform", delta(fullArc.node(), currentArc.node()))
            .on("end", () => { // plane will head to its reported direction
                return plane //.transition()
                    // .duration(2000)
                    .attr("transform", `translate(${currentArc.node().getPointAtLength(short).x},
                                                  ${currentArc.node().getPointAtLength(short).y})
                                        scale(0.39) 
                                        rotate(${flightObj.currentDirection})`)
            });
    }

    function delta(fullArc, arc) {
        var long = fullArc.getTotalLength();
        var short = arc.getTotalLength();

        return function(i) {
            return function(t) {

                var p = arc.getPointAtLength(t * short);

                var t2 = Math.min(t + 0.05, 1);
                var p2 = arc.getPointAtLength(t2 * short);

                var x = p2.x - p.x;
                var y = p2.y - p.y;
                var r = 90 - Math.atan2(-y, x) * 180 / Math.PI;
                if ((short / long) > 0.5) {
                    var s = t > 0.5 ? Math.min(Math.sin(Math.PI * 0.5) * 0.7, 0.3) * 1.3 : Math.min(Math.sin(Math.PI * t) * 0.7, 0.3) * 1.3;
                } else {
                    var s = t > 0.5 ? Math.min(Math.sin(Math.PI * 0.5) * 0.7, 0.3) * 1.3 : Math.min(Math.sin(Math.PI * t) * 0.7, 0.3) * 1.3;
                }

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



    trackerCombined.forEach(route => {
        const departure = route.departure;
        const arrival = route.arrival;
        const departureCoords = route.departure_coords;
        const intermediateCoords = [route.currentLon, route.currentLat];
        const arrivalCoords = route.arrival_coords;
        const flight = route.flight_icaoNumber;
        const totalDistance = route.distance;
        const totalDuration = route.duration;
        const currentDirection = route.currentDirection;
        const currentStatus = route.currentStatus;
        const currentSpeed = route.currentSpeedH;
        const boundType = (airportCode === departure) ? "outBound" : "inBound";

        const flightObj = {
            "departureCoords": departureCoords,
            "intermediateCoords": intermediateCoords,
            "arrivalCoords": arrivalCoords,
            "flight": flight,
            "totalDistance": totalDistance,
            "totalDuration": totalDuration,
            "currentDirection": currentDirection,
            "currentStatus": currentStatus,
            "currentSpeed": currentSpeed,
            "boundType": boundType
        }

        fly(flightObj);

    });

}

function combineScheduleAndTracker(timeTable) {

    timeTable.forEach(item => {

        let source = new LatLon(item.departure_coords[1], item.departure_coords[0]);
        let target = new LatLon(item.arrival_coords[1], item.arrival_coords[0]);

        item.distance = source.distanceTo(target, 3959); // unit: miles
        item.midPoint = source.midpointTo(target).toGeoJSON(); // Lon Lat

    });

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


// function updateTooptips(arcGroup) {

//     const toolTip = d3.tip()
//         // .attr('class', 'd3-tip')
//         .offset([180, -100])
//         .html(function(d) {
//             return (`<h5>From: ${d.routes[0]}</h5><br>
//             <h5>To: ${d.routes[1]}</h5>`);
//         });

//     arcGroup.call(toolTip);

//     arcGroup.on('mouseover', function(data) {
//             toolTip.show(data, this);
//         })
//         .on('mouseout', function(data) {
//             toolTip.hide(data, this);
//         });

//     return arcGroup;
// }


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
    var date = a.getUTCDate() < 10 ? `0${a.getUTCDate()}` : a.getUTCDate();
    var hour = a.getUTCHours() < 10 ? `0${a.getUTCHours()}` : a.getUTCHours();
    var min = a.getUTCMinutes() < 10 ? `0${a.getUTCMinutes()}` : a.getUTCMinutes();
    var sec = a.getUTCSeconds() < 10 ? `0${a.getUTCSeconds()}` : a.getUTCSeconds();
    var time = `${year}-${month}-${date} ${hour}:${min}:${sec}`;
    return time;
}
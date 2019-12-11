import LatLon from "https://cdn.jsdelivr.net/npm/geodesy@2.2.0/latlon-spherical.min.js"


const width = document.documentElement.clientWidth;
const height = document.documentElement.clientHeight;

export default function multivariateChart(airport, boundType) {

    // boundType is either "arrival" or "departure"

    // Before d3.json fetching data, the loader run
    d3.select("#loader")
        .attr('transform', `translate(${width} + 500, ${height}) + 500`)
        .style("visibility", "visible")

    // using d3 v3 to match with the original code
    d3v3.json(`/summary-multivariate-chart/${airport}`, function(error, response) {
        if (error) throw error;

        d3.select("#loader")
            .style("visibility", "hidden")

        const dateTime = mergeData(response);
        const flights = make_rawdata(dateTime, airport, boundType);

        flights.forEach(function(d, i) {
            d.index = i;
            d.date = parseDate(d.date);
            d.duration = parseFloat(d.duration);
            d.distance = parseFloat(d.distance);
        });

        function make_rawdata(obj, airport, boundType) {
            const results = []
            let date;
            let converted_date;

            if (boundType === "arrival") { // Inbound
                obj.filter(item => {
                    return item.destination === airport;
                }).forEach(item => {
                    date = item.destination_date;
                    converted_date = `${date.slice(5, 7)}${date.slice(8, 10)}${date.slice(11, 13)}${date.slice(14, 16)}`;
                    results.push({
                        "date": converted_date,
                        "duration": item.duration * 60,
                        "distance": item.distance,
                        "origin": item.origin,
                        "destination": item.destination
                    });
                });

            } else { // departure (Outbound)
                obj.filter(item => {
                    return item.origin === airport;
                }).forEach(item => {
                    date = item.origin_date;
                    converted_date = `${date.slice(5, 7)}${date.slice(8, 10)}${date.slice(11, 13)}${date.slice(14, 16)}`;
                    results.push({
                        "date": converted_date,
                        "duration": item.duration * 60,
                        "distance": item.distance,
                        "origin": item.origin,
                        "destination": item.destination
                    });
                });

            }

            return results;
        }

        var flight = crossfilter(flights);
        var all = flight.groupAll();
        var date = flight.dimension(d => d.date);
        var dates = date.group(d3v3.time.day);
        var hour = flight.dimension(function(d) { return d.date.getHours() + d.date.getMinutes() / 60; });
        var hours = hour.group(Math.floor);
        var duration = flight.dimension(function(d) { return d.duration; });
        var durationMean = Math.round(d3v3.mean(flights, d => d.duration));
        var durations = duration.group(function(d) { return Math.floor(d / 10) * 10; });
        var distance = flight.dimension(function(d) { return d.distance; });
        var distanceMean = Math.round(d3v3.mean(flights, d => d.distance));
        var distances = distance.group(function(d) { return Math.floor(d / 50) * 50; });

        var formatNumber = d3v3.format(",d"),
            formatFloat = d3v3.format(".1f"),
            formatChange = d3v3.format("+,d"),
            formatDate = d3v3.time.format("%B %d, %Y"),
            formatTime = d3v3.time.format("%I:%M %p");

        // A nest operator, for grouping the flight list.
        var nestByDate = d3v3.nest()
            .key(function(d) { return d3v3.time.day(d.date); });

        // Create the crossfilter for the relevant dimensions and groups.

        var charts = [
            barChart()
            .dimension(hour)
            .group(hours)
            .x(d3v3.scale.linear()
                .domain([0, 24])
                .rangeRound([0, 10 * 24])),

            barChart()
            .dimension(duration)
            .group(durations)
            .x(d3v3.scale.linear()
                .domain([durationMean - 105, durationMean + 105])
                .rangeRound([0, 10 * 21])),

            barChart()
            .dimension(distance)
            .group(distances)
            .x(d3v3.scale.linear()
                .domain([distanceMean - 1000, distanceMean + 1000])
                .rangeRound([0, 10 * 40])),

            barChart()
            .dimension(date)
            .group(dates)
            .round(d3v3.time.day.round)
            .x(d3v3.time.scale()
                .domain([new Date(2019, 8, 1), new Date(2019, 11, 1)])
                .rangeRound([0, 10 * 90]))
            // .filter([new Date(2019, 9, 1), new Date(2019, 10, 1)])
        ];

        // Given our array of charts, which we assume are in the same order as the
        // .chart elements in the DOM, bind the charts to the DOM and render them.
        // We also listen to the chart's brush events to update the display.
        var chart = d3v3.selectAll(".chart")
            .data(charts)
            .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });

        // Render the initial lists.
        var list = d3v3.selectAll(".list")
            .data([flightList]);

        // Render the total.
        d3v3.selectAll("#total")
            .text(formatNumber(flight.size()));

        renderAll();

        // Renders the specified chart or list.
        function render(method) {
            d3v3.select(this).call(method);
        }

        // Whenever the brush moves, re-rendering everything.
        function renderAll() {
            chart.each(render);
            list.each(render);
            d3v3.select("#active").text(formatNumber(all.value()));
        }

        // Like d3.time.format, but faster.
        function parseDate(d) {
            return new Date(2019,
                d.substring(0, 2) - 1,
                d.substring(2, 4),
                d.substring(4, 6),
                d.substring(6, 8));
        }

        window.filter = function(filters) {
            filters.forEach(function(d, i) { charts[i].filter(d); });
            renderAll();
        };

        window.reset = function(i) {
            charts[i].filter(null);
            renderAll();
        };

        function flightList(div) {
            var flightsByDate = nestByDate.entries(date.top(40));

            div.each(function() {
                var date = d3v3.select(this).selectAll(".date")
                    .data(flightsByDate, function(d) { return d.key; });

                date.enter().append("div")
                    .attr("class", "date")
                    .append("div")
                    .attr("class", "day")
                    .text(function(d) { return formatDate(d.values[0].date); });

                date.exit().remove();

                var flight = date.order().selectAll(".flight")
                    .data(function(d) { return d.values; }, function(d) { return d.index; });

                var flightEnter = flight.enter().append("div")
                    .attr("class", "flight");

                flightEnter.append("div")
                    .attr("class", "time")
                    .text(function(d) { return formatTime(d.date); });

                flightEnter.append("div")
                    .attr("class", "origin")
                    .text(function(d) { return d.origin; });

                flightEnter.append("div")
                    .attr("class", "destination")
                    .text(function(d) { return d.destination; });

                flightEnter.append("div")
                    .attr("class", "distance")
                    .text(d => formatFloat(d.distance) + " mi.");

                flightEnter.append("div")
                    .attr("class", "duration")
                    .classed("early", function(d) { return d.duration < 0; })
                    .text(d => formatFloat(d.duration) + " min.");

                flight.exit().remove();

                flight.order();
            });
        }

        function barChart() {
            if (!barChart.id) barChart.id = 0;

            var margin = { top: 10, right: 10, bottom: 20, left: 50 },
                x,
                y = d3v3.scale.linear().range([100, 0]),
                id = barChart.id++,
                axis = d3v3.svg.axis().orient("bottom"),
                yaxis = d3v3.svg.axis().orient("right").ticks(5),
                brush = d3v3.svg.brush(),
                brushDirty,
                dimension,
                group,
                round;

            function chart(div) {
                var width = x.range()[1],
                    height = y.range()[0];

                y.domain([0, group.top(1)[0].value]);
                yaxis.scale(y)

                div.each(function() {
                    var div = d3v3.select(this),
                        g = div.select("g");

                    // Create the skeletal chart.
                    if (g.empty()) {
                        div.select(".title").append("a")
                            .attr("href", "javascript:reset(" + id + ")")
                            .attr("class", "reset")
                            .text("reset")
                            .style("display", "none");

                        g = div.append("svg")
                            .attr("width", width + margin.left + margin.right)
                            .attr("height", height + margin.top + margin.bottom)
                            .append("g")
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                        g.append("clipPath")
                            .attr("id", "clip-" + id)
                            .append("rect")
                            .attr("width", width)
                            .attr("height", height);

                        g.selectAll(".bar")
                            .data(["background", "foreground"])
                            .enter().append("path")
                            .attr("class", function(d) { return d + " bar"; })
                            .datum(group.all());

                        g.selectAll(".foreground.bar")
                            .attr("clip-path", "url(#clip-" + id + ")");

                        g.append("g")
                            .attr("class", "axis")
                            .attr("id", "x-axis")
                            .attr("transform", "translate(0," + height + ")")
                            .call(axis);

                        g.append("g")
                            .attr("class", "axis")
                            .attr("id", "y-axis")
                            // .attr("transform", `translate(${margin.left}, 0)`)
                            .call(yaxis);

                        // Initialize the brush component with pretty resize handles.
                        var gBrush = g.append("g").attr("class", "brush").call(brush);
                        gBrush.selectAll("rect").attr("height", height);
                        gBrush.selectAll(".resize").append("path").attr("d", resizePath);

                    } else {
                        g.select("#x-axis")
                            .call(axis)

                        g.select("#y-axis")
                            .call(yaxis)
                    }

                    // Only redraw the brush if set externally.
                    if (brushDirty) {
                        brushDirty = false;
                        g.selectAll(".brush").call(brush);
                        div.select(".title a").style("display", brush.empty() ? "none" : null);
                        if (brush.empty()) {
                            g.selectAll("#clip-" + id + " rect")
                                .attr("x", 0)
                                .attr("width", width);
                        } else {
                            var extent = brush.extent();
                            g.selectAll("#clip-" + id + " rect")
                                .attr("x", x(extent[0]))
                                .attr("width", x(extent[1]) - x(extent[0]));
                        }
                    }

                    g.selectAll(".bar").attr("d", barPath);
                });

                function barPath(groups) {
                    var path = [],
                        i = -1,
                        n = groups.length,
                        d;
                    while (++i < n) {
                        d = groups[i];
                        path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
                    }
                    return path.join("");
                }

                function resizePath(d) {
                    var e = +(d == "e"),
                        x = e ? 1 : -1,
                        y = height / 3;
                    return "M" + (.5 * x) + "," + y +
                        "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) +
                        "V" + (2 * y - 6) +
                        "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y) +
                        "Z" +
                        "M" + (2.5 * x) + "," + (y + 8) +
                        "V" + (2 * y - 8) +
                        "M" + (4.5 * x) + "," + (y + 8) +
                        "V" + (2 * y - 8);
                }
            }

            brush.on("brushstart.chart", function() {
                var div = d3v3.select(this.parentNode.parentNode.parentNode);
                div.select(".title a").style("display", null);
            });

            brush.on("brush.chart", function() {
                var g = d3v3.select(this.parentNode),
                    extent = brush.extent();
                if (round) g.select(".brush")
                    .call(brush.extent(extent = extent.map(round)))
                    .selectAll(".resize")
                    .style("display", null);
                g.select("#clip-" + id + " rect")
                    .attr("x", x(extent[0]))
                    .attr("width", x(extent[1]) - x(extent[0]));
                dimension.filterRange(extent);
            });

            brush.on("brushend.chart", function() {
                if (brush.empty()) {
                    var div = d3v3.select(this.parentNode.parentNode.parentNode);
                    div.select(".title a").style("display", "none");
                    div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
                    dimension.filterAll();
                }
            });

            chart.margin = function(_) {
                if (!arguments.length) return margin;
                margin = _;
                return chart;
            };

            chart.x = function(_) {
                if (!arguments.length) return x;
                x = _;
                axis.scale(x);
                brush.x(x);
                return chart;
            };

            chart.y = function(_) {
                if (!arguments.length) return y;
                yaxis.scale(y);
                y = _;
                return chart;
            };

            chart.dimension = function(_) {
                if (!arguments.length) return dimension;
                dimension = _;
                return chart;
            };

            chart.filter = function(_) {
                if (_) {
                    brush.extent(_);
                    dimension.filterRange(_);
                } else {
                    brush.clear();
                    dimension.filterAll();
                }
                brushDirty = true;
                return chart;
            };

            chart.group = function(_) {
                if (!arguments.length) return group;
                group = _;
                return chart;
            };

            chart.round = function(_) {
                if (!arguments.length) return round;
                round = _;
                return chart;
            };

            return d3v3.rebind(chart, brush, "on");
        }
    });



    function mergeData(timeTable) {
        timeTable.forEach(item => {
            item['departSchTimeUTC'] = moment.tz(item.origin_date, item.origin_timezone).utc().format();
            item['arrivalSchTimeUTC'] = moment.tz(item.destination_date, item.destination_timezone).utc().format();
            item['duration'] = ((moment.tz(item.destination_date, item.destination_timezone).utc().valueOf() -
                    moment.tz(item.origin_date, item.origin_timezone).utc().valueOf()) / 1000) / 60 / 60 // unit: hours
            let source = new LatLon(item.origin_coords[1], item.origin_coords[0]);
            let target = new LatLon(item.destination_coords[1], item.destination_coords[0]);
            item.distance = source.distanceTo(target, 3959); // unit: miles
            item.midPoint = source.midpointTo(target).toGeoJSON(); // Lon Lat
        });

        return timeTable;
    }

}
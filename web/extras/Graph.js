//controls d3 functionality for adding bus data to plot

define(["dojo/_base/declare", "dojo/_base/lang", "dojo/_base/array", "dojo/dom"],
function (declare, lang, array, dom) {
    return declare([], {
        //keep track of all bus trips
        all_buses: [],
        bunches: [],
        bunch_pred: [],

        constructor: function (svg, direction) {
            var objDiv = document.getElementById("graph");
            objDiv.scrollTop = objDiv.scrollHeight;
            this.svg = svg;

            var graph_width = d3.select("#graph")[0][0].clientWidth - margin.left - margin.right;

            // Scale the range of the data
            if (direction == 'WEST') {
                this.x_range = d3.scale.linear().range([0, graph_width]);
                this.x_range.domain([18500, 0]); //19km route
            }
            else { //EAST
                this.x_range = d3.scale.linear().range([0, graph_width]);
                this.x_range.domain([0, 17200]); //19km route
            }
            this.y_range = d3.time.scale().range([height, 0]);
            this.y_range.domain([startTime, endTime]);

            // Define the axes
            this.xAxis = d3.svg.axis()
                .scale(this.x_range)
                .orient("bottom")
                .ticks(8)
                //.innerTickSize(-width)
                //.outerTickSize(0)
                .tickFormat(function (d) {
                    return (d / 1000) + ' km';
                });

            this.yAxis = d3.svg.axis()
                .scale(this.y_range)
                .orient("left")
                .ticks(d3.time.minute, 10).tickPadding(10);

            //line generator
            this.valueline = d3.svg.line()
                .x(function (bus) {
                    return this.x_range(bus.dist);
                })
                .y(function (bus) {
                    return this.y_range(bus.timestmp);
                });
        },

        init: function () {
            //groups
            this.dotGroup = this.svg.append("g").attr("class", "dots");
            this.bunchGroup = this.svg.append("g").attr("class", "bunches");
            this.predGroup = this.svg.append("g").attr("class", "pred");
            this.lineGroup = this.svg.append("g").attr("class", "lines");

            // Add the X Axis
            this.svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(this.xAxis);

            // Add the Y Axis
            this.svg.append("g")
                .attr("class", "y axis")
                .call(this.yAxis
                  //  .tickSize(-height, 100, 1)
                );
        },

        //needed for when then the timer loops back around
        clear: function () {
            this.all_buses = [];
            this.bunches = [];
            this.bunch_pred = [];
            this.dotGroup.selectAll("g").data([]).exit().remove();
            this.bunchGroup.selectAll("rect").data([]).exit().remove();
            this.predGroup.selectAll("rect").data([]).exit().remove();
            this.lineGroup.selectAll("g").data([]).exit().remove();
        },

        addPoints: function(data) {
            //points and lines
            //probably a better way to do a multi-line graph points at a time.
            //but need to build the lines and choose a color one trip at a time
            var buses = this.parseBuses(data);
            for (var key in buses) {
                if (!this.all_buses[key]) {
                    this.all_buses[key] = [];
                }
                this.all_buses[key].push(buses[key]);
            }

            //for each bus, add points and lines
            for (var key in buses) {
                if (buses.hasOwnProperty(key)) {
                    bus_line = this.all_buses[key];
                    color = bus_colors[key];

                    //lines
                    if (bus_line.length > 1) {
                        lines = [bus_line[bus_line.length - 1], bus_line[bus_line.length - 2]];
                        this.lineGroup.append("g").attr("class", "line").attr("stroke", color)
                            .selectAll("path")
                            .data(lines)
                            .enter()
                            .append("path")
                            .attr("d", this.valueline(lines));
                    }

                    //scatter points
                    this.dotGroup.append("g").attr("class", "dot").attr("stroke", color).attr("fill", color)
                        .selectAll("circle")
                        .data(bus_line)
                        .enter()
                        .append("circle")
                        .attr("r", 4)
                        .attr("cx", lang.hitch(this, function (bus) {
                            return this.x_range(bus.dist);
                        }))
                        .attr("cy", lang.hitch(this, function (bus) {
                            return this.y_range(bus.timestmp);
                        }));

                    //auto scroll
                    if (bus_line.length > 1) {
                        var objDiv = document.getElementById("graph");
                        objDiv.scrollTop = (objDiv.scrollHeight * (this.y_range(bus_line[bus_line.length - 1].timestmp) / height)) - 80;
                    }
                }
            }
        },

        addLabels: function(bunched) {
            this.bunches = this.bunches.concat(bunched);
            //bunched circles
            this.bunchGroup.selectAll("rect")
                .data(this.bunches)
                .enter()
                .append("rect")
                .attr("width", 25)
                .attr("height", 25)
                .attr("x", lang.hitch(this, function (d) {
                    return this.x_range(d.attributes.dist) - 12;
                }))
                .attr("y", lang.hitch(this, function (d) {
                    return this.y_range(d.attributes.timestmp) - 12;
                }));

        },

        addPredictions: function(pred) {
            this.bunch_pred = this.bunch_pred.concat(pred);

            //predictions
            this.predGroup.selectAll("rect")
                .data(this.bunch_pred)
                .enter()
                .append("rect")
                .attr("width", 25)
                .attr("height", 25)
                .attr("x", lang.hitch(this, function (d) {
                    return this.x_range(d.attributes.dist) - 12;
                }))
                .attr("y", lang.hitch(this, function (d) {
                    return this.y_range(d.attributes.timestmp) - 12;
                }));


        },

        //this draws the points on the graph
        renderGraph: function (bunched, pred) {

            this.bunches = this.bunches.concat(bunched);
            this.bunch_pred = this.bunch_pred.concat(pred);

            //predictions
            this.predGroup.selectAll("rect")
                .data(this.bunch_pred)
                .enter()
                .append("rect")
                .attr("width", 25)
                .attr("height", 25)
                .attr("x", lang.hitch(this, function (d) {
                    return this.x_range(d.attributes.dist) - 12;
                }))
                .attr("y", lang.hitch(this, function (d) {
                    return this.y_range(d.attributes.timestmp) - 12;
                }));


            //bunched circles
            this.bunchGroup.selectAll("rect")
                .data(this.bunches)
                .enter()
                .append("rect")
                .attr("width", 25)
                .attr("height", 25)
                .attr("x", lang.hitch(this, function (d) {
                    return this.x_range(d.attributes.dist) - 12;
                }))
                .attr("y", lang.hitch(this, function (d) {
                    return this.y_range(d.attributes.timestmp) - 12;
                }));
        },

        //extract useful bus info
        parseBuses: function (data) {
            var buses = {};
            dojo.forEach(data, function (bus) {
                buses[bus.attributes.utrip_id] = bus.attributes;
            });
            return buses
        }
    });
});

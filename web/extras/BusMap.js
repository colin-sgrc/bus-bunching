define(["dojo/_base/declare", "dojo/_base/lang", "dojo/_base/array", "esri/map", "esri/layers/FeatureLayer", "esri/TimeExtent", "esri/layers/TimeInfo", "esri/request",
          "esri/layers/ArcGISTiledMapServiceLayer", "esri/Color",
          "esri/dijit/TimeSlider", "esri/renderers/TemporalRenderer", "dojo/dom", "dojo/date", "extras/Graph", "extras/HeatMap", "dijit/form/Button"
],
function (declare, lang, array, Map, FeatureLayer, TimeExtent, TimeInfo, esriRequest, ArcGISTiledMapServiceLayer, Color, TimeSlider, TemporalRenderer, dom, date, Graph, HeatMap, Button
        ) {
    return declare([], {
        id: null,
        map: null,
        queued_bunched_buses: [],
        bunched_buses: [],
        timeSlider: null,
        direction: 'EAST',

        constructor: function (id, map, graph, direction, bunching, timeSlider) {
            this.id = id;
            this.map = map;
            this.graph = graph;
            this.direction = direction;
            this.heatMap = new HeatMap(this.map, 'bunchedLayer', ["rgba(255, 0, 0, 0)", "rgb(255, 0, 0, .6)"]);
            this.timeSlider = timeSlider;

            this.bunched_buses = bunching;

        },

        load: function () {
            this.map.on("load", lang.hitch(this, this.mapLoaded));
        },

        mapLoaded: function () {
            //base
            this.map.getLayer(this.map.basemapLayerIds[0]).opacity = 0.6;

            //route
            var route = new FeatureLayer("https://services5.arcgis.com/XrtpqcDueqFng6WV/arcgis/rest/services/trip/FeatureServer/3", {
                mode: FeatureLayer.MODE_SNAPSHOT,
                opacity: 0.4
            });
            var route_eb = new FeatureLayer("https://services5.arcgis.com/XrtpqcDueqFng6WV/arcgis/rest/services/trip/FeatureServer/2", {
                mode: FeatureLayer.MODE_SNAPSHOT,
                opacity: 0.4
            });
            var buses = new FeatureLayer("https://services5.arcgis.com/XrtpqcDueqFng6WV/arcgis/rest/services/trip/FeatureServer/0", {
                mode: FeatureLayer.MODE_SNAPSHOT,
                opacity: 0.4
            });

            this.map.addLayer(route);
            //this.map.addLayer(route_eb);
            this.map.addLayer(buses);

            // feature layer
            var featureLayer = new FeatureLayer("https://services5.arcgis.com/XrtpqcDueqFng6WV/arcgis/rest/services/trip/FeatureServer/1", {
                id: "buses",
                mode: FeatureLayer.MODE_SNAPSHOT,
                styling: false,
                outFields: ["*"],
                dataAttributes: ["id"],
                definitionExpression: "dir = '" + this.direction + "'"
            });

            var timeExtent = new TimeExtent();
            timeExtent.startTime = startTime;
            timeExtent.endTime = endTime;
            featureLayer.setTimeDefinition(timeExtent);
            featureLayer.on("load", lang.hitch(this, this.featureLayerLoaded));

            if (featureLayer.surfaceType === "svg") {
                //bus draw event
                featureLayer.on("graphic-draw", lang.hitch(this, this.featureGraphicDraw));
            }
            this.map.addLayer(featureLayer);
        },

        featureLayerLoaded: function (evt) {
            //this.timeSlider.on("time-extent-change", lang.hitch(this, this.displayTimeInfo));

            if (this.id == "labelMap") {
                this.timeSlider.createTimeStopsByTimeInterval(evt.layer.getTimeDefinition(), 1, TimeInfo.UNIT_MINUTES);
                this.timeSlider.startup();
                this.timeSlider.play();
            }

            this.map.setTimeSlider(this.timeSlider);
        },

        //draw the bus
        featureGraphicDraw: function (evt) {
            var key = evt.graphic.attributes.utrip_id;

            if (evt.graphic.visible == true) {
                if (bus_colors.hasOwnProperty(key)) {
                    color = bus_colors[key];
                }
                else {
                    //grab a random color
                    var rad = Math.floor(Math.random() * (colors.length));
                    color = colors[rad];
                    bus_colors[key] = color;
                }

                // set the data attribute for the current feature
                evt.node.setAttribute("class", "bus");
                evt.node.setAttribute("stroke", color);
            }
        },

        //trigger when time changes
        updateMap: function (timeExtent, buses) {
            //find the bunched buses
            bunched = array.filter(buses, function (graphic) {
                return this.bunched_buses.indexOf(graphic.attributes.id) >= 0;
            }, this);

            this.graph.addLabels(bunched);

            var timeInt = timeExtent.startTime.getTime() / 1000 / 60;
            //clear out the heatmap every hour
            if (timeInt % 60 == 0) {
                this.heatMap.clearFeatures();
            }

            //add to the heatmap layer.  do every 10 minutes
            this.queued_bunched_buses = this.queued_bunched_buses.concat(bunched);
            if (this.bunched_buses.length > 0 && timeInt % 5 == 0) {
                if (this.queued_bunched_buses.length > 0) {
                    this.heatMap.updateFeatures(this.queued_bunched_buses);
                }
                this.queued_bunched_buses = [];
            }

        }
    });

}
  );


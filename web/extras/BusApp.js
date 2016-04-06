define(["dojo/_base/declare", "dojo/_base/lang", "dojo/_base/array", "esri/map", "esri/layers/FeatureLayer", "esri/TimeExtent", "esri/layers/TimeInfo", "esri/request",
          "esri/layers/ArcGISTiledMapServiceLayer", "esri/Color",
          "esri/dijit/TimeSlider", "esri/renderers/TemporalRenderer", "dojo/dom", "dojo/date", "extras/BusMap", "extras/PredictionMap", "extras/Graph", "extras/HeatMap", "dijit/form/Button"
],
function (declare, lang, array, Map, FeatureLayer, TimeExtent, TimeInfo, esriRequest, ArcGISTiledMapServiceLayer, Color, TimeSlider, TemporalRenderer, dom, date, BusMap, PredictionMap, Graph, HeatMap, Button
        ) {
    return declare([], {
        timeSlider: null,
        playPause: null,
        busMap: null,
        predictionMap: null,
        graph: null,
        direction: null,

        constructor: function (graph, direction) {
            this.graph = graph;
            this.direction = direction;
        },

        init: function() {
            this.timeSlider = new TimeSlider({ style: "width:100%; display:none", loop: true }, dom.byId("timeSliderDiv"));
            this.timeSlider.setThumbCount(2);
            this.timeSlider.setThumbIndexes([0, 0]);
            this.timeSlider.on("time-extent-change", lang.hitch(this, this.displayTimeInfo));

            //button to play/pause
            this.playPause = new Button({
                label: "Pause"
            }, "btnPlayPause");
            this.playPause.startup();
            this.playPause.placeAt(dom.byId("play_pause"));

            this.playPause.on("click", lang.hitch(this, function () {
                if (this.timeSlider.playing) {
                    this.timeSlider.pause();
                    this.playPause.set("label", "Play");
                }
                else {
                    this.timeSlider.play();
                    this.playPause.set("label", "Pause");
                }
            }));

            //load the file that defines bunched trip ids
            var bunched_json = esriRequest({
                url: "data/bunched.json",
                handleAs: "json"
            });
            var bunched_pred_json = esriRequest({
                url: "data/bunched_predictions.json",
                handleAs: "json"
            });

            bunched_json.then(lang.hitch(this, function (bunched) {
                bunching = [];

                array.forEach(bunched.records, lang.hitch(this, function (record) {
                    bunching.push(record.id);
                }));

                //create the map
                var labelMap = new Map("map", {
                    basemap: "topo",
                    center: [-123.02, 49.278],
                    slider: true,
                    zoom: 13
                });

                //this is the trapping the bus layer, to configure the 
                this.busMap = new BusMap("labelMap", labelMap, this.graph, this.direction, bunching, this.timeSlider);
                this.busMap.load();
   
            }),
            function (error) {
                console.log("Error: ", error.message);
            });

            bunched_pred_json.then(lang.hitch(this, function (bunched) {
                bunching = [];

                array.forEach(bunched.records, lang.hitch(this, function (record) {
                    bunching.push(record.id);
                }));

                //create the map
                var predictionMap = new Map("predictionMap", {
                    basemap: "topo",
                    center: [-123.02, 49.278],
                    slider: true,
                    zoom: 13
                });
                predictionMap.getBasemap().opacity = 0.5;
                /*
                //temporal
                var timeExtent = new TimeExtent();
                timeExtent.startTime = startTime;
                timeExtent.endTime = endTime;

                featureLayer.setTimeDefinition(timeExtent);
                featureLayer.on("load", lang.hitch(this, this.featureLayerLoaded));
                */
                this.predictionMap = new PredictionMap("predictionMap", predictionMap, this.graph, this.direction, bunching, this.timeSlider);
                this.predictionMap.load();

            }),
              function (error) {
                  console.log("Error: ", error.message);
              });

        },

        //setup the temporal data
        featureLayerLoaded: function (evt) {
            if (evt.layer.id == "buses") {
//                this.busLayerLoaded();
            }
        },

        busLayerLoaded: function() {
            // create time slider
            this.timeSlider = new TimeSlider({ style: "width:100%; display:none", loop: true }, dom.byId("timeSliderDiv"));
            this.timeSlider.setThumbCount(2);
            this.timeSlider.createTimeStopsByTimeInterval(evt.layer.getTimeDefinition(), 1, TimeInfo.UNIT_MINUTES);
            this.timeSlider.setThumbIndexes([0, 0]);
            this.busMap.featureLayerLoaded(this.timeSlider);
            this.timeSlider.startup();
            evt.layer.getMap().setTimeSlider(this.timeSlider);
            this.timeSlider.play();
        },

        //trigger when time changes
        displayTimeInfo: function (timeExtent) {
            var st = timeExtent.startTime;

            var info = st.toLocaleDateString("en-US") + ' ' + st.toLocaleTimeString("en-US");
            dom.byId("timeInfo").innerHTML = info;

            var bus_layer = this.busMap.map.getLayer("buses");
            var buses = array.filter(bus_layer.graphics, function (graphic) {
                return graphic.visible == true;
            });

            //render new points on the graph
            this.busMap.updateMap(timeExtent, buses);
            this.predictionMap.updateMap(timeExtent, buses);
            this.graph.addPoints(buses);

            //re-init graph if we loop around
            if (startTime - this.timeSlider.getCurrentTimeExtent().startTime == 0) {
                this.graph.clear();
            }

        }
    });

}
  );


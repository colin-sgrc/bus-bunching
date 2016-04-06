define(["dojo/_base/declare", "dojo/_base/lang", "dojo/_base/array", "esri/map", "esri/layers/FeatureLayer", "esri/geometry/Point", "esri/SpatialReference",
        "esri/graphic", "esri/renderers/HeatmapRenderer", "dojo/dom"],
function (declare, lang, array, Map, FeatureLayer, Point, SpatialReference, Graphic, HeatmapRenderer, dom) {
    return declare([], {

    constructor: function (map, id, colors) {
        this.map = map;
        this.colors = colors;

        this.featureCollection = {
            "layerDefinition": null,
            "featureSet": {
                "features": [],
                "geometryType": "esriGeometryPoint"
            }
        };
        this.featureCollection.layerDefinition = {
            "geometryType": "esriGeometryPoint",
            "objectIdField": "OID",
            "fields": [{
                "name": "OID",
                "alias": "OID",
                "type": "esriFieldTypeOID"
            },
            {
                "name": "id",
                "alias": "id",
                "type": "esriFieldTypeString"
            }]
        };
        this.featureLayer = new FeatureLayer(this.featureCollection, {
            id: id
        });
        this.map.on("load", lang.hitch(this, this.mapLoaded));
    },

    mapLoaded: function () {
        //do the heatmap stuff.  we need a heatmap renderer and a custom feature collection that stores the trip ids that are bunched
        var heatmapRenderer = new HeatmapRenderer({
            colors: this.colors,
            blurRadius: 8,
            maxPixelIntensity: 4,
            minPixelIntensity: 0
        });
        this.featureLayer.setRenderer(heatmapRenderer);
        this.map.addLayer(this.featureLayer);
    },

    updateFeatures:function (bunched_buses) {
        //var buses = this.parseBuses(data);

        var features = [];
        array.forEach(bunched_buses, function (bus) {
            var attr = {};
            attr["id"] = bus.attributes.id;
            var geometry = new Point(bus.attributes.x, bus.attributes.y, new SpatialReference({ wkid: 3857 }));
            var graphic = new Graphic(geometry);
            graphic.setAttributes(attr);
            features.push(graphic);
        }, this);

        if (features.length > 0) {
            this.featureLayer.applyEdits(features, null, null);
            this.featureLayer.redraw();
        }
    },

    clearFeatures: function () {
        this.featureLayer.clear();
        this.featureLayer.redraw();
    }

});
});
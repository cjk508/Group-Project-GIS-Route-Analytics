/**
 * Add all your dependencies here.
 *
 * @require Popup.js
 * @require LayersControl.js
 */

// ========= config section ================================================
var url = "/geoserver/ows?";
var center = [-121468.12084883929, 7163110.329270016];
var zoom = 11;
var min_delay = Number.POSITIVE_INFINITY;
var max_delay = Number.NEGATIVE_INFINITY;
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');
// =========================================================================

var mapLayer = new ol.layer.Tile({
    source: new ol.source.TileWMS({
        url: url,
        params : {"LAYERS": "county:grayMap"}
    })
});

var overviewLayer = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: url + "service=WFS&version=2.0.0&request=GetFeature&typeName=county:details&outputFormat=application/json",
        format: new ol.format.GeoJSON()
    })
});

var timeHeatmapLayer = new ol.layer.Heatmap({
    source: new ol.source.Vector({
        url: url + "service=WFS&version=2.0.0&request=GetFeature&typeName=county:overview&outputFormat=application/json",
        format: new ol.format.GeoJSON()
    }),
    radius: 10,
    shadow: 500
});

var densityHeatmapLayer = new ol.layer.Heatmap({
    source: new ol.source.Vector({
        url: url + "service=WFS&version=2.0.0&request=GetFeature&typeName=county:overview&outputFormat=application/json",
        format: new ol.format.GeoJSON()
    })
});

timeHeatmapLayer.getSource().on('change', function(evt){
    var source = evt.target;
    if (source.getState() === 'ready') {
        source.getFeatures().forEach(function(feature){
            var delay = feature.get('time_sec_delayed');
            if(delay< min_delay) min_delay = delay;
            if(delay > max_delay) max_delay = delay;
        });

    }
});

timeHeatmapLayer.getSource().on('addfeature', function(event) {
    var delay = event.feature.get('time_sec_delayed');
    event.feature.set('weight', normalise(delay));
    event.feature.set('radius', delay);
});

/**
 * Create an overlay to anchor the popup to the map.
 */
var overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
    element: container,
    autoPan: true,
    autoPanAnimation: {
        duration: 250
    }
}));

// create the OpenLayers Map object
var map = new ol.Map({
    // render the map in the 'map' div
    target: document.getElementById('map'),
    // use the Canvas renderer
    renderer: 'canvas',
    //map layers
    layers: [mapLayer, timeHeatmapLayer],
    // initial center and zoom of the map's view
    view: new ol.View({
        center: center,
        zoom: zoom
    }),
    overlays: [overlay]
});

map.addInteraction(new ol.interaction.Select({
    condition: ol.events.condition.pointerMove
}));

map.on('singleclick', function(evt) {
    container.style.display = "block";
    map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
        if (feature) {
            var geometry = feature.getGeometry();
            var coord = geometry.getCoordinates();
            content.innerHTML = "<p>Incident details</p><code>Service Id: " + feature.values_.service_id + "<br /> Trip Id: " +
                feature.values_.trip_id + "<br /> Distance traveled: " + feature.values_.distance_meters + " meters <br/> Time of dispatch: "+
                feature.values_.time_dispatch + "<br /> Time Arrival: " + feature.values_.time_arrival + "<br/> Delay: " +
                feature.values_.time_sec_delayed + " seconds <br />Vehicle type: ND10 HSL Sembcorp Ford Transit <br /> Staff Count: 2</code>";
            overlay.setPosition(coord);
        }
    });
});

function normalise(n){
    return (n-min_delay)/(max_delay - min_delay)
}

/**
 * Add a click handler to hide the popup.
 * @return {boolean} Don't follow the href.
 */
closer.onclick = function() {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
};

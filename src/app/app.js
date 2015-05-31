/**
 * Add all your dependencies here.
 *
 * @require Popup.js
 * @require LayersControl.js
 * @require FunctionExecuteControl.js
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
var detailsLayerName = "details";
var stringMap = { 'overview': 'Incident', 'details': 'Incident detail' };

// =========================================================================

//setup feature id map for popups
var featureIdMap = {};
var featureIdSelected = "";
var featuresSelected = [];

var mapLayer = new ol.layer.Tile({
    source: new ol.source.TileWMS({
        url: url,
        params : {"LAYERS": "county:grayMap"}
    })
});

var journeysVectorLayer = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: url + "service=WFS&version=2.0.0&request=GetFeature&typeName=county:" + detailsLayerName + "&outputFormat=application/json",
        format: new ol.format.GeoJSON()
    }),
    opacity: 0
});

var journeysTileLayer = new ol.layer.Tile({
    source: new ol.source.TileWMS({
        url: url,
        params: {'LAYERS': "county:" + detailsLayerName, 'TILED': true},
        servertype: 'geoserver'
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

var pointsLayer = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: url + "service=WFS&version=2.0.0&request=GetFeature&typeName=county:overview&outputFormat=application/json",
        format: new ol.format.GeoJSON()
    }),
    style: new ol.style.Style({
        image: new ol.style.Circle({
            fill: new ol.style.Fill({
                color: 'rgba(0,0,0, 0.4)'
            }),
            stroke: new ol.style.Stroke({
                color: 'rgb(0,0,0)',
                width: 1.25
            }),
            radius: 15
        })
    })
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

function normalise(n){
    return (n-min_delay)/(max_delay - min_delay)
}

/**
 * Create an overlay to anchor the popup to the map.
 */
var overlay = new ol.Overlay({
    element: container,
    autoPan: true,
    autoPanAnimation: {
        duration: 250
    }
});

container.style.display = "block";
overlay.setPosition(undefined);

/**
 * Add a click handler to hide the popup.
 * @return {boolean} Don't follow the href.
 */
closer.onclick = function() {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
};

// create the OpenLayers Map object
var map = new ol.Map({
    // render the map in the 'map' div
    target: document.getElementById('map'),
    // use the Canvas renderer
    renderer: 'canvas',
    //map layers
    layers: [mapLayer, timeHeatmapLayer, journeysTileLayer, journeysVectorLayer, pointsLayer],
    // initial center and zoom of the map's view
    view: new ol.View({
        center: center,
        zoom: zoom
    }),
    overlays: [overlay],
    controls: ol.control.defaults({
                attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
                  collapsible: false
                })
              }).extend([new app.FunctionExecuteControl({
        name:  "R",
        title: "Reset feature selection",
        func: resetFeature}
    )])
});

map.on('singleclick', function(evt) {

    closer.click();

    pixel = evt.pixel;
    
    topright = [pixel[0] + 15, pixel[1] + 15];
    bottomleft = [pixel[0] - 15, pixel[1] - 15];

    extent = ol.extent.boundingExtent([map.getCoordinateFromPixel(topright), map.getCoordinateFromPixel(bottomleft)]);

    if (pointsLayer.getVisible() && pointsLayer.getSource().getFeaturesInExtent(extent).length == 1 ){

        feature = pointsLayer.getSource().getFeaturesInExtent(extent)[0];

        mapPopup(feature.getId());

    } else {

        found_features = [];

//        if (pointsLayer.getVisible()) {
//            pointsLayer.getSource().forEachFeatureInExtent(extent, function (feature) {
//                found_features.push(feature);
//            });
//        }

        if (timeHeatmapLayer.getVisible()) {
            timeHeatmapLayer.getSource().forEachFeatureInExtent(extent, function (feature) {
                found_features.push(feature);
            });
        }

        if (journeysVectorLayer.getVisible()) {
            journeysVectorLayer.getSource().forEachFeatureInExtent(extent, function (feature) {
                found_features.push(feature)
            });
        }
        
        if(featureIdSelected)
        {
            var mainFeature = featureIdSelected.substring(0, featureIdSelected.lastIndexOf('.'));
            
            //found_features = found_features.filter(function(e){
            //    return e.getId().startsWith(mainFeature);
            //});
            found_features = [getClosestSelectedFeature(map.getCoordinateFromPixel(pixel)) ];
        }
        
        if (found_features.length > 1) {
            content.innerHTML = "<p>Select an Incident</p>";
            
            var added = [];
            found_features.forEach(function (feature) {
                var id = feature.get('trip_id')
                if( added.indexOf(id) < 0){
                    var typeString = stringMap[feature.getId().substring(0, feature.getId().indexOf('.'))];
                    content.innerHTML = content.innerHTML + "<code><a class='feature-link' onclick='mapPopup(\"" + feature.getId() + "\")'>" + typeString + ": " + feature.get('trip_id') + "</a></code><br/>";
                    added.push(id);
                }
            });

            overlay.setPosition(evt.coordinate);
        } else if (found_features.length == 1) {
            mapPopup(found_features[0].getId());
        }else{

        }
    }
});

map.on('moveend', function(evt) {

    if (this.getView().getZoom() <= 8 ) {
        journeysVectorLayer.setVisible(false);
        journeysTileLayer.setVisible(false);
        timeHeatmapLayer.setVisible(true);
        pointsLayer.setVisible(false);
    } else if(this.getView().getZoom() <= 12){
        journeysVectorLayer.setVisible(true);
        journeysTileLayer.setVisible(true);
        timeHeatmapLayer.setVisible(false);
        pointsLayer.setVisible(false);
    } else {
        journeysVectorLayer.setVisible(true);
        journeysTileLayer.setVisible(true);
        timeHeatmapLayer.setVisible(false);
        pointsLayer.setVisible(true);
    }
});

function mapPopup(featureid){

    feature = getFeatureById(featureid);
    
    featureIdSelected = featureid;
    
    content.innerHTML = "<p>Incident details</p><code>Service Id: " + feature.get("service_id") + "<br /> Trip Id: " +
        feature.get("trip_id") + "<br /> Distance traveled: " + feature.get("distance_meters") + " meters <br/> Time of dispatch: " +
        feature.get("time_dispatch") + "<br /> Time Arrival: " + feature.get("time_arrival") + "<br/> Delay: " +
        feature.get("time_sec_delayed") + " seconds <br />Vehicle type: ND10 HSL Sembcorp Ford Transit <br /> Staff Count: 2</code>";

    coords = feature.getGeometry().getCoordinates();
    
    if (Array.isArray(coords[0])) {
        overlay.setPosition(coords[coords.length -1]);
    } else {
        overlay.setPosition(feature.getGeometry().getCoordinates());
    }
    
    updateTripsForId(featureid);
}

function getFeatureById(featureId) {
    if ($.isEmptyObject(featureIdMap)){
        journeysVectorLayer.getSource().getFeatures().forEach(function(feature) {
            featureIdMap[feature.getId()] = feature;
        });
        timeHeatmapLayer.getSource().getFeatures().forEach(function(feature){
            featureIdMap[feature.getId()] = feature;
        });
        pointsLayer.getSource().getFeatures().forEach(function(feature){
            featureIdMap[feature.getId()] = feature;
        });
    }

    return featureIdMap[featureId];
}

function updateTripsForId(tripIdFull){
    
    var ids = [];
    journeysVectorLayer.getSource().getFeatures().forEach(function(element){
        var tripId = element.getId().substring(0, element.getId().lastIndexOf('.'));
        if(tripIdFull.indexOf(tripId) > -1){
            ids.push(element.getId());
            featuresSelected.push(element);
        }
    });
    journeysTileLayer.getSource().updateParams({"FEATUREID": ids.join()});
}

pointsLayer.getSource().once("change", function() {

    var total_delay_time = 0;
    var total_distance = 0;
    var min_distance = Number.POSITIVE_INFINITY;
    var max_distance = Number.NEGATIVE_INFINITY;
    var seen_service_ids = [];
    var total_trips = 0;

    pointsLayer.getSource().getFeatures().forEach(function(feature) {
        total_delay_time += feature.get("time_sec_delayed");
        total_distance += feature.get("distance_meters");

        if (feature.get("distance_meters") < min_distance) {
            min_distance = feature.get("distance_meters");
        }

        if (feature.get("distance_meters") > max_distance) {
            max_distance = feature.get("distance_meters");
        }

        if (seen_service_ids.indexOf(feature.get("service_id")) == -1) {
            seen_service_ids.push(feature.get("service_id"))
        }

        total_trips++;
    });

    mean_delay_time = total_delay_time / pointsLayer.getSource().getFeatures().length;

    $("#statistics-message").dialog({
        modal: true,
        buttons: {
            OK: function() {
                $(this).dialog("close");
            }
        },
        autoOpen:false,
        width: 'auto'
    }).html("<p>Mean Delay Time: " + Math.round(mean_delay_time) + " seconds</p>" +
        "<p>Minimum Delay Time: " + Math.round(min_delay) + " seconds</p>" +
        "<p>Maximum Delay Time: " + Math.round(max_delay) + " seconds</p>" +
        "<p>Total Distance: " + Math.round(total_distance) / 1000 + " km</p>" +
        "<p>Minimum Distance: " + Math.round(min_distance) / 1000 + " km</p>" +
        "<p>Maximum Distance: " + Math.round(max_distance) / 1000 + " km</p>" +
        "<p>Total Services: " + seen_service_ids.length + "</p>" +
        "<p>Total Trips: " + total_trips +  "</p>" +
        "<p>Mean Trips per Service: " + Math.round(total_trips / seen_service_ids.length) + "</p>"
    )
});

function displayStatistics(){
    $("#statistics-message").dialog("open")
}

function resetFeature(){
    featureIdSelected = "";
    featuresSelected = [];
    journeysTileLayer.getSource().updateParams({"FEATUREID": ""});
    closer.click();
}

function getClosestSelectedFeature(coord){
    var closest = Number.POSITIVE_INFINITY;
    var closestFeatureIndex = -1;
    featuresSelected.forEach(function(feature, index){
        var fCoords = feature.getGeometry().getFlatCoordinates();
        var distance = ol.sphere.WGS84.haversineDistance([fCoords[0], fCoords[1]],coord);
        if(distance < closest) {
            closest = distance;
            closestFeatureIndex = index;
        }
    });
    return featuresSelected[closestFeatureIndex];
}

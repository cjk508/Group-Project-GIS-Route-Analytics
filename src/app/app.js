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
// =========================================================================

var mapLayer = new ol.layer.Tile({
        source: new ol.source.MapQuest({layer: 'osm'})
});

var overviewLayer = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: url + "service=WFS&version=2.0.0&request=GetFeature&typeName=county:details&outputFormat=application/json",
        format: new ol.format.GeoJSON()
    })
});

var heatmapLayer = new ol.layer.Heatmap({
    source: new ol.source.Vector({
        url: url + "service=WFS&version=2.0.0&request=GetPropertyValue&valueReference=time_delay&typeName=county:details",
        format: new ol.format.XML()
    })
});

// create the OpenLayers Map object
var map = new ol.Map({
  // render the map in the 'map' div
  target: document.getElementById('map'),
  // use the Canvas renderer
  renderer: 'canvas',
  //map layers
  layers: [mapLayer, overviewLayer],
  // initial center and zoom of the map's view
  view: new ol.View({
    center: center,
    zoom: zoom
  })
}).addInteraction(new ol.interaction.Select({
    condition: ol.events.condition.pointerMove
}));

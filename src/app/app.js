/**
 * Add all your dependencies here.
 *
 * @require Popup.js
 * @require LayersControl.js
 */

// ========= config section ================================================
var url = '/geoserver/wfs';
var center = [-121468.12084883929, 7163110.329270016];
var zoom = 11;
// =========================================================================

//var emergencySource = new ol.source.Vector({
//    url: url,
//    params: {'LAYERS': "county" + ':' + "details", 'TILED': true},
//    format: ''
//});

var vectorlayer = new ol.layer.Vector({
    source: new ol.source.Vector({})
});

// create the OpenLayers Map object
var map = new ol.Map({
  // render the map in the 'map' div
  target: document.getElementById('map'),
  // use the Canvas renderer
  renderer: 'canvas',
  layers: [
    // MapQuest streets
    new ol.layer.Tile({
      title: 'Street Map',
      source: new ol.source.MapQuest({layer: 'osm'})
    }),
    vectorlayer
  ],
  // initial center and zoom of the map's view
  view: new ol.View({
    center: center,
    zoom: zoom
  })
});

//map.addInteraction(new ol.interaction.Select({
//    condition: ol.events.condition.mouseMove
//}));

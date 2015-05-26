/**
 * Add all your dependencies here.
 *
 * @require Popup.js
 * @require LayersControl.js
 */

// ========= config section ================================================
var url = '/geoserver/ows?';
var center = [-121468.12084883929, 7163110.329270016];
var zoom = 11;
// =========================================================================

// override the axis orientation for WMS GetFeatureInfo
var proj = new ol.proj.Projection({
  code: 'http://www.opengis.net/gml/srs/epsg.xml#4326',
  axis: 'enu'
});
ol.proj.addEquivalentProjections([ol.proj.get('EPSG:4326'), proj]);

var emergencySource = new ol.source.TileWMS({
    url: url,
    params: {'LAYERS': "county" + ':' + "details", 'TILED': true},
    serverType: 'geoserver'
});

// create the OpenLayers Map object
// we add a layer switcher to the map with two groups:
// 1. background, which will use radio buttons
// 2. default (overlays), which will use checkboxes
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

    new ol.layer.Tile({
      title: "York Emergency Services",
      source: emergencySource
    })
  ],
  // initial center and zoom of the map's view
  view: new ol.View({
    center: center,
    zoom: zoom
  })
});

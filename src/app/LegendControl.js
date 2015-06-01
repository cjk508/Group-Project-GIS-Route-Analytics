if (!window.app) {
    window.app = {};
}
var app = window.app;

app.LegendControl = function(opt_options) {
    var options = opt_options || {};

    var element = document.createElement('div');
    element.className = 'legend-control ol-unselectable';
    element.innerHTML = "<span>Legend</span><br/>";

    element.innerHTML += "<span><img src='" + options.url + "SERVICE=wms&REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=county:details&STYLE=Rules_Details_Fat'" + "/></span>";

    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });

};

ol.inherits(app.LegendControl, ol.control.Control);
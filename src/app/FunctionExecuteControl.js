if (!window.app) {
  window.app = {};
}
var app = window.app;


app.FunctionExecuteControl = function(opt_options) {
  var options = opt_options || {};
  var button = document.createElement('button');
    
  if(options.title) button.title = options.title;
  if(options.name) button.innerHTML = options.name;
    
  button.addEventListener('click', options.func, false);
  button.addEventListener('touchstart', options.func, false);
    
  var element = document.createElement('div');
  element.className = 'func-execute ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};

ol.inherits(app.FunctionExecuteControl, ol.control.Control);

$('.func-execute, .ol-attribution button[title]').tooltip({
  placement: 'right'
});
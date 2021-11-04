function addImage(file) {
  var element = document.createElement('div');
  element.className = 'row';
  element.innerHTML =
    '<div class="cell image">' +
    '  <img />' +
    '</div>' +
    '<div class="cell color">' +
    '  <div class="box"></div>' +
    '  <ul>' +
    '    <li class="rgb"></li>' +
    '    <li class="hex"></li>' +
    '    <li class="hsl"></li>' +
    '  </ul>' +
    '</div>';

  var img = element.querySelector('img');
  img.src = URL.createObjectURL(file);
  img.onload = function() {
    var rgb = getAverageColor(img);
    var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    var rgbStr = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
    var hexStr = '#' + ('0'+rgb.r.toString(16)).slice(-2) + ('0'+rgb.g.toString(16)).slice(-2) + ('0'+rgb.b.toString(16)).slice(-2);
    var hslStr = 'hsl(' + Math.round(hsl.h * 360) + ', ' + Math.round(hsl.s * 100) + '%, ' + Math.round(hsl.l * 100) + '%)';

    var box = element.querySelector('.box');
    box.style.backgroundColor = rgbStr;

    element.querySelector('.rgb').textContent = rgbStr;
    element.querySelector('.hex').textContent = hexStr;
    element.querySelector('.hsl').textContent = hslStr;
  };

  document.getElementById('images').appendChild(element);
}

function getAverageColor(img) {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var width = canvas.width = img.naturalWidth;
  var height = canvas.height = img.naturalHeight;

  ctx.drawImage(img, 0, 0);

  var imageData = ctx.getImageData(0, 0, width, height);
  var data = imageData.data;
  var r = 0;
  var g = 0;
  var b = 0;

  for (var i = 0, l = data.length; i < l; i += 4) {
    r += data[i];
    g += data[i+1];
    b += data[i+2];
  }
	
  r = AnyMode(r);
  g = AnyMode(g);
  b = AnyMode(b);

  return { r: r, g: g, b: b };
}

function AnyMode(arr) { 
	max = 0;
	mode = [];
	str = arr.sort();
	str = "~" + str.join('~~') + "~"
	str.replace( /(~-*\d+~)\1*/g, function(a, b
	) {
	    var m = a.length / b.length;
	    if (max <= m ) {
		if (max < m) {mode = [];max = m;}
		mode.push( b.replace(/~/g,""));
	    } 
	});
	return mode;
	}

function handleImages(files) {
  document.getElementById('images').innerHTML = '';

  for (var i = 0; i < files.length; i++) {
    addImage(files[i]);
  }
}

document.ondragover = function(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
};

document.ondrop = function(event) {
  event.preventDefault();
  handleImages(event.dataTransfer.files);
};

(function() {
  var upload = document.getElementById('upload');
  var target = document.getElementById('target');

  upload.onchange = function() {
    handleImages(this.files);
  };

  target.onclick = function() {
    upload.click();
  };
})();

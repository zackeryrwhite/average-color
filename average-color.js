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
//     '    <li class="hsl"></li>' +
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

  r = Math.floor(r / (data.length / 4));
  g = Math.floor(g / (data.length / 4));
  b = Math.floor(b / (data.length / 4));

  return { r: r, g: g, b: b };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h, s: s, l: l };
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

// 
// 
// 
var fs = require('fs'),
	PNG = require('pngjs').PNG,
	Octree = require('./octree-d3-fork'),
	mapping = [];

var x = 0;
/**
 * Given an image file, find the most prevalent color in it and write to the color map.
 *
 * @param  {[type]} filepath [description]
 * @return {[type]}          [description]
 */
function readImageFile( filepath ) {
	var filepathIndexForArray = parseInt( filepath.replace(/^.*[\\\/]/, '') ) - 1;
	fs.createReadStream(filepath)
		.pipe(new PNG({
			filterType: 4
		}))
		.on('parsed', function() {
			var color = getMostPrevalentColor( this.data, this.width, this.height );
			mapping[filepathIndexForArray] = color;
			console.log(mapping);
			var mappingThing = "var mapping = ['" + mapping.join("', '") + "'];";
			fs.writeFile("asdf", mappingThing, function(err) {
				if(err) {
					return console.log(err);
				}
			});
		});
}

/*
 * For all the emoji images in a folder, read each image fine.
 */
fs.readdir('emoji-images', function(err, files) {
	files.forEach( function(file) {
		// Bail on filetype because there's some extra crap in there.
		if ( file.indexOf('png') < 0 ) {
			return;
		}
		readImageFile( 'emoji-images/' + file );
	} );
});
/**
 * Given pixel color data, finds the most prevalent color.
 *
 * @param  {[type]} data   [description]
 * @param  {[type]} width  [description]
 * @param  {[type]} height [description]
 * @return {[type]}        [description]
 */
function getMostPrevalentColor(data, width, height) {
	allPixels = [];
	// Iterate over every pixel in the image
	var y;
	var x;
	for ( y=0; y < height; y+=4 ) {
		for ( x=0; x < width; x+=4 ) {
			var index = (width * y + x) << 2;
			// Skip the pixel if the opacity is below a threshold.
			if ( data[index+3] < 127 ) {
				continue;
			}
			allPixels.push( {x:data[index], y:data[index+1], z:data[index+2]} );
		}
	}
	var tree = Octree(allPixels);
	var minClosePoints = .35 * allPixels.length;
	var wellSaturated = null;
	var averageColor = [0,0,0];
	var visited = 0;
	tree.visit(function(node) {
		visited++;
		var maxDist = 30;
		if ( ! node.point ) {
			return;
		}
		var nx1 = node.x - maxDist,
			nx2 = node.x + maxDist,
			ny1 = node.y - maxDist,
			ny2 = node.y + maxDist,
			nz1 = node.z - maxDist,
			nz2 = node.z + maxDist,
			closePoints = 0,
			visitedSelf = false;
		averageColor[0] = ( averageColor[0] * ( visited - 1 ) + node.x ) / visited;
		averageColor[1] = ( averageColor[1] * ( visited - 1 ) + node.y ) / visited;
		averageColor[2] = ( averageColor[2] * ( visited - 1 ) + node.z ) / visited;
		// Find the number of points less than maxDist distance away
		tree.visit(function(quad, x1, y1, z1, x2, y2, z2) {
			if (quad.point) {
				var x = node.x - quad.point.x,
					y = node.y - quad.point.y,
					z = node.z - quad.point.z,
				distanceBetweenPoints = Math.sqrt(x * x + y * y  + z * z);
				if (distanceBetweenPoints <= maxDist) {
					closePoints++;
				}
			}
			return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1 || z1 > nz2 || z2 < nz1;
		});

		if ( closePoints > minClosePoints && ! wellSaturated ) {
			wellSaturated = true;
		}
	});
	if ( wellSaturated ) {
		return rgbToHex( parseInt( averageColor[0] ), parseInt( averageColor[1] ), parseInt( averageColor[2] ) );
	} else {
		return false;
	}
}

function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

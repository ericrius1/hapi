var scene, camera, renderer, controls;

var scaleArrayCalculator;
var pillars;
var scaleArray;
var deltas;
var matchIndex;

var sustained = false;
var sustainedNote;
var matchBuffer = new Array(12);
var debounceLevel = 1.1;
var confidenceLevel = 0.91;
var decay = 0.9;
var impulse = 1.5;
var pillarFrequencies = [325, 700, 433, 658, 345, 464, 280, 588];
var cameraPosition = [0, 100, -150];
var pillarDimensions = [10, 30, 5];
var pillarSegments = [10, 100, 10];
var pillarHue = 0.7;
var pillarCircleRadius = 50;



var init = function() {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
  setCameraPosition.apply(this, cameraPosition);
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
	controls = new THREE.OrbitControls(camera);
	pillars = setUpPillars(pillarCircleRadius, pillarFrequencies.length, pillarDimensions, pillarSegments);
  scaleArrayCalculator = createScaleArrayCalculator(pillarFrequencies);
}

var animate = function() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	controls.update();
  scalePillars(pillars, scaleArrayCalculator(pitcher()));
}

init();
animate();



// TODO make this less gross
function createScaleArrayCalculator(pillarFrequencies) {
  scaleArray = pillarFrequencies.map(function (d) { return 1; });
  return function (detection) {
    if (detection.confidence > confidenceLevel) {
      deltas = pillarFrequencies.map(function (frequency) { 
        return Math.abs(frequency - detection.pitch);
      });
      matchIndex = deltas.indexOf(Math.min.apply(this, deltas));
      matchBuffer = matchBuffer.slice(0, matchBuffer.length - 1);
      matchBuffer.unshift(matchIndex);
      sustained = true;
      sustainedNote = matchBuffer[0];
      for (var i = 0; i < matchBuffer.length; i++) {
        if (matchBuffer[i] !== sustainedNote) {
          sustained = false;
          break;
        }
      };
      if (scaleArray[matchIndex] < debounceLevel && sustained === true) {
        sustained = false;
        scaleArray[matchIndex] = scaleArray[matchIndex] * impulse;
      }
    }
    scaleArray = scaleArray.map(function (d) { return Math.pow(d, decay); });
    return scaleArray;
  }
}

function scalePillars(pillars, scaleArray) {
  pillars.forEach(function (pillar, index) {
    pillar.mesh.scale.set(scaleArray[index], scaleArray[index] * 3, scaleArray[index]);
  }); 
};

function setUpPillars(radius, numPillars, dimensions, segments) {
  var pillars = [];
	var pillarGeo = new THREE.BoxGeometry(
      dimensions[0],
      dimensions[1],
      dimensions[2], 
      segments[0], 
      segments[1], 
      segments[2]
  );
	for (var i = 0; i < numPillars; i++) {
    var pillar = {};
	  pillar.mesh = new THREE.Mesh(pillarGeo);
    pillar.frequency = pillarFrequencies[i];
		var theta = i / numPillars * Math.PI * 2;
		var x = Math.cos(theta) * radius;
		var z = Math.sin(theta) * radius;
		pillar.mesh.position.set(x, 0, z);
    pillar.mesh.material.color.setHSL(pillarHue, 0.5, 0.5);
		scene.add(pillar.mesh);
    pillars.push(pillar);
	}
  return pillars;
};

function setCameraPosition(x, y, z) {
	camera.position.x = x;
	camera.position.y = y;
	camera.position.z = z;
};

function map(value, min1, max1, min2, max2) {
  return min2 + (max2 - min2) * ((value - min1) / (max1 - min1));
};

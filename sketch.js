// Sketch.js - Crecimiento Diferencial

// — Contorno (límites) —
let contourPoints = [];
let contourLoaded = false;
let fileInputContour;
let sliderContourRadius, contourRadiusValor;

// — Obstáculos —
let inputNumObstacles;
let numObstacles = 0;
let obstacleCircles = [];
let obstacleSVGPoints = [];
let sliderRadiusObstacle, obstacleRadiusValor;
let sliderObstacleSeed, obstacleSeedValor;
let sliderScaleObstacles, obstacleScaleValor;
let obstacleScale = 1;
let showObstacles = true;
let fileInputObstacles;

// — Base de crecimiento —
let sliderBaseRadius, baseRadiusValor;
let fileInputBase;

// — Nodo y Curva —
let inputPuntos;
let inputMinDist;
let inputMaxDist;
let inputMaxPoints;

let points = [];
let originalPoints = [];
let fileLoaded = false;
let svgText = '';
let loadedFileName = '';
let fuenteMonoLight;

let running = false;
let iniciado = false;
let maxPoints = 2000;

let zoom = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let suppressDrag = false;
let lastMouseX, lastMouseY;

// UI Visualization
let tipoVisualSelect;
let toggleHistorialBtn, toggleNodosBtn, clearHistorialBtn;

// History
let mostrarHistorial = false;
let mostrarNodos = true;
let historialFormas = [];
let frameHistorial = 0;
let frecuenciaHistorial = 10;

// Experimental
let tipoRuidoSelect;
let sliderAmplitud, sliderFrecuencia, sliderRepulsion;
let valorAmplitudSpan, valorFrecuenciaSpan, valorRepulsionSpan;

// Growth params
let noiseOffset = 0;
let minDist, maxDist;

function preload() {
  logoImg = loadImage('assets/logo.png');
  fuenteMonoLight = loadFont('assets/SourceCodePro-Light.ttf');
}

function exportarSVG() {
  // ... (export logic unchanged) ...
}

// Contorno functions
function generateContourCircle() {
  contourPoints = [];
  const n = int(inputPuntos.value());
  const r = float(sliderContourRadius.value());
  for (let i = 0; i < n; i++) {
    const a = TWO_PI * i / n;
    contourPoints.push(createVector(
      width/2 + r * cos(a),
      height/2 + r * sin(a)
    ));
  }
  contourLoaded = true;
}

function handleContourFile(file) {
  if (file.type === 'image' && file.subtype.includes('svg')) {
    // TODO: parsear SVG
    contourLoaded = true;
  } else alert('Por favor sube un SVG válido para el contorno.');
}

// Obstáculos functions
function handleObstaclesFile(file) {
  if (file.type === 'image' && file.subtype.includes('svg')) {
    // TODO: parsear SVG
  } else alert('Por favor sube un SVG válido para los obstáculos.');
}

function generateObstacleCircles() {
  obstacleCircles = [];
  const n = numObstacles;
  const r = float(sliderRadiusObstacle.value()) * obstacleScale;
  const seed = int(sliderObstacleSeed.value());
  randomSeed(seed);
  for (let i = 0; i < n; i++) {
    const x = random(r, width - r);
    const y = random(r, height - r);
    obstacleCircles.push({ x, y, r });
  }
}

function setup() {
  const uiWidth = document.getElementById('ui').getBoundingClientRect().width;
  const canvas = createCanvas(windowWidth - uiWidth, windowHeight);
  canvas.position(uiWidth, 0);
  pixelDensity(2);
  noFill();

  // Base de Crecimiento
  sliderBaseRadius = select('#sliderBaseRadius');
  baseRadiusValor = select('#baseRadiusValor');
  sliderBaseRadius.input(() => { baseRadiusValor.html(sliderBaseRadius.value()); previewShape(); });
  select('#btnCircleBase').mousePressed(() => { fileLoaded = false; previewShape(); });
  fileInputBase = createFileInput(handleFile); fileInputBase.parent('ui'); fileInputBase.hide();
  select('#btnSubirSVGBase').mousePressed(() => { suppressDrag = true; fileInputBase.elt.click(); });

  // Contorno
  sliderContourRadius = select('#sliderContourRadius');
  contourRadiusValor = select('#contourRadiusValor');
  sliderContourRadius.input(() => { contourRadiusValor.html(sliderContourRadius.value()); generateContourCircle(); });
  select('#btnCircleContour').mousePressed(() => { contourLoaded = false; generateContourCircle(); });
  fileInputContour = createFileInput(handleContourFile); fileInputContour.parent('ui'); fileInputContour.hide();
  select('#btnSubirSVGContour').mousePressed(() => { suppressDrag = true; fileInputContour.elt.click(); });

  // Obstáculos
  inputNumObstacles = select('#inputNumObstacles');
  sliderRadiusObstacle = select('#sliderRadiusObstacle');
  obstacleRadiusValor = select('#obstacleRadiusValor');
  sliderObstacleSeed = select('#sliderObstacleSeed');
  obstacleSeedValor = select('#obstacleSeedValor');
  sliderScaleObstacles = select('#sliderScaleObstacles');
  obstacleScaleValor = select('#obstacleScaleValor');

  inputNumObstacles.input(() => { numObstacles = int(inputNumObstacles.value()); generateObstacleCircles(); });
  sliderRadiusObstacle.input(() => { obstacleRadiusValor.html(sliderRadiusObstacle.value()); generateObstacleCircles(); });
  sliderObstacleSeed.input(() => { obstacleSeedValor.html(sliderObstacleSeed.value()); generateObstacleCircles(); });
  sliderScaleObstacles.input(() => { obstacleScaleValor.html(sliderScaleObstacles.value()); obstacleScale = float(sliderScaleObstacles.value()); generateObstacleCircles(); });
  select('#toggleObstacles').changed(() => { showObstacles = select('#toggleObstacles').checked(); });
  select('#btnCircleObstacle').mousePressed(() => { obstacleSVGPoints = []; generateObstacleCircles(); });
  fileInputObstacles = createFileInput(handleObstaclesFile); fileInputObstacles.parent('ui'); fileInputObstacles.hide();
  select('#btnSubirSVGObstacles').mousePressed(() => { suppressDrag = true; fileInputObstacles.elt.click(); });

  // Nodos
  inputPuntos = select('#inputPuntos');
  inputMinDist = select('#inputMinDist');
  inputMaxDist = select('#inputMaxDist');
  inputMaxPoints = select('#inputMaxPoints');
  inputPuntos.input(previewShape);
  inputMaxPoints.input(() => { maxPoints = int(inputMaxPoints.value()); });
  select('#playPauseBtn').mousePressed(togglePlayPause);
  select('#restartBtn').mousePressed(reiniciarCrecimiento);

  // Visualización
  tipoVisualSelect = select('#tipoVisual');
  toggleNodosBtn = select('#toggleNodosBtn'); toggleNodosBtn.mousePressed(() => { mostrarNodos = !mostrarNodos; toggleNodosBtn.html(mostrarNodos ? '🔘 Ocultar nodos' : '🔘 Mostrar nodos'); });
  toggleHistorialBtn = select('#toggleHistorialBtn'); toggleHistorialBtn.mousePressed(() => { mostrarHistorial = !mostrarHistorial; toggleHistorialBtn.html(mostrarHistorial ? '🕘 Ocultar historial' : '🕘 Ver historial'); });
  clearHistorialBtn = select('#clearHistorialBtn'); clearHistorialBtn.mousePressed(() => { historialFormas = []; frameHistorial = 0; });
  select('#inputFrecuenciaHistorial').changed(() => { frecuenciaHistorial = int(select('#inputFrecuenciaHistorial').value()); });

  // Experimental
  tipoRuidoSelect = select('#tipoRuido');
  sliderAmplitud = select('#sliderAmplitud'); valorAmplitudSpan = select('#valorAmplitud');
  sliderFrecuencia = select('#sliderFrecuencia'); valorFrecuenciaSpan = select('#valorFrecuencia');
  sliderRepulsion = select('#sliderRepulsion'); valorRepulsionSpan = select('#valorRepulsion');
  sliderAmplitud.input(() => valorAmplitudSpan.html(sliderAmplitud.value()));
  sliderFrecuencia.input(() => valorFrecuenciaSpan.html(sliderFrecuencia.value()));
  sliderRepulsion.input(() => valorRepulsionSpan.html(sliderRepulsion.value()));

  // Exportar
  select('#btnExportPNG').mousePressed(() => saveCanvas('crecimiento_diferencial','png'));
  select('#btnExportSVG').mousePressed(exportarSVG);

  previewShape();
}

function windowResized() {
  const uiWidth = document.getElementById('ui').getBoundingClientRect().width;
  resizeCanvas(windowWidth - uiWidth, windowHeight);
  select('canvas').position(uiWidth, 0);
}

function previewShape() {
  fileLoaded ? generarCurvaFromSVG() : generarCurvaBase();
  redraw();
}

function handleFile(file) {
  if (file.type === 'image' && file.subtype.includes('svg')) {
    svgText = file.data; fileLoaded = true; loadedFileName = file.name; generarCurvaFromSVG();
  } else alert('Por favor sube un archivo SVG válido.');
}

function generarCurvaFromSVG() {
  let raw = svgText;
  if (raw.startsWith('data:image/svg+xml;base64,')) raw = atob(raw.split(',')[1]);
  const doc = new DOMParser().parseFromString(raw, 'image/svg+xml');
  const elems = Array.from(doc.querySelectorAll('path, polyline, polygon'));
  if (!elems.length) return;
  const n = int(inputPuntos.value()); let pts = [];
  elems.forEach(el => {
    if (el.tagName === 'path') {
      const L = el.getTotalLength(); for (let i=0; i<n; i++) pts.push(createVector(...Object.values(el.getPointAtLength((i/n)*L))));
    } else { const list = el.points, coords = Array.from({length:list.numberOfItems},(_,i)=>list.getItem(i)); for (let i=0; i<n; i++){ const c=coords[floor((i/n)*coords.length)]; pts.push(createVector

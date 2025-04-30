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

// Export SVG (unchanged) ...
function exportarSVG() { /* ... */ }

// Contorno
function generateContourCircle() {
  contourPoints = [];
  const n = int(inputPuntos.value());
  const r = float(sliderContourRadius.value());
  for (let i = 0; i < n; i++) {
    const a = TWO_PI * i / n;
    contourPoints.push(createVector(width/2 + r*cos(a), height/2 + r*sin(a)));
  }
  contourLoaded = true;
}

function handleContourFile(file) {
  if (file.type === 'image' && file.subtype.includes('svg')) {
    // TODO: parse SVG
    contourLoaded = true;
  } else {
    alert('Por favor sube un SVG válido para el contorno.');
  }
}

// Obstáculos
function handleObstaclesFile(file) {
  if (file.type === 'image' && file.subtype.includes('svg')) {
    // TODO: parse SVG
    // Fill obstacleSVGPoints
  } else {
    alert('Por favor sube un SVG válido para los obstáculos.');
  }
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

// Curva base y SVG
function generarCurvaBase() {
  points = [];
  const n = int(inputPuntos.value());
  const r = float(sliderBaseRadius.value());
  for (let i = 0; i < n; i++) {
    const a = TWO_PI * i / n;
    points.push(createVector(width/2 + r*cos(a), height/2 + r*sin(a)));  
  }
  originalPoints = points.map(p => p.copy());
  iniciado = running = false;
}

function generarCurvaFromSVG() {
  let raw = svgText;
  if (raw.startsWith('data:image/svg+xml;base64,')) raw = atob(raw.split(',')[1]);
  const doc = new DOMParser().parseFromString(raw, 'image/svg+xml');
  const elems = Array.from(doc.querySelectorAll('path, polyline, polygon'));
  if (!elems.length) return;
  const n = int(inputPuntos.value());
  let pts = [];
  elems.forEach(el => {
    if (el.tagName === 'path') {
      const L = el.getTotalLength();
      for (let i = 0; i < n; i++) pts.push(createVector(...Object.values(el.getPointAtLength((i/n)*L))));
    } else {
      const list = el.points;
      const coords = Array.from({ length: list.numberOfItems }, (_, i) => list.getItem(i));
      for (let i = 0; i < n; i++) {
        const c = coords[floor((i/n)*coords.length)];
        pts.push(createVector(c.x, c.y));
      }
    }
  });
  fitPoints(pts);
  originalPoints = points.map(p => p.copy());
  iniciado = running = false;
}

function fitPoints(pts) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  pts.forEach(p => { minX = min(minX, p.x); maxX = max(maxX, p.x); minY = min(minY, p.y); maxY = max(maxY, p.y); });
  const s = (2 * float(sliderBaseRadius.value())) / max(maxX - minX, maxY - minY);
  points = pts.map(p => createVector((p.x - (minX + (maxX - minX)/2))*s + width/2, (p.y - (minY + (maxY - minY)/2))*s + height/2));
}
// Control de inicio/pausa y reinicio
function iniciarCrecimiento() {
  if (!points.length) return;
  const n = int(inputPuntos.value());
  const c = TWO_PI * float(sliderBaseRadius.value());
  const d = c / max(n, 1);
  minDist = max(float(inputMinDist.value()), d * 1.2);
  maxDist = max(float(inputMaxDist.value()), d * 1.2);
  iniciado = running = true;
}

function togglePlayPause() {
  if (!iniciado) {
    iniciarCrecimiento();
    select('#playPauseBtn').html('⏸ Pausar');
  } else {
    running = !running;
    select('#playPauseBtn').html(running ? '⏸ Pausar' : '▶ Reanudar');
  }
}

function reiniciarCrecimiento() {
  running = iniciado = false;
  offsetX = offsetY = 0;
  zoom = 1;
  noiseOffset = 0;
  historialFormas = [];
  frameHistorial = 0;
  points = originalPoints.map(p => p.copy());
  select('#playPauseBtn').html('▶ Iniciar');
  redraw();
}
function setup() {
  const uiWidth = document.getElementById('ui').getBoundingClientRect().width;
  createCanvas(windowWidth - uiWidth, windowHeight).position(uiWidth, 0);
  pixelDensity(2);

  // Base de Crecimiento
  sliderBaseRadius = select('#sliderBaseRadius'); baseRadiusValor = select('#baseRadiusValor');
  sliderBaseRadius.input(() => { baseRadiusValor.html(sliderBaseRadius.value()); previewShape(); });
  select('#btnCircleBase').mousePressed(() => { fileLoaded = false; previewShape(); });
  fileInputBase = createFileInput(handleFile).parent('ui').hide();
  select('#btnSubirSVGBase').mousePressed(() => { suppressDrag = true; fileInputBase.elt.click(); });

  // Contorno
  sliderContourRadius = select('#sliderContourRadius'); contourRadiusValor = select('#contourRadiusValor');
  sliderContourRadius.input(() => { contourRadiusValor.html(sliderContourRadius.value()); generateContourCircle(); });
  select('#btnCircleContour').mousePressed(() => { contourLoaded = false; generateContourCircle(); });
  fileInputContour = createFileInput(handleContourFile).parent('ui').hide();
  select('#btnSubirSVGContour').mousePressed(() => { suppressDrag = true; fileInputContour.elt.click(); });

  // Obstáculos
  inputNumObstacles = select('#inputNumObstacles');
  sliderRadiusObstacle = select('#sliderRadiusObstacle'); obstacleRadiusValor = select('#obstacleRadiusValor');
  sliderObstacleSeed = select('#sliderObstacleSeed'); obstacleSeedValor = select('#obstacleSeedValor');
  sliderScaleObstacles = select('#sliderScaleObstacles'); obstacleScaleValor = select('#obstacleScaleValor');
  inputNumObstacles.input(() => { numObstacles = int(inputNumObstacles.value()); generateObstacleCircles(); });
  sliderRadiusObstacle.input(() => { obstacleRadiusValor.html(sliderRadiusObstacle.value()); generateObstacleCircles(); });
  sliderObstacleSeed.input(() => { obstacleSeedValor.html(sliderObstacleSeed.value()); generateObstacleCircles(); });
  sliderScaleObstacles.input(() => { obstacleScaleValor.html(sliderScaleObstacles.value()); obstacleScale = float(sliderScaleObstacles.value()); generateObstacleCircles(); });
  select('#toggleObstacles').changed(() => showObstacles = select('#toggleObstacles').checked());
  select('#btnCircleObstacle').mousePressed(() => { obstacleSVGPoints = []; generateObstacleCircles(); });
  fileInputObstacles = createFileInput(handleObstaclesFile).parent('ui').hide();
  select('#btnSubirSVGObstacles').mousePressed(() => { suppressDrag = true; fileInputObstacles.elt.click(); });

  // Nodos
  inputPuntos = select('#inputPuntos'); inputMinDist = select('#inputMinDist'); inputMaxDist = select('#inputMaxDist'); inputMaxPoints = select('#inputMaxPoints');
  inputPuntos.input(previewShape); inputMaxPoints.input(() => maxPoints = int(inputMaxPoints.value()));
  select('#playPauseBtn').mousePressed(togglePlayPause); select('#restartBtn').mousePressed(reiniciarCrecimiento);

  // Visualización
  tipoVisualSelect = select('#tipoVisual');
  toggleNodosBtn = select('#toggleNodosBtn').mousePressed(() => { mostrarNodos = !mostrarNodos; toggleNodosBtn.html(mostrarNodos ? '🔘 Ocultar nodos':'🔘 Mostrar nodos'); });
  toggleHistorialBtn = select('#toggleHistorialBtn').mousePressed(() => { mostrarHistorial = !mostrarHistorial; toggleHistorialBtn.html(mostrarHistorial ? '🕘 Ocultar historial':'🕘 Ver historial'); });
  clearHistorialBtn = select('#clearHistorialBtn').mousePressed(() => { historialFormas = []; frameHistorial = 0; });
  select('#inputFrecuenciaHistorial').changed(() => frecuenciaHistorial = int(select('#inputFrecuenciaHistorial').value()));

  // Experimental controls...

  // Export
  select('#btnExportPNG').mousePressed(() => saveCanvas('crecimiento_diferencial','png'));
  select('#btnExportSVG').mousePressed(exportarSVG);

  // Draw initial base circle
  generarCurvaBase();
  redraw();
}

function windowResized() {
  const uiWidth = document.getElementById('ui').getBoundingClientRect().width;
  resizeCanvas(windowWidth - uiWidth, windowHeight);
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
  // Parsea el SVG cargado y genera puntos
  let raw = svgText;
  if (raw.startsWith('data:image/svg+xml;base64,')) {
    raw = atob(raw.split(',')[1]);
  }
  const doc = new DOMParser().parseFromString(raw, 'image/svg+xml');
  const elems = Array.from(doc.querySelectorAll('path, polyline, polygon'));
  if (!elems.length) return;

  const n = int(inputPuntos.value());
  let pts = [];

  elems.forEach(el => {
    if (el.tagName === 'path') {
      const L = el.getTotalLength();
      for (let i = 0; i < n; i++) {
        const pt = el.getPointAtLength((i / n) * L);
        pts.push(createVector(pt.x, pt.y));
      }
    } else {
      const list = el.points;
      const count = list.numberOfItems;
      for (let i = 0; i < n; i++) {
        const idx = floor((i / n) * count);
        const c = list.getItem(idx);
        pts.push(createVector(c.x, c.y));
      }
    }
  });

  // Ajusta y centra los puntos en el canvas
  fitPoints(pts);
  originalPoints = points.map(p => p.copy());
  iniciado = running = false;
}

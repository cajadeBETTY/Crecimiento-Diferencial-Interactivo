// Sketch.js - Crecimiento Diferencial

// — Contorno (límites) —
let contourPoints   = [];
let contourLoaded   = false;
let fileInputContour;
let sliderContourRadius, contourRadiusValor; // declarados para contorno

// — Obstáculos —
let inputNumObstacles;
let numObstacles       = 0;
let obstacleCircles    = [];
let obstacleSVGPoints  = [];
let sliderRadiusObstacle, obstacleRadiusValor;
let sliderObstacleSeed,   obstacleSeedValor;
let sliderScaleObstacles, obstacleScaleValor;
let obstacleScale      = 1;
let showObstacles      = true;
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

// Load assets
function preload() {
  logoImg = loadImage('assets/logo.png');
  fuenteMonoLight = loadFont('assets/SourceCodePro-Light.ttf');
}


// === Contorno generico circular ===
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

// === Handler de archivo contorno SVG ===
function handleContourFile(file) {
  if (file.type === 'image' && file.subtype.includes('svg')) {
    // TODO: parsear file.data y llenar contourPoints
    contourLoaded = true;
  } else {
    alert('Por favor sube un SVG válido para el contorno.');
  }

function setup() {
  // Canvas
  const uiWidth = document.getElementById('ui').getBoundingClientRect().width;
  const c = createCanvas(windowWidth - uiWidth, windowHeight);
  c.position(uiWidth, 0);
  pixelDensity(2);
  noFill();

  // Base de Crecimiento controls
  sliderBaseRadius = select('#sliderBaseRadius');
  baseRadiusValor  = select('#baseRadiusValor');
  sliderBaseRadius.input(() => {
    baseRadiusValor.html(sliderBaseRadius.value());
    previewShape();
  });
  select('#btnCircleBase').mousePressed(() => {
    fileLoaded = false;
    previewShape();
  });
  fileInputBase = createFileInput(handleFile);
  fileInputBase.parent('ui');
  fileInputBase.hide();
  select('#btnSubirSVGBase').mousePressed(() => {
    suppressDrag = true;
    fileInputBase.elt.click();
  });

  // Contorno controls
  sliderContourRadius = select('#sliderContourRadius');
  contourRadiusValor   = select('#contourRadiusValor');
  sliderContourRadius.input(() => {
    contourRadiusValor.html(sliderContourRadius.value());
    generateContourCircle();
  });
  select('#btnCircleContour').mousePressed(() => {
    contourLoaded = false;
    generateContourCircle();
  });
  fileInputContour = createFileInput(handleContourFile);
  fileInputContour.parent('ui');
  fileInputContour.hide();
  select('#btnSubirSVGContour').mousePressed(() => {
    suppressDrag = true;
    fileInputContour.elt.click();
  });

  // Obstáculos controls
  inputNumObstacles   = select('#inputNumObstacles');
  sliderRadiusObstacle = select('#sliderRadiusObstacle');
  obstacleRadiusValor  = select('#obstacleRadiusValor');
  sliderObstacleSeed   = select('#sliderObstacleSeed');
  obstacleSeedValor    = select('#obstacleSeedValor');
  sliderScaleObstacles = select('#sliderScaleObstacles');
  obstacleScaleValor   = select('#obstacleScaleValor');

  inputNumObstacles.input(() => {
    numObstacles = int(inputNumObstacles.value());
    generateObstacleCircles();
  });
  sliderRadiusObstacle.input(() => {
    obstacleRadiusValor.html(sliderRadiusObstacle.value());
    generateObstacleCircles();
  });
  sliderObstacleSeed.input(() => {
    obstacleSeedValor.html(sliderObstacleSeed.value());
    generateObstacleCircles();
  });
  sliderScaleObstacles.input(() => {
    obstacleScaleValor.html(sliderScaleObstacles.value());
    obstacleScale = float(sliderScaleObstacles.value());
    scaleObstacles();
  });
  select('#toggleObstacles').changed(() => {
    showObstacles = select('#toggleObstacles').checked();
  });
  select('#btnCircleObstacle').mousePressed(() => {
    obstacleSVGPoints = [];
    generateObstacleCircles();
  });
  fileInputObstacles = createFileInput(handleObstaclesFile);
  fileInputObstacles.parent('ui');
  fileInputObstacles.hide();
  select('#btnSubirSVGObstacles').mousePressed(() => {
    suppressDrag = true;
    fileInputObstacles.elt.click();
  });

  // Nodos controls
  inputPuntos     = select('#inputPuntos');
  inputMinDist    = select('#inputMinDist');
  inputMaxDist    = select('#inputMaxDist');
  inputMaxPoints  = select('#inputMaxPoints');
  inputPuntos.input(previewShape);
  inputMaxPoints.input(() => { maxPoints = int(inputMaxPoints.value()); });
  select('#playPauseBtn').mousePressed(togglePlayPause);
  select('#restartBtn').mousePressed(reiniciarCrecimiento);

  // Visualización
  tipoVisualSelect = select('#tipoVisual');
  toggleNodosBtn = select('#toggleNodosBtn');
  toggleNodosBtn.mousePressed(() => {
    mostrarNodos = !mostrarNodos;
    toggleNodosBtn.html(mostrarNodos ? '🔘 Ocultar nodos' : '🔘 Mostrar nodos');
  });
  toggleHistorialBtn = select('#toggleHistorialBtn');
  toggleHistorialBtn.mousePressed(() => {
    mostrarHistorial = !mostrarHistorial;
    toggleHistorialBtn.html(mostrarHistorial ? '🕘 Ocultar historial' : '🕘 Ver historial');
  });
  clearHistorialBtn = select('#clearHistorialBtn');
  clearHistorialBtn.mousePressed(() => { historialFormas = []; frameHistorial = 0; });
  select('#inputFrecuenciaHistorial').changed(() => {
    frecuenciaHistorial = int(select('#inputFrecuenciaHistorial').value());
  });

  // Experimental
  tipoRuidoSelect     = select('#tipoRuido');
  sliderAmplitud      = select('#sliderAmplitud');
  valorAmplitudSpan   = select('#valorAmplitud');
  sliderFrecuencia    = select('#sliderFrecuencia');
  valorFrecuenciaSpan = select('#valorFrecuencia');
  sliderRepulsion     = select('#sliderRepulsion');
  valorRepulsionSpan  = select('#valorRepulsion');

  sliderAmplitud.input(() => valorAmplitudSpan.html(sliderAmplitud.value()));
  sliderFrecuencia.input(() => valorFrecuenciaSpan.html(sliderFrecuencia.value()));
  sliderRepulsion.input(() => valorRepulsionSpan.html(sliderRepulsion.value()));

  // Exportar
  select('#btnExportPNG').mousePressed(() => saveCanvas('crecimiento_diferencial','png'));
  select('#btnExportSVG').mousePressed(exportarSVG);

  // Inicial
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
    svgText = file.data;
    fileLoaded = true;
    loadedFileName = file.name;       // aquí se guarda nombre
    generarCurvaFromSVG();
  } else alert('Por favor sube un archivo SVG válido.');
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
      const coords = Array.from({length: list.numberOfItems}, (_,i)=>list.getItem(i));
      for (let i = 0; i < n; i++) {
        const c = coords[floor((i/n)*coords.length)];
        pts.push(createVector(c.x, c.y));
      }
    }
  });
  fitPoints(pts);
  originalPoints = points.map(p=>p.copy());
  iniciado = running = false;
}

// 1) generarCurvaBase
function generarCurvaBase() {
  points = [];
  const n = int(inputPuntos.value());
  const r = float(sliderBaseRadius.value());
  for (let i = 0; i < n; i++) {
    const a = TWO_PI * i / n;
    points.push(createVector(
      width/2 + r * cos(a),
      height/2 + r * sin(a)
    ));
  }
  originalPoints = points.map(p => p.copy());
  iniciado = running = false;
}

// 2) fitPoints
function fitPoints(pts) {
  let minX = Infinity, maxX = -Infinity,
      minY = Infinity, maxY = -Infinity;
  pts.forEach(p => {
    minX = min(minX, p.x);
    maxX = max(maxX, p.x);
    minY = min(minY, p.y);
    maxY = max(maxY, p.y);
  });
  const s = (2 * float(sliderBaseRadius.value())) /
            max(maxX - minX, maxY - minY);
  points = pts.map(p => createVector(
    (p.x - (minX + (maxX - minX)/2)) * s + width/2,
    (p.y - (minY + (maxY - minY)/2)) * s + height/2
  ));
}

// 3) iniciarCrecimiento
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
  if (!iniciado) { iniciarCrecimiento(); select('#playPauseBtn').html('⏸ Pausar'); }
  else         { running=!running; select('#playPauseBtn').html(running?'⏸ Pausar':'▶ Reanudar'); }
}

function reiniciarCrecimiento() {
  running=iniciado=false; offsetX=offsetY=0; zoom=1; noiseOffset=0;
  historialFormas=[]; frameHistorial=0;
  points = originalPoints.map(p=>p.copy());
  select('#playPauseBtn').html('▶ Iniciar'); redraw();
}

function draw() {
  background(255);

  // — 1. DIBUJAR CONTORNO —
  if (contourLoaded) {
    stroke(180); noFill(); strokeWeight(1);
    beginShape(); contourPoints.forEach(p => vertex(p.x, p.y)); endShape(CLOSE);
  }

  // — 2. DIBUJAR OBSTÁCULOS —
  if (showObstacles) {
    obstacleCircles.forEach(c => { stroke('red'); noFill(); strokeWeight(1); circle(c.x, c.y, c.r*2); });
    obstacleSVGPoints.forEach(shape => { stroke('red'); noFill(); strokeWeight(1); beginShape(); shape.forEach(p=>vertex(p.x,p.y)); endShape(CLOSE); });
  }

  // — 3. DIBUJAR CURVA bajo transform —
  push(); translate(width/2+offsetX, height/2+offsetY); scale(zoom); translate(-width/2, -height/2);
    // historial + curva principal...
  pop();

  // — 4. Crecimiento —
  if (iniciado && running && points.length < maxPoints) { /*...*/ }

  // === 5. DIBUJAR TEXTO DE INFO ===
  const initialCount = int(inputPuntos.value());
  const circleRadiusMm= float(sliderBaseRadius.value());
  const lines=[];
  if(loadedFileName) lines.push(`Archivo Cargado: ${loadedFileName}`);
  else lines.push(`Forma Genérica: Círculo con ${initialCount} puntos`);
  const distPts=(TWO_PI*circleRadiusMm)/initialCount;
  lines.push(`Distancia entre puntos: ${distPts.toFixed(2)} mm`);
  lines.push(`Puntos actuales: ${points.length}`);
  const estado=!iniciado?'Nativo':(running?'En crecimiento':'En Pausa'); lines.push(`Estado: ${estado}`);
  push(); textFont(fuenteMonoLight); textSize(10); textAlign(RIGHT,TOP); fill(0);
    const m=30, x0=width-m, y0=height-m-10-lines.length*18;
    for(let i=0;i<lines.length;i++) text(lines[i],x0,y0+i*18);
  pop();

  // — Logo —
  const marginLogo=20, maxLogoWidth=750;
  const logoAspect=logoImg.width/logoImg.height;
  const logoW=maxLogoWidth, logoH=maxLogoWidth/logoAspect;
  const logoX=marginLogo, logoY=height-logoH-marginLogo+10;
  imageMode(CORNER); image(logoImg,logoX,logoY,logoW,logoH);
}

// Helpers
function pointInPolygon(pt, poly){ let inside=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){ const xi=poly[i].x, yi=poly[i].y; const xj=poly[j].x, yj=poly[j].y; const intersect=((yi>pt.y)!=(yj>pt.y))&& (pt.x < (xj-xi)*(pt.y-yi)/(yj-yi)+xi); if(intersect) inside=!inside;} return inside; }

// TODO: Implementar handleContourFile y handleObstaclesFile SVG parsing
// === Manejadores de carga de SVG (stubs) ===
function handleContourFile(file) {
  if (file.type === 'image' && file.subtype.includes('svg')) {
    // TODO: parsear file.data y llenar contourPoints
    // por ahora marcamos como cargado para evitar errores:
    contourLoaded = true;
  } else {
    alert('Por favor sube un SVG válido para el contorno.');
  }
}

function handleObstaclesFile(file) {
  if (file.type === 'image' && file.subtype.includes('svg')) {
    // TODO: parsear file.data y llenar obstacleSVGPoints
  } else {
    alert('Por favor sube un SVG válido para los obstáculos.');
  }
}

function generateObstacleCircles(){ obstacleCircles=[]; const n=numObstacles; const r=float(sliderRadiusObstacle.value())*obstacleScale; const seed=int(sliderObstacleSeed.value()); randomSeed(seed); for(let i=0;i<n;i++){ const x=random(r,width-r), y=random(r,height-r); obstacleCircles.push({x,y,r}); }}

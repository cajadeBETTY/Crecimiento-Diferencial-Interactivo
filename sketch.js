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

// Load assets
function preload() {
  logoImg = loadImage('assets/logo.png');
  fuenteMonoLight = loadFont('assets/SourceCodePro-Light.ttf');
}

// Export SVG Implementation
function exportarSVG() {
  const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  const w = width, h = height;
  let svg = '<?xml version="1.0" encoding="UTF-8"?>';
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;

  // Contorno
  if (contourLoaded) {
    const pts = contourPoints.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
    svg += `<polyline fill="none" stroke="gray" stroke-width="2" points="${pts}"/>`;
  }
  // Obstáculos
  if (showObstacles) {
    obstacleCircles.forEach(o => {
      svg += `<circle cx="${o.x.toFixed(3)}" cy="${o.y.toFixed(3)}" r="${o.r.toFixed(3)}" fill="none" stroke="red" stroke-width="2"/>`;
    });
    obstacleSVGPoints.forEach(shape => {
      const pts = shape.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
      svg += `<polyline fill="none" stroke="red" stroke-width="2" points="${pts}"/>`;
    });
  }
  // Historial
  if (mostrarHistorial) {
    historialFormas.forEach(f => {
      const pts = f.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
      svg += `<polyline fill="none" stroke="lightgray" stroke-width="1" points="${pts}"/>`;
    });
  }
  // Curva principal
  if (points.length > 1) {
    const pts = points.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
    svg += `<polyline fill="none" stroke="black" stroke-width="2" points="${pts}"/>`;
  }
  // Nodos
  if (mostrarNodos) {
    points.forEach(p => {
      svg += `<circle cx="${p.x.toFixed(3)}" cy="${p.y.toFixed(3)}" r="2" fill="black"/>`;
    });
  }
  // Logo
  const margin = 30;
  const aspect = logoImg.width / logoImg.height;
  const lw = min(750, w - 2*margin);
  const lh = lw / aspect;
  const lx = margin;
  const ly = h - lh - margin;
  svg += `<image x="${lx}" y="${ly}" width="${lw}" height="${lh}" href="${logoImg.elt.src}"/>`;

  svg += '</svg>';
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `crecimiento_diferencial_${ts}.svg`;
  a.click();
  URL.revokeObjectURL(url);
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
    // TODO: parsear file.data y llenar contourPoints
    contourLoaded = true;
  } else {
    alert('Por favor sube un SVG válido para el contorno.');
  }
}

// Obstáculos functions
function handleObstaclesFile(file) {
  if (file.type === 'image' && file.subtype.includes('svg')) {
    // TODO: parsear file.data y llenar obstacleSVGPoints
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

// P5.js setup
function setup() {
  const uiWidth = document.getElementById('ui').getBoundingClientRect().width;
  const canvas = createCanvas(windowWidth - uiWidth, windowHeight);
  canvas.position(uiWidth, 0);
  pixelDensity(2);
  noFill();

  // Base
  sliderBaseRadius = select('#sliderBaseRadius');
  baseRadiusValor = select('#baseRadiusValor');
  sliderBaseRadius.input(() => { baseRadiusValor.html(sliderBaseRadius.value()); previewShape(); });
  select('#btnCircleBase').mousePressed(() => { fileLoaded = false; previewShape(); });
  fileInputBase = createFileInput(handleFile);
  fileInputBase.parent('ui'); fileInputBase.hide();
  select('#btnSubirSVGBase').mousePressed(() => { suppressDrag = true; fileInputBase.elt.click(); });

  // Contorno
  sliderContourRadius = select('#sliderContourRadius');
  contourRadiusValor = select('#contourRadiusValor');
  sliderContourRadius.input(() => { contourRadiusValor.html(sliderContourRadius.value()); generateContourCircle(); });
  select('#btnCircleContour').mousePressed(() => { contourLoaded = false; generateContourCircle(); });
  fileInputContour = createFileInput(handleContourFile);
  fileInputContour.parent('ui'); fileInputContour.hide();
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
  sliderObstacleSeed.input(() => { obstacleSeedValor.html(sliderObstacleSed.value()); generateObstacleCircles(); });
  sliderScaleObstacles.input(() => { obstacleScaleValor.html(sliderScaleObstacles.value()); obstacleScale = float(sliderScaleObstacles.value()); generateObstacleCircles(); });
  select('#toggleObstacles').changed(() => { showObstacles = select('#toggleObstacles').checked(); });
  select('#btnCircleObstacle').mousePressed(() => { obstacleSVGPoints = []; generateObstacleCircles(); });
  fileInputObstacles = createFileInput(handleObstaclesFile);
  fileInputObstacles.parent('ui'); fileInputObstacles.hide();
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
  select('#btnExportPNG').mousePressed(() => saveCanvas('crecimiento_diferencial','png')); select('#btnExportSVG').mousePressed(exportarSVG);

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
      const L = el.getTotalLength(); for (let i=0;i<n;i++) pts.push(createVector(...Object.values(el.getPointAtLength((i/n)*L))));
    } else { const list = el.points, coords = Array.from({length:list.numberOfItems},(_,i)=>list.getItem(i)); for (let i=0;i<n;i++){ const c=coords[floor((i/n)*coords.length)]; pts.push(createVector(c.x,c.y)); }}
  });
  fitPoints(pts); originalPoints = points.map(p=>p.copy()); iniciado=running=false;
}

function generarCurvaBase() {
  points = []; const n = int(inputPuntos.value()); const r=float(sliderBaseRadius.value()); for(let i=0;i<n;i++){ const a=TWO_PI*i/n; points.push(createVector(width/2+r*cos(a),height/2+r*sin(a))); } originalPoints=points.map(p=>p.copy()); iniciado=running=false;
}

function fitPoints(pts){ let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity; pts.forEach(p=>{minX=min(minX,p.x);maxX=max(maxX,p.x);minY=min(minY,p.y);maxY=max(maxY,p.y);} ); const s=(2*float(sliderBaseRadius.value()))/max(maxX-minX,maxY-minY); points=pts.map(p=>createVector((p.x-(minX+(maxX-minX)/2))*s+width/2,(p.y-(minY+(maxY-minY)/2))*s+height/2)); }

function iniciarCrecimiento(){ if(!points.length)return; const n=int(inputPuntos.value()); const c=TWO_PI*float(sliderBaseRadius.value()); const d=c/max(n,1); minDist=max(float(inputMinDist.value()),d*1.2); maxDist=max(float(inputMaxDist.value()),d*1.2); iniciado=running=true; }

function togglePlayPause(){ if(!iniciado){iniciarCrecimiento();select('#playPauseBtn').html('⏸ Pausar')}else{running=!running;select('#playPauseBtn').html(running?'⏸ Pausar':'▶ Reanudar')} }

function reiniciarCrecimiento(){ running=iniciado=false;offsetX=offsetY=0;zoom=1;noiseOffset=0;historialFormas=[];frameHistorial=0;points=originalPoints.map(p=>p.copy());select('#playPauseBtn').html('▶ Iniciar');redraw(); }

function draw(){ background(255);
  if(contourLoaded){stroke(180);noFill();strokeWeight(1);beginShape();contourPoints.forEach(p=>vertex(p.x,p.y));endShape(CLOSE);}  
  if(showObstacles){obstacleCircles.forEach(c=>{stroke('red');noFill();strokeWeight(1);circle(c.x,c.y,c.r*2)});obstacleSVGPoints.forEach(shape=>{stroke('red');noFill();strokeWeight(1);beginShape();shape.forEach(p=>vertex(p.x,p.y));endShape(CLOSE)});}  
  push();translate(width/2+offsetX,height/2+offsetY);scale(zoom);translate(-width/2,-height/2); /*historial+curva*/ pop();  
  if(iniciado&&running&&points.length<maxPoints){/*...*/}  
  const initialCount=int(inputPuntos.value()), circleRadiusMm=float(sliderBaseRadius.value());const lines=[];if(loadedFileName)lines.push(`Archivo Cargado: ${loadedFileName}`);else lines.push(`Forma Genérica: Círculo con ${initialCount} puntos`);const distPts=(TWO_PI*circleRadiusMm)/initialCount;lines.push(`Distancia entre puntos: ${distPts.toFixed(2)} mm`);lines.push(`Puntos actuales: ${points.length}`);const estado=!iniciado?'Nativo':(running?'En crecimiento':'En Pausa');lines.push(`Estado: ${estado}`);push();textFont(fuenteMonoLight);textSize(10);textAlign(RIGHT,TOP);fill(0);const m=30,x0=width-m,y0=height-m-10-lines.length*18;for(let i=0;i<lines.length;i++)text(lines[i],x0,y0+i*18);pop();const marginLogo=20,maxLogoWidth=750,logoAspect=logoImg.width/logoImg.height,logoW=maxLogoWidth,logoH=maxLogoWidth/logoAspect,logoX=marginLogo,logoY=height-logoH-marginLogo+10;imageMode(CORNER);image(logoImg,logoX,logoY,logoW,logoH);} 

function pointInPolygon(pt,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=poly[i].x,yi=poly[i].y,xj=poly[j].x,yj=poly[j].y,intersect=((yi>pt.y)!=(yj>pt.y))&&(pt.x<(xj-xi)*(pt.y-yi)/(yj-yi)+xi);if(intersect)inside=!inside;}return inside;}

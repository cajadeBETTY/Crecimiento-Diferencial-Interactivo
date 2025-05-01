// Sketch.js - Crecimiento Diferencial

// — Variables globales —
// Contorno
let contourPoints = [];
let contourLoaded = false;
let sliderContourRadius, contourRadiusValor;
// Obstáculos
let inputNumObstacles, numObstacles = 0;
let obstacleCircles = [];
let obstacleSVGPoints = [];
let sliderRadiusObstacle, obstacleRadiusValor;
let sliderObstacleSeed, obstacleSeedValor;
let sliderScaleObstacles, obstacleScaleValor;
let obstacleScale = 1;
let showObstacles = true;
// Base de crecimiento
let sliderBaseRadius, baseRadiusValor;
let fileInputBase;
// Nodos y Curva
let inputPuntos, inputMinDist, inputMaxDist, inputMaxPoints;
let points = [], originalPoints = [];
let fileLoaded = false, svgText = '', loadedFileName = '';
// UI
let tipoVisualSelect;
let toggleHistorialBtn, toggleNodosBtn, clearHistorialBtn;
// ■ UI flags
let activeBase       = false;
let activeContour    = false;
let activeObstacles  = false;
let draggingBase = false;
let draggingContour = false;
let draggingObstacle = false;

// ■ UI layout
const uiMargin      = 10;    // margen desde el borde
const uiSpacing     = 20;    // separación vertical entre ítems
const uiBoxSize     = 12;    // tamaño del checkbox
const uiTextOffset  = 5;     // separación texto–caja

// Historial
let mostrarHistorial = false, mostrarNodos = true;
let historialFormas = [], frameHistorial = 0, frecuenciaHistorial = 10;
// Experimental
let tipoRuidoSelect;
let sliderAmplitud, valorAmplitudSpan;
let sliderFrecuencia, valorFrecuenciaSpan;
let sliderRepulsion, valorRepulsionSpan;
// Crecimiento
let running = false, iniciado = false;
let maxPoints = 2000;
let noiseOffset = 0, minDist, maxDist;
// Transform
let zoom = 1, offsetX = 0, offsetY = 0;
let isDragging = false, suppressDrag = false;
let lastMouseX, lastMouseY;
// Assets
let logoImg, fuenteMonoLight;

// — Helpers —
// Umbral de selección en coordenadas de usuario (no de pantalla)
const selectThreshold = 10;

// — Variables de estado (coloca en globals) —
let draggingIndexBase    = -1;
let draggingIndexContour = -1;
let draggingObstacleIndex= -1;


function preload() {
  logoImg = loadImage('assets/logo.png');
  fuenteMonoLight = loadFont('assets/SourceCodePro-Light.ttf');
}

// 1) Manejador de archivo base SVG
function handleFile(file) {
  if (file.type === 'image' && file.subtype.includes('svg')) {
    svgText = file.data;
    fileLoaded = true;
    loadedFileName = file.name;
    generarCurvaFromSVG();
  } else {
    alert('Por favor sube un archivo SVG válido.');
  }
}

function exportarSVG() {
  const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  const w = width, h = height;

  // Cabecera del SVG
  let svg = '<?xml version="1.0" encoding="UTF-8"?>';
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;

  // 1. Contorno
  if (contourLoaded) {
    const pts = contourPoints.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
    svg += `<polyline fill="none" stroke="gray" stroke-width="2" points="${pts}"/>`;
  }

  // 2. Obstáculos
  if (showObstacles) {
    // Círculos genéricos
    obstacleCircles.forEach(o => {
      svg += `<circle cx="${o.x.toFixed(3)}" cy="${o.y.toFixed(3)}" r="${o.r.toFixed(3)}" fill="none" stroke="red" stroke-width="2"/>`;
    });
    // Formas SVG
    obstacleSVGPoints.forEach(shape => {
      const pts = shape.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
      svg += `<polyline fill="none" stroke="red" stroke-width="2" points="${pts}"/>`;
    });
  }

  // 3. Historial
  if (mostrarHistorial) {
    historialFormas.forEach(f => {
      const pts = f.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
      svg += `<polyline fill="none" stroke="lightgray" stroke-width="1" points="${pts}"/>`;
    });
  }

  // 4. Curva principal
  if (points.length > 1) {
    const pts = points.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
    svg += `<polyline fill="none" stroke="black" stroke-width="2" points="${pts}"/>`;
  }

  // 5. Nodos
  if (mostrarNodos) {
    points.forEach(p => {
      svg += `<circle cx="${p.x.toFixed(3)}" cy="${p.y.toFixed(3)}" r="2" fill="black"/>`;
    });
  }

  // 6. Logo en esquina
  const margin = 30;
  const aspect = logoImg.width / logoImg.height;
  const lw = Math.min(750, w - 2*margin);
  const lh = lw / aspect;
  const lx = margin;
  const ly = h - lh - margin;
  svg += `<image x="${lx}" y="${ly}" width="${lw}" height="${lh}" href="${logoImg.elt.src}"/>`;

  // Cierre de SVG
  svg += '</svg>';

  // Descarga automática
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `crecimiento_diferencial_${ts}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 3) Contorno: genera un polígono circular y añade explícitamente el cierre
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
  // Añade el primer punto al final para un cierre explícito
  if (contourPoints.length > 0) {
    contourPoints.push(contourPoints[0].copy());
  }
  contourLoaded = true;
}


function handleContourFile(file) {
  if (file.type === 'image' && file.subtype.includes('svg')) {
    let raw = file.data;
    if (raw.startsWith('data:image/svg+xml;base64,')) raw = atob(raw.split(',')[1]);
    const doc = new DOMParser().parseFromString(raw, 'image/svg+xml');
    const elems = Array.from(doc.querySelectorAll('path, polyline, polygon'));
    contourPoints = [];
    elems.forEach(el => {
      if (el.tagName === 'path') {
        const L = el.getTotalLength();
        for (let i = 0; i <= L; i++) {
          const pt = el.getPointAtLength(i);
          contourPoints.push(createVector(pt.x, pt.y));
        }
      } else {
        const list = el.points;
        for (let j = 0; j < list.numberOfItems; j++) {
          const p = list.getItem(j);
          contourPoints.push(createVector(p.x, p.y));
        }
      }
    });
    contourLoaded = true;
  } else {
    alert('Por favor sube un SVG válido para el contorno.');
  }
}

// 4) Obstáculos
function handleObstaclesFile(file) {
  if (file.type === 'image' && file.subtype.includes('svg')) {
    let raw = file.data;
    if (raw.startsWith('data:image/svg+xml;base64,')) raw = atob(raw.split(',')[1]);
    const doc = new DOMParser().parseFromString(raw, 'image/svg+xml');
    obstacleSVGPoints = Array.from(doc.querySelectorAll('path, polyline, polygon')).map(el => {
      const shape = [];
      if (el.tagName === 'path') {
        const L = el.getTotalLength();
        for (let i = 0; i <= L; i++) {
          const pt = el.getPointAtLength(i);
          shape.push(createVector(pt.x, pt.y));
        }
      } else {
        const list = el.points;
        for (let j = 0; j < list.numberOfItems; j++) {
          const p = list.getItem(j);
          shape.push(createVector(p.x, p.y));
        }
      }
      return shape;
    });
  } else {
    alert('Por favor sube un SVG válido para los obstáculos.');
  }
}

function generateObstacleCircles() {
  obstacleCircles = [];
  const n = numObstacles;
  const r = float(sliderRadiusObstacle.value()) * obstacleScale;
  randomSeed(int(sliderObstacleSeed.value()));
  for (let i = 0; i < n; i++) {
    const x = random(r, width - r);
    const y = random(r, height - r);
    obstacleCircles.push({ x, y, r });
  }
}

// 5) Curva base y SVG
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
  const pts = [];
  elems.forEach(el => {
    if (el.tagName === 'path') {
      const L = el.getTotalLength();
      for (let i = 0; i < n; i++) {
        const pt = el.getPointAtLength((i/n)*L);
        pts.push(createVector(pt.x, pt.y));
      }
    } else {
      const list = el.points;
      for (let i = 0; i < n; i++) {
        const p = list.getItem(floor((i/n)*list.numberOfItems));
        pts.push(createVector(p.x, p.y));
      }
    }
  });
  fitPoints(pts);
  originalPoints = points.map(p => p.copy());
  iniciado = running = false;
}

function fitPoints(pts) {
  let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
  pts.forEach(p => { minX=min(minX,p.x); maxX=max(maxX,p.x); minY=min(minY,p.y); maxY=max(maxY,p.y); });
  const s = (2*float(sliderBaseRadius.value()))/max(maxX-minX, maxY-minY);
  points = pts.map(p => createVector((p.x-(minX+(maxX-minX)/2))*s + width/2, (p.y-(minY+(maxY-minY)/2))*s + height/2));
}

// 6) Control de crecimiento
function iniciarCrecimiento() {
  if (!points.length) return;
  const n = int(inputPuntos.value());
  const c = TWO_PI * float(sliderBaseRadius.value());
  const d = c/max(n,1);
  minDist = max(float(inputMinDist.value()), d*1.2);
  maxDist = max(float(inputMaxDist.value()), d*1.2);
  iniciado = running = true;
}

function togglePlayPause() {
  if (!iniciado) {
    iniciarCrecimiento();
    select('#playPauseBtn').html('⏸ Pausar');
  } else {
    running = !running;
    select('#playPauseBtn').html(running?'⏸ Pausar':'▶ Reanudar');
  }
}

function reiniciarCrecimiento() {
  running=iniciado=false;
  offsetX=offsetY=0; zoom=1; noiseOffset=0;
  historialFormas=[]; frameHistorial=0;
  points = originalPoints.map(p=>p.copy());
  select('#playPauseBtn').html('▶ Iniciar');
  redraw();
}


// — Detectar clic en overlay —
function checkUIClick(mx, my) {
  const startX = width - uiMargin;
  const startY = uiMargin;
  // Base
  if (mx >= startX - uiBoxSize && mx <= startX && my >= startY && my <= startY + uiBoxSize) {
    activeBase = !activeBase;
    return true;
  }
  // Contorno
  if (mx >= startX - uiBoxSize && mx <= startX && my >= startY + uiSpacing && my <= startY + uiSpacing + uiBoxSize) {
    activeContour = !activeContour;
    return true;
  }
  // Obstáculos
  if (mx >= startX - uiBoxSize && mx <= startX && my >= startY + 2*uiSpacing && my <= startY + 2*uiSpacing + uiBoxSize) {
    activeObstacles = !activeObstacles;
    return true;
  }
  return false;
}

// — Manejo de mouse —
function mousePressed() {
  if (mouseButton === LEFT) {
    if (checkUIClick(mouseX, mouseY)) {
      return; // solo toggles
    }
    if (activeBase) {
      selectBaseCurve(mouseX, mouseY);
    } else if (activeContour) {
      selectContourCurve(mouseX, mouseY);
    } else if (activeObstacles) {
      selectObstacle(mouseX, mouseY);
    } else {
      // pan/zoom existente o nada
      isDragging = true;
      lastMouseX = mouseX;
      lastMouseY = mouseY;
    }
  }
}

function mouseDragged() {
  if (draggingBase) {
    dragBaseCurve(mouseX, mouseY);
  } else if (draggingContour) {
    dragContourCurve(mouseX, mouseY);
  } else if (draggingObstacle) {
    dragObstacle(mouseX, mouseY);
  } else if (isDragging) {
    offsetX += mouseX - lastMouseX;
    offsetY += mouseY - lastMouseY;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}

function mouseReleased() {
  isDragging = false;
  draggingBase = draggingContour = draggingObstacle = false;
}

function mouseWheel(event) {
  zoom *= (event.deltaY < 0 ? 1.05 : 1/1.05);
  return false; // prevenir scroll de página
}

// Sigue usando esta función para el panel HTML existente (id="ui")
function isMouseOverUI() {
  const b = document.getElementById('ui').getBoundingClientRect();
  return mouseX >= b.left &&
         mouseX <= b.right &&
         mouseY >= b.top &&
         mouseY <= b.bottom;
}

// — Base Curve — 
function selectBaseCurve(mx, my) {
  const loc = toLocalCoords(mx, my);
  // 1) buscar punto cercano
  draggingIndexBase = points.findIndex(p => dist(p.x, p.y, loc.x, loc.y) < selectThreshold);
  if (draggingIndexBase !== -1) {
    draggingBase = true;
  } else {
    // 2) si no hay punto, verificar bounding box para arrastrar toda la curva
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    if (loc.x >= minX && loc.x <= maxX && loc.y >= minY && loc.y <= maxY) {
      draggingIndexBase = -1; 
      draggingBase = true;
    }
  }
  // guarda para calcular delta
  lastMouseX = mx; 
  lastMouseY = my;
}

function dragBaseCurve(mx, my) {
  const dx = (mx - lastMouseX) / zoom;
  const dy = (my - lastMouseY) / zoom;
  if (draggingIndexBase >= 0) {
    // mover solo ese punto
    points[draggingIndexBase].x += dx;
    points[draggingIndexBase].y += dy;
  } else {
    // mover toda la curva
    points.forEach(p => {
      p.x += dx;
      p.y += dy;
    });
  }
  lastMouseX = mx;
  lastMouseY = my;
}

// — Contour Curve —
function selectContourCurve(mx, my) {
  const loc = toLocalCoords(mx, my);
  draggingIndexContour = contourPoints.findIndex(p => dist(p.x, p.y, loc.x, loc.y) < selectThreshold);
  if (draggingIndexContour !== -1) {
    draggingContour = true;
  } else {
    // bounding box
    const xs = contourPoints.map(p => p.x), ys = contourPoints.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    if (loc.x >= minX && loc.x <= maxX && loc.y >= minY && loc.y <= maxY) {
      draggingIndexContour = -1;
      draggingContour = true;
    }
  }
  lastMouseX = mx; lastMouseY = my;
}

function dragContourCurve(mx, my) {
  const dx = (mx - lastMouseX) / zoom;
  const dy = (my - lastMouseY) / zoom;
  if (draggingIndexContour >= 0) {
    contourPoints[draggingIndexContour].x += dx;
    contourPoints[draggingIndexContour].y += dy;
  } else {
    contourPoints.forEach(p => {
      p.x += dx;
      p.y += dy;
    });
  }
  lastMouseX = mx;
  lastMouseY = my;
}

// — Obstáculos (círculos) —
function selectObstacle(mx, my) {
  const loc = toLocalCoords(mx, my);
  // prueba cada círculo
  draggingObstacleIndex = obstacleCircles.findIndex(o => dist(loc.x, loc.y, o.x, o.y) < o.r);
  if (draggingObstacleIndex !== -1) {
    draggingObstacle = true;
  }
  lastMouseX = mx; lastMouseY = my;
}

function dragObstacle(mx, my) {
  const dx = (mx - lastMouseX) / zoom;
  const dy = (my - lastMouseY) / zoom;
  if (draggingObstacleIndex >= 0) {
    const o = obstacleCircles[draggingObstacleIndex];
    o.x += dx;
    o.y += dy;
  }
  lastMouseX = mx;
  lastMouseY = my;
}
// 8) Setup
function setup() {
  const uiWidth = document.getElementById('ui').getBoundingClientRect().width;
  createCanvas(windowWidth-uiWidth, windowHeight).position(uiWidth, 0);
  pixelDensity(2);

  // Base de Crecimiento
  sliderBaseRadius=select('#sliderBaseRadius'); baseRadiusValor=select('#baseRadiusValor');
  sliderBaseRadius.input(()=>{ baseRadiusValor.html(sliderBaseRadius.value()); previewShape(); });
  select('#btnCircleBase').mousePressed(()=>{ fileLoaded=false; previewShape(); });
  fileInputBase=createFileInput(handleFile).parent('ui').hide();
  select('#btnSubirSVGBase').mousePressed(()=>{ suppressDrag=true; fileInputBase.elt.click(); });

  // Contorno
  sliderContourRadius=select('#sliderContourRadius'); contourRadiusValor=select('#contourRadiusValor');
  sliderContourRadius.input(()=>{ contourRadiusValor.html(sliderContourRadius.value()); generateContourCircle(); });
  select('#btnCircleContour').mousePressed(()=>{ contourLoaded=false; generateContourCircle(); });
  createFileInput(handleContourFile).parent('ui').hide();
  select('#btnSubirSVGContour').mousePressed(()=>{ suppressDrag=true; select('input[type=file]').elt.click(); });

  // Obstáculos
  inputNumObstacles=select('#inputNumObstacles');
  sliderRadiusObstacle=select('#sliderRadiusObstacle'); obstacleRadiusValor=select('#obstacleRadiusValor');
  sliderObstacleSeed=select('#sliderObstacleSeed'); obstacleSeedValor=select('#obstacleSeedValor');
  sliderScaleObstacles=select('#sliderScaleObstacles'); obstacleScaleValor=select('#obstacleScaleValor');
  inputNumObstacles.input(()=>{ numObstacles=int(inputNumObstacles.value()); generateObstacleCircles(); });
  sliderRadiusObstacle.input(()=>{ obstacleRadiusValor.html(sliderRadiusObstacle.value()); generateObstacleCircles(); });
  sliderObstacleSeed.input(()=>{ obstacleSeedValor.html(sliderObstacleSeed.value()); generateObstacleCircles(); });
  sliderScaleObstacles.input(()=>{ obstacleScaleValor.html(sliderScaleObstacles.value()); obstacleScale=float(sliderScaleObstacles.value()); generateObstacleCircles(); });
  select('#toggleObstacles').changed(()=>showObstacles=select('#toggleObstacles').checked());
  select('#btnCircleObstacle').mousePressed(()=>{ obstacleSVGPoints=[]; generateObstacleCircles(); });
  createFileInput(handleObstaclesFile).parent('ui').hide();
  select('#btnSubirSVGObstacles').mousePressed(()=>{ suppressDrag=true; select('input[type=file]').elt.click(); });

  // Nodos
  inputPuntos=select('#inputPuntos'); inputMinDist=select('#inputMinDist'); inputMaxDist=select('#inputMaxDist'); inputMaxPoints=select('#inputMaxPoints');
  inputPuntos.input(previewShape); inputMaxPoints.input(()=>maxPoints=int(inputMaxPoints.value()));
  select('#playPauseBtn').mousePressed(togglePlayPause); select('#restartBtn').mousePressed(reiniciarCrecimiento);

  // Visualización
  tipoVisualSelect=select('#tipoVisual');
  toggleNodosBtn=select('#toggleNodosBtn').mousePressed(()=>{ mostrarNodos=!mostrarNodos; toggleNodosBtn.html(mostrarNodos?'🔘 Ocultar nodos':'🔘 Mostrar nodos'); });
  toggleHistorialBtn=select('#toggleHistorialBtn').mousePressed(()=>{ mostrarHistorial=!mostrarHistorial; toggleHistorialBtn.html(mostrarHistorial?'🕘 Ocultar historial':'🕘 Ver historial'); });
  clearHistorialBtn=select('#clearHistorialBtn').mousePressed(()=>{ historialFormas=[]; frameHistorial=0; });
  select('#inputFrecuenciaHistorial').changed(()=>frecuenciaHistorial=int(select('#inputFrecuenciaHistorial').value()));

  // Experimental
  tipoRuidoSelect=select('#tipoRuido');
  sliderAmplitud=select('#sliderAmplitud'); valorAmplitudSpan=select('#valorAmplitud'); sliderFrecuencia=select('#sliderFrecuencia'); valorFrecuenciaSpan=select('#valorFrecuencia'); sliderRepulsion=select('#sliderRepulsion'); valorRepulsionSpan=select('#valorRepulsion');
  sliderAmplitud.input(()=>valorAmplitudSpan.html(sliderAmplitud.value()));
  sliderFrecuencia.input(()=>valorFrecuenciaSpan.html(sliderFrecuencia.value()));
  sliderRepulsion.input(()=>valorRepulsionSpan.html(sliderRepulsion.value()));

  // Export
  select('#btnExportPNG').mousePressed(()=>saveCanvas('crecimiento_diferencial','png'));
  select('#btnExportSVG').mousePressed(exportarSVG);

  // Inicializar base y dibujar
  generarCurvaBase();
  redraw();
}

function windowResized() {
  const uiWidth = document.getElementById('ui').getBoundingClientRect().width;
  resizeCanvas(windowWidth-uiWidth, windowHeight);
  select('canvas').position(uiWidth,0);
}

function previewShape() {
  fileLoaded ? generarCurvaFromSVG() : generarCurvaBase();
  redraw();
}

function pointInPolygon(point, vs) {
  let x = point.x, y = point.y;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i].x, yi = vs[i].y;
    let xj = vs[j].x, yj = vs[j].y;
    let intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Función principal de dibujo
function draw() {
  background(255);
  // — PREPARAR TEXTO DE INFORMACIÓN —
  const initialCount = int(inputPuntos.value());
  const circleRadiusMm = float(sliderBaseRadius.value());
  const lines = [];
  if (loadedFileName) {
    lines.push(`Archivo Cargado: ${loadedFileName}`);
  } else {
    lines.push(`Forma Genérica: Círculo con ${initialCount} puntos`);
  }
  const distPts = (TWO_PI * circleRadiusMm) / initialCount;
  lines.push(`Distancia entre puntos: ${distPts.toFixed(2)} mm`);
  lines.push(`Puntos actuales: ${points.length}`);
  const estado = !iniciado ? 'Nativo' : (running ? 'En crecimiento' : 'En Pausa');
  lines.push(`Estado: ${estado}`);
  // — 1) DIBUJAR BAJO TRANSFORM (zoom/pan) —
  push();
    translate(width/2 + offsetX, height/2 + offsetY);
    scale(zoom);
    translate(-width/2, -height/2);

    // 1a. Contorno — siempre visible (NO usar activeContour aquí)
    if (contourLoaded) {
      stroke(180); noFill(); strokeWeight(1);
      beginShape(); contourPoints.forEach(p => vertex(p.x, p.y)); endShape(CLOSE);
    }

    // 1b. Obstáculos — siempre visibles (NO usar activeObstacles aquí)
    obstacleCircles.forEach(o => {
      stroke(255,0,0); noFill(); strokeWeight(1);
      circle(o.x, o.y, o.r*2);
    });
    obstacleSVGPoints.forEach(shape => {
      stroke(255,0,0); noFill(); strokeWeight(1);
      beginShape(); shape.forEach(p => vertex(p.x,p.y)); endShape(CLOSE);
    });

    // 1c. Historial — opcional
    if (mostrarHistorial) {
      stroke(180); noFill(); strokeWeight(1/zoom);
      historialFormas.forEach(f => {
        beginShape();
        /* ... */
        endShape();
      });
    }
      // ===== CAMBIO CLAVE =====
    // 1d. Curva principal — ¡SIEMPRE dibujar!
    //  - Se dibuja siempre, independientemente del estado de activeBase
    if (points.length > 1) {
      stroke(0); noFill(); strokeWeight(1/zoom);
      if (!iniciado) {
        // Dibujo inicial: forma genérica
        beginShape(); points.forEach(p=>vertex(p.x,p.y)); endShape(CLOSE);
      } else if (tipoVisualSelect.value() === 'curva') {
        // Dibujo suave
        const L = points.length;
        beginShape();
          curveVertex(points[(L-2+L)%L].x, points[(L-2+L)%L].y);
          curveVertex(points[L-1].x, points[L-1].y);
          points.forEach(p=>curveVertex(p.x,p.y));
          curveVertex(points[0].x, points[0].y);
          curveVertex(points[1].x, points[1].y);
        endShape();
      } else {
        // Dibujo poligonal
        beginShape(); points.forEach(p=>vertex(p.x,p.y)); endShape(CLOSE);
      }

      // nodos — opcional
      if (mostrarNodos) {
        fill(0); noStroke();
        points.forEach(p=>circle(p.x,p.y,4/zoom));
      }
    }
    // ===== FIN CAMBIO =====

  pop();

  // — 2) CRECIMIENTO —
  if (iniciado && running && points.length < maxPoints) {
    // Historial de formas
    if (frameHistorial % frecuenciaHistorial === 0) {
      historialFormas.push(points.map(p => p.copy()));
      if (historialFormas.length > 100) {
        historialFormas.shift(); // Límite de histórico
      }
    }
    frameHistorial++;

    // Generar nuevos puntos
    let nuevos = [];
    points.forEach((act, i) => {
      let f = createVector(0, 0), c = 0;

      // Repulsión entre puntos
      points.forEach((o, j) => {
        if (i !== j) {
          const d = dist(act.x, act.y, o.x, o.y);
          if (d < minDist) {
            f.add(
              p5.Vector.sub(act, o)
                .normalize()
                .mult(float(sliderRepulsion.value()) / d)
            );
            c++;
          }
        }
      });

      // Ruido
      let rn = createVector(0, 0);
      const tt  = tipoRuidoSelect.value();
      const amp = float(sliderAmplitud.value());
      const fr  = float(sliderFrecuencia.value());
      switch (tt) {
        case 'perlin': {
          const n2 = noise(act.x * fr, act.y * fr + noiseOffset);
          rn = p5.Vector.fromAngle(n2 * TWO_PI).mult(amp);
          break;
        }
        case 'perlinImproved': {
          rn = createVector(
            (noise(act.x * fr, noiseOffset) - 0.5) * amp * 2,
            (noise(act.y * fr, noiseOffset + 1000) - 0.5) * amp * 2
          );
          break;
        }
        case 'valor': {
          rn = createVector(random(-1, 1) * amp, random(-1, 1) * amp);
          break;
        }
        case 'simple': {
          rn = p5.Vector.random2D().mult(amp);
          break;
        }
      }
      f = (c > 0) ? f.div(c).add(rn) : rn;

      // Límites de contorno
      const nextPos = p5.Vector.add(act, f);
      if (contourLoaded && !pointInPolygon(nextPos, contourPoints)) {
        const centroid =
          contourPoints.slice(0, -1)
            .reduce((ac, v) => ac.add(v), createVector(0, 0))
            .div(contourPoints.length - 1);
        f = p5.Vector.sub(centroid, act).normalize().mult(f.mag());
      }

      // Repulsión de obstáculos
      if (activeObstacles) {
        obstacleCircles.forEach(o => {
          const centro = createVector(o.x, o.y);
          const dNext  = p5.Vector.dist(nextPos, centro);
          if (dNext < o.r) {
            const away     = p5.Vector.sub(act, centro).normalize();
            const strength = (o.r - dNext) * float(sliderObstacleStrength.value());
            f.add(away.mult(strength));
          }
        });
        obstacleSVGPoints.forEach(shape => {
          if (pointInPolygon(nextPos, shape)) {
            const centroidSVG =
              shape.slice(0, -1)
                .reduce((ac, v) => ac.add(v.copy()), createVector(0, 0))
                .div(shape.length - 1);
            const away     = p5.Vector.sub(act, centroidSVG).normalize();
            const strength = float(sliderObstacleStrength.value());
            f.add(away.mult(strength));
          }
        });
      }

      // Movimiento y subdivisión
      act.add(f);
      nuevos.push(act);
      const np = points[(i + 1) % points.length];
      if (p5.Vector.dist(act, np) > maxDist) {
        nuevos.push(p5.Vector.add(act, np).div(2));
      }
    });

    // Reasignar y avanzar ruido
    points = nuevos;
    noiseOffset = (noiseOffset + 0.01) % 1000;
  } // <- Cierre exacto del bloque CRECIMIENTO

  // — 3) TEXTO DE INFO EN BORDE INFERIOR —
  push();
    textFont(fuenteMonoLight);
    textSize(10);
    textAlign(RIGHT, TOP);
    fill(0);
    const m2 = 30;
    const x0_ = width - m2;
    const y0_ = height - m2 - 10 - lines.length * 18;
    lines.forEach((line, idx) => text(line, x0_, y0_ + idx * 18));
  pop();

  // — 4) OVERLAY UI Y LOGO —
  drawOverlayUI();
}

// Función de dibujo del menú overlay y logo
function drawOverlayUI() {
  push(); noFill(); stroke(0); strokeWeight(1); textAlign(LEFT, TOP); textSize(14);
  const startX = width - uiMargin;
  const startY = uiMargin;
  const items = [
    { label: 'Curva Base',     flag: () => activeBase },
    { label: 'Curva Contorno', flag: () => activeContour },
    { label: 'Obstáculos',     flag: () => activeObstacles }
  ];
  items.forEach((item, i) => {
    const y = startY + i * uiSpacing;
    const x0 = startX - uiBoxSize;
    rect(x0, y, uiBoxSize, uiBoxSize);
    if (item.flag()) {
      line(x0, y, x0 + uiBoxSize, y + uiBoxSize);
      line(x0 + uiBoxSize, y, x0, y + uiBoxSize);
    }
    noStroke(); fill(0);
    text(item.label, x0 - uiTextOffset - textWidth(item.label), y);
    stroke(0); noFill();
  });
  pop();

  push();
    const marginLogo = 20;
    const maxLogoWidth = 100;
    const aspect = logoImg.width / logoImg.height;
    const logoW = min(maxLogoWidth, logoImg.width);
    const logoH = logoW / aspect;
    imageMode(CORNER);
    image(logoImg, marginLogo, height - logoH - marginLogo, logoW, logoH);
  pop();
}

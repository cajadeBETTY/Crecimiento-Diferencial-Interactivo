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

// 3) Contorno
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

// 7) Pan/zoom
function mousePressed(){ if(mouseButton===LEFT && !suppressDrag){ isDragging=true; lastMouseX=mouseX; lastMouseY=mouseY; }}
function mouseReleased(){ isDragging=false; suppressDrag=false; }
function mouseDragged(){ if(isDragging && !suppressDrag && !isMouseOverUI()){ offsetX+=mouseX-lastMouseX; offsetY+=mouseY-lastMouseY; lastMouseX=mouseX; lastMouseY=mouseY; }}
function mouseWheel(event){ zoom*=(event.deltaY<0?1.05:1/1.05); return false; }
function isMouseOverUI(){ const b=document.getElementById('ui').getBoundingClientRect(); return mouseX>=b.left && mouseX<=b.right && mouseY>=b.top && mouseY<=b.bottom; }

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

function draw() {
  background(255);

  // — 1. DIBUJAR CONTORNO —
  if (contourLoaded) {
    stroke(180); noFill(); strokeWeight(1);
    beginShape(); contourPoints.forEach(p => vertex(p.x, p.y)); endShape(CLOSE);
  }

  // — 2. DIBUJAR OBSTÁCULOS —
  if (showObstacles) {
    obstacleCircles.forEach(o => {
      stroke('red'); noFill(); strokeWeight(1);
      circle(o.x, o.y, o.r * 2);
    });
    obstacleSVGPoints.forEach(shape => {
      stroke('red'); noFill(); strokeWeight(1);
      beginShape(); shape.forEach(p => vertex(p.x, p.y)); endShape(CLOSE);
    });
  }

  // — 3. DIBUJAR CURVA bajo transform (zoom/pan) —
  push();
    translate(width/2 + offsetX, height/2 + offsetY);
    scale(zoom);
    translate(-width/2, -height/2);

    // historial
    if (mostrarHistorial) {
      stroke(180); noFill(); strokeWeight(1/zoom);
      historialFormas.forEach(f => {
        beginShape();
          const L = f.length;
          curveVertex(f[(L-2+L)%L].x, f[(L-2+L)%L].y);
          curveVertex(f[L-1].x, f[L-1].y);
          f.forEach(p => curveVertex(p.x, p.y));
          curveVertex(f[0].x, f[0].y);
          curveVertex(f[1].x, f[1].y);
        endShape();
      });
    }

    // curva principal
    if (points.length > 1) {
      stroke(0); noFill(); strokeWeight(1/zoom);
      if (tipoVisualSelect.value() === 'curva') {
        const L = points.length;
        beginShape();
          curveVertex(points[(L-2+L)%L].x, points[(L-2+L)%L].y);
          curveVertex(points[L-1].x, points[L-1].y);
          points.forEach(p => curveVertex(p.x, p.y));
          curveVertex(points[0].x, points[0].y);
          curveVertex(points[1].x, points[1].y);
        endShape();
      } else {
        beginShape();
          points.forEach(p => vertex(p.x, p.y));
        endShape(CLOSE);
      }

      // nodos
      if (mostrarNodos) {
        fill(0); noStroke();
        points.forEach(p => circle(p.x, p.y, 4/zoom));
      }
    }
  pop();

  // — 4. CRECIMIENTO —
  if (iniciado && running && points.length < maxPoints) {
    if (frameHistorial % frecuenciaHistorial === 0) {
      historialFormas.push(points.map(p => p.copy()));
    }
    frameHistorial++;
    let nuevos = [];
    points.forEach((act, i) => {
      let f = createVector(0, 0), c = 0;
      points.forEach((o, j) => {
        if (i !== j) {
          const d = dist(act.x, act.y, o.x, o.y);
          if (d < minDist) {
            f.add(p5.Vector.sub(act, o).normalize().mult(float(sliderRepulsion.value()) / d));
            c++;
          }
        }
      });
      let rn = createVector(0, 0);
      const tt = tipoRuidoSelect.value();
      const amp = float(sliderAmplitud.value());
      const fr = float(sliderFrecuencia.value());
      if (tt === 'perlin') {
        const n2 = noise(act.x * fr, act.y * fr + noiseOffset);
        rn = p5.Vector.fromAngle(n2 * TWO_PI).mult(amp);
      } else if (tt === 'perlinImproved') {
        const nx = noise(act.x * fr, noiseOffset);
        const ny = noise(act.y * fr, noiseOffset + 1000);
        rn = createVector((nx - 0.5) * amp * 2, (ny - 0.5) * amp * 2);
      } else if (tt === 'valor') {
        rn = createVector(random(-1, 1) * amp, random(-1, 1) * amp);
      } else if (tt === 'simple') {
        rn = p5.Vector.random2D().mult(amp);
      }
      if (c > 0) {
        f.div(c).add(rn);
      } else {
        f = rn;
      }

      // límites contorno
      const nextPos = p5.Vector.add(act, f);
      if (contourLoaded && !pointInPolygon(nextPos, contourPoints)) {
        f.mult(-1);
      }

      // repel obstáculos
      if (showObstacles) {
        obstacleCircles.forEach(o => {
          const d = dist(act.x, act.y, o.x, o.y);
          if (d < o.r) {
            const repel = p5.Vector.sub(act, createVector(o.x, o.y)).setMag((o.r - d) * 0.1);
            f.add(repel);
          }
        });
        obstacleSVGPoints.forEach(shape => {
          if (pointInPolygon(nextPos, shape)) {
            const repel = p5.Vector.sub(act, nextPos).mult(0.5);
            f.add(repel);
          }
        });
      }

      act.add(f);
      nuevos.push(act);
      const np = points[(i + 1) % points.length];
      if (p5.Vector.dist(act, np) > maxDist) {
        nuevos.push(p5.Vector.add(act, np).div(2));
      }
    });
    points = nuevos;
    noiseOffset += 0.01;
  }

  // — 5. INFO TEXT —
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
  push();
    textFont(fuenteMonoLight);
    textSize(10);
    textAlign(RIGHT, TOP);
    fill(0);
    const m = 30;
    const x0 = width - m;
    const y0 = height - m - 10 - lines.length * 18;
    for (let i = 0; i < lines.length; i++) {
      text(lines[i], x0, y0 + i * 18);
    }
  pop();

  // — 6. Logo —
  const marginLogo = 20;
  const maxLogoWidth = 750;
  const logoAspect = logoImg.width / logoImg.height;
  const logoW = maxLogoWidth;
  const logoH = maxLogoWidth / logoAspect;
  const logoX = marginLogo;
  const logoY = height - logoH - marginLogo + 10;
  imageMode(CORNER);
  image(logoImg, logoX, logoY, logoW, logoH);
}

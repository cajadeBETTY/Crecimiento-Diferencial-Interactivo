// Sketch.js - Crecimiento Diferencial
let points = [];
let originalPoints = [];
let fileLoaded = false;
let svgText = '';

let running = false;
let iniciado = false;
let maxPoints = 2000;

let zoom = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let suppressDrag = false;
let lastMouseX, lastMouseY;

// UI elements
let inputPuntos, sliderRadio, radioValorSpan;
let inputMinDist, inputMaxDist, inputMaxPoints, inputFrecuenciaHistorial;
let tipoRuidoSelect, sliderAmplitud, sliderFrecuencia;
let valorAmplitudSpan, valorFrecuenciaSpan;
let sliderRepulsion, valorRepulsionSpan;
let tipoVisualSelect;
let toggleHistorialBtn, toggleNodosBtn, clearHistorialBtn;
let formaGenericaSelect, inputLados;
let fileInputSVG;

// History
let mostrarHistorial = false;
let mostrarNodos = true;
let historialFormas = [];
let frameHistorial = 0;
let frecuenciaHistorial = 10;

// Growth params
let noiseOffset = 0;
let minDist, maxDist;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  noFill();

  // Inputs
  inputMinDist = select('#inputMinDist');
  inputMaxDist = select('#inputMaxDist');
  inputMaxPoints = select('#inputMaxPoints');
  inputFrecuenciaHistorial = select('#inputFrecuenciaHistorial');
  inputPuntos = select('#inputPuntos');
  inputPuntos.input(previewShape);
  inputFrecuenciaHistorial.input(() => frecuenciaHistorial = int(inputFrecuenciaHistorial.value()));

  sliderRadio = select('#sliderRadio');
  radioValorSpan = select('#radioValor');
  sliderRadio.input(() => { radioValorSpan.html(sliderRadio.value()); previewShape(); });
  radioValorSpan.html(sliderRadio.value());

  tipoRuidoSelect = select('#tipoRuido');
  sliderAmplitud = select('#sliderAmplitud');
  sliderFrecuencia = select('#sliderFrecuencia');          // <-- variable correcta
  valorAmplitudSpan = select('#valorAmplitud');
  valorFrecuenciaSpan = select('#valorFrecuencia');
  sliderAmplitud.input(() => valorAmplitudSpan.html(sliderAmplitud.value()));
  sliderFrecuencia.input(() => valorFrecuenciaSpan.html(sliderFrecuencia.value()));  // <-- idem

  sliderRepulsion = select('#sliderRepulsion');
  valorRepulsionSpan = select('#valorRepulsion');
  sliderRepulsion.input(() => valorRepulsionSpan.html(sliderRepulsion.value()));

  tipoVisualSelect = select('#tipoVisual');
  
  toggleHistorialBtn = select('#toggleHistorialBtn');
  toggleNodosBtn = select('#toggleNodosBtn');
  clearHistorialBtn = select('#clearHistorialBtn');
  toggleHistorialBtn.mousePressed(() => {
    mostrarHistorial = !mostrarHistorial;
    toggleHistorialBtn.html(mostrarHistorial ? '🕘 Ocultar historial' : '🕘 Ver historial');
  });
  toggleNodosBtn.mousePressed(() => {
    mostrarNodos = !mostrarNodos;
    toggleNodosBtn.html(mostrarNodos ? '🔘 Ocultar nodos' : '🔘 Mostrar nodos');
  });
  clearHistorialBtn.mousePressed(() => { historialFormas = []; frameHistorial = 0; });

  select('#playPauseBtn').mousePressed(togglePlayPause);
  select('#restartBtn').mousePressed(reiniciarCrecimiento);

  select('#btnExportPNG').mousePressed(() => saveCanvas('crecimiento_diferencial','png'));
  select('#btnExportSVG').mousePressed(exportarSVG);

  formaGenericaSelect = select('#formaGenericaSelect');
  inputLados = select('#inputLados');
  inputLados.attribute('disabled','');
  // Al cambiar la forma, descartamos cualquier SVG previo:
  formaGenericaSelect.changed(() => {
    fileLoaded = false;               // <<-- Aquí: reinicia estado SVG al elegir forma genérica
    previewShape();
  });
  inputLados.input(previewShape);

  fileInputSVG = createFileInput(handleFile);
  fileInputSVG.parent('ui');
  fileInputSVG.hide();
  select('#btnSubirSVG').mousePressed(() => { suppressDrag = true; fileInputSVG.elt.click(); });

  previewShape();
}

function previewShape() {
  fileLoaded ? generarCurvaFromSVG() : generarCurvaBase();
  redraw();
}

function handleFile(file) {
  console.log('handleFile:', file);
  if (file.type === 'image' && file.subtype.includes('svg')) {
    svgText = file.data;
    fileLoaded = true;
    generarCurvaFromSVG();
  } else {
    alert('Por favor sube un archivo SVG válido.');
  }
}

function generarCurvaFromSVG() {
  let raw = svgText;
  if (raw.startsWith('data:image/svg+xml;base64,')) {
    raw = atob(raw.split(',')[1]);
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, 'image/svg+xml');
  const elems = Array.from(doc.querySelectorAll('path, polyline, polygon'));
  console.log('Elementos SVG encontrados:', elems.map(e => e.tagName));
  if (!elems.length) {
    console.warn('No se encontró ningún <path>, <polyline> ni <polygon>.');
    return;
  }
  const n = int(inputPuntos.value());
  let pts = [];
  elems.forEach(el => {
    if (el.tagName.toLowerCase() === 'path') {
      const L = el.getTotalLength();
      for (let i = 0; i < n; i++) {
        const p = el.getPointAtLength((i / n) * L);
        pts.push(createVector(p.x, p.y));
      }
    } else {
      const list = el.points;
      let coords = [];
      for (let i = 0; i < list.numberOfItems; i++) {
        const p = list.getItem(i);
        coords.push({ x: p.x, y: p.y });
      }
      for (let i = 0; i < n; i++) {
        const idx = floor((i / n) * coords.length);
        pts.push(createVector(coords[idx].x, coords[idx].y));
      }
    }
  });
  // Centrado y escalado
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  pts.forEach(p => {
    minX = min(minX, p.x);
    maxX = max(maxX, p.x);
    minY = min(minY, p.y);
    maxY = max(maxY, p.y);
  });
  const w = maxX - minX, h = maxY - minY;
  const r = float(sliderRadio.value());
  const s = (r * 2) / max(w, h);
  points = pts.map(p =>
    createVector(
      (p.x - (minX + w/2)) * s + width/2,
      (p.y - (minY + h/2)) * s + height/2
    )
  );
  console.log('Puntos mapeados:', points.length);
  originalPoints = points.map(p => p.copy());
  iniciado = running = false;
}

function generarCurvaBase() {
  console.log('gen base');
  points = [];
  const tipo = formaGenericaSelect.value();
  const n = int(inputPuntos.value());
  const r = float(sliderRadio.value());
  const lados = tipo === 'poligono' ? int(inputLados.value()) : n;
  if (tipo !== 'none') {
    for (let i = 0; i < lados; i++) {
      const a = TWO_PI * i / lados;
      points.push(createVector(width/2 + r * cos(a), height/2 + r * sin(a)));
    }
    originalPoints = points.map(p => p.copy());
    iniciado = running = false;
  }
}

function iniciarCrecimiento() {
  if (!points.length) return;
  const n = int(inputPuntos.value());
  const c = TWO_PI * float(sliderRadio.value());
  const d = c / max(n, 1);
  minDist = float(inputMinDist.value()) > 0 ? float(inputMinDist.value()) : d * 1.2;
  maxDist = float(inputMaxDist.value()) > 0 ? float(inputMaxDist.value()) : d * 1.2;
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
  running = false;
  iniciado = false;
  offsetX = offsetY = 0;
  zoom = 1;
  noiseOffset = 0;
  historialFormas = [];
  frameHistorial = 0;
  points = originalPoints.map(p => p.copy());
  select('#playPauseBtn').html('▶ Iniciar');
  redraw();
}

function draw() {
  background(255);
  push();
  translate(width/2 + offsetX, height/2 + offsetY);
  scale(zoom);
  translate(-width/2, -height/2);

  if (mostrarHistorial) {
    stroke(180);
    noFill();
    historialFormas.forEach(f => {
      beginShape();
      f.forEach(p => tipoVisualSelect.value()==='curva' ? curveVertex(p.x,p.y) : vertex(p.x,p.y));
      tipoVisualSelect.value()==='curva' ? endShape() : endShape(CLOSE);
    });
  }

  if (points.length) {
    stroke(0);
    noFill();
    strokeWeight(1/zoom);
    beginShape();
    if (tipoVisualSelect.value()==='curva') {
      const L = points.length;
      curveVertex(points[L-2].x,points[L-2].y);
      curveVertex(points[L-1].x,points[L-1].y);
      points.forEach(p => curveVertex(p.x,p.y));
      curveVertex(points[0].x,points[0].y);
      curveVertex(points[1].x,points[1].y);
      endShape();
    } else {
      points.forEach(p => vertex(p.x,p.y));
      endShape(CLOSE);
    }
    if (mostrarNodos) {
      fill(0);
      noStroke();
      points.forEach(p => circle(p.x,p.y,4/zoom));
    }
  }
  pop();

if (!iniciado || !running || points.length >= maxPoints) return;

// 1) Grabar siempre el historial cada N frames:
if (frameHistorial % frecuenciaHistorial === 0) {
  historialFormas.push(points.map(p => p.copy()));
}
frameHistorial++;

// 2) Luego el resto de tu lógica de crecimiento...


  let nuevos = [];
  points.forEach((act,i) => {
    let f = createVector(0,0), c = 0;
    points.forEach((o,j) => {
      if (i!==j) {
        const d = dist(act.x,act.y,o.x,o.y);
        if (d<minDist) {
          f.add(p5.Vector.sub(act,o).normalize().mult(float(sliderRepulsion.value())/d));
          c++;
        }
      }
    });
  const tt  = tipoRuidoSelect.value();
let rn = createVector(0,0);
const amp = float(sliderAmplitud.value());
const fr  = float(sliderFrecuencia.value());

if (tt === 'perlin') {
  const n2 = noise(act.x * fr, act.y * fr + noiseOffset);
  rn = p5.Vector.fromAngle(n2 * TWO_PI).mult(amp);
}
else if (tt === 'perlinImproved') {
  const nx = noise(act.x * fr, noiseOffset);
  const ny = noise(act.y * fr, noiseOffset + 1000);
  rn = createVector((nx - 0.5) * amp * 2, (ny - 0.5) * amp * 2);
}
else if (tt === 'valor') {
  rn = createVector(random(-1, 1) * amp, random(-1, 1) * amp);
}
else if (tt === 'simple') {
  rn = p5.Vector.random2D().mult(amp);
}
// else if tt === 'ninguno', rn queda en (0,0) y por tanto no añade ruido

    act.add(f);
    nuevos.push(act);
    const np = points[(i+1)%points.length];
    if (p5.Vector.dist(act,np)>maxDist) {
      nuevos.push(p5.Vector.add(act,np).div(2));
    }
  });
  points = nuevos;
  noiseOffset += 0.01;
}

// Pan with mouse drag
function mousePressed() {
  if (mouseButton===LEFT) {
    isDragging = true;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}

function mouseReleased() {
  isDragging = false;
  suppressDrag = false;
}

function mouseDragged() {
  if (isDragging && !suppressDrag && !isMouseOverUI()) {
    offsetX += mouseX - lastMouseX;
    offsetY += mouseY - lastMouseY;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}

// Zoom with mouse wheel
function mouseWheel(event) {
  const factor = 1.05;
  if (event.deltaY < 0) {
    zoom *= factor;
  } else {
    zoom /= factor;
  }
  return false; // prevenir scroll de página
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function isMouseOverUI() {
  const b = document.getElementById('ui').getBoundingClientRect();
  return mouseX>=b.left && mouseX<=b.right && mouseY>=b.top && mouseY<=b.bottom;
}

// Export to SVG
function exportarSVG() {
  const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  const w = width, h = height;
  // 1) Transformo cada punto con tu pan/zoom
  const pts = points.map(p => {
    const x = (p.x - w/2) * zoom + w/2 + offsetX;
    const y = (p.y - h/2) * zoom + h/2 + offsetY;
    return `${x},${y}`;
  }).join(' ');
  const strokeW = (1/zoom).toFixed(3);
  const r = mostrarNodos ? (2/zoom).toFixed(3) : 0;

  // 2) Construyo el SVG
  let svg = ''
    + `<?xml version="1.0" encoding="UTF-8"?>`
    + `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
    + `<polyline fill="none" stroke="black" stroke-width="${strokeW}" points="${pts}" />`;

  // 3) Si se muestran nodos, agrego círculos
  if (mostrarNodos) {
    points.forEach(p => {
      const cx = ((p.x - w/2) * zoom + w/2 + offsetX).toFixed(3);
      const cy = ((p.y - h/2) * zoom + h/2 + offsetY).toFixed(3);
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="black" />`;
    });
  }
  svg += `</svg>`;

  // 4) Descarga forzada
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

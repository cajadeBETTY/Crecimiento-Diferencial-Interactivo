let points = [];
let originalPoints = [];
let running = false;
let iniciado = false;
let maxPoints = 2000;

let zoom = 1.0;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let lastMouseX, lastMouseY;

// UI elements
let inputPuntos, sliderRadio, radioValorSpan;
let inputMinDist, inputMaxDist, inputMaxPoints, inputFrecuenciaHistorial;
let tipoRuidoSelect, sliderAmplitud, sliderFrecuencia;
let valorAmplitudSpan, valorFrecuenciaSpan;
let sliderRepulsion, valorRepulsionSpan;
let tipoVisualSelect;
let toggleHistorialBtn, toggleNodosBtn, clearHistorialBtn;

// File & generic shape
let fileInputSVG;
let formaGenericaSelect, inputLados;

// History
let mostrarHistorial = false;
let mostrarNodos = true;
let historialFormas = [];
let frameHistorial = 0;
let frecuenciaHistorial = 10;

// Noise & distances
let noiseOffset = 0;
let minDist, maxDist;

function setup() {
  createCanvas(windowWidth, windowHeight);
  noFill();

  // Numeric inputs
  inputMinDist = select('#inputMinDist');
  inputMaxDist = select('#inputMaxDist');
  inputMaxPoints = select('#inputMaxPoints');
  inputFrecuenciaHistorial = select('#inputFrecuenciaHistorial');
  inputPuntos = select('#inputPuntos');
  // React on number-of-points change
  inputPuntos.input(() => {
    originalPoints && originalPoints.length && generarCurvaBase();
    redraw();
  });
  inputFrecuenciaHistorial.input(() => frecuenciaHistorial = int(inputFrecuenciaHistorial.value()));

  // Radius slider
  sliderRadio = select('#sliderRadio');
  radioValorSpan = select('#radioValor');
  sliderRadio.input(() => {
    radioValorSpan.html(sliderRadio.value());
    generarCurvaBase();
    redraw();
  });
  // initialize display
  radioValorSpan.html(sliderRadio.value());

  // Noise controls
  tipoRuidoSelect = select('#tipoRuido');
  sliderAmplitud = select('#sliderAmplitud');
  sliderFrecuencia = select('#sliderFrecuencia');
  valorAmplitudSpan = select('#valorAmplitud');
  valorFrecuenciaSpan = select('#valorFrecuencia');
  sliderAmplitud.input(() => valorAmplitudSpan.html(sliderAmplitud.value()));
  sliderFrecuencia.input(() => valorFrecuenciaSpan.html(sliderFrecuencia.value()));

  // Repulsion
  sliderRepulsion = select('#sliderRepulsion');
  valorRepulsionSpan = select('#valorRepulsion');
  sliderRepulsion.input(() => valorRepulsionSpan.html(sliderRepulsion.value()));

  // Visualization type
  tipoVisualSelect = select('#tipoVisual');

  // History & nodes toggles
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
  clearHistorialBtn.mousePressed(() => {
    historialFormas = [];
    frameHistorial = 0;
  });

  // Play/Pause & Restart
  select('#playPauseBtn').mousePressed(togglePlayPause);
  select('#restartBtn').mousePressed(reiniciarCrecimiento);

  // Export
  select('#btnExportPNG').mousePressed(() => saveCanvas('crecimiento_diferencial', 'png'));
  select('#btnExportSVG').mousePressed(exportarSVG);

  // Generic shape & file input
  formaGenericaSelect = select('#formaGenericaSelect');
  inputLados = select('#inputLados');
  // Disable sides input by default unless polygon
  if (formaGenericaSelect.value() !== 'poligono') {
    inputLados.attribute('disabled', '');
  }
  // On shape type change
  formaGenericaSelect.changed(() => {
    let tipo = formaGenericaSelect.value();
    if (tipo === 'poligono') inputLados.removeAttribute('disabled');
    else inputLados.attribute('disabled', '');
    generarCurvaBase();
    redraw();
  });
  // On sides change
  inputLados.input(() => {
    generarCurvaBase();
    redraw();
  });

  fileInputSVG = createFileInput(handleFile);
  fileInputSVG.parent('ui');
  fileInputSVG.hide();
  select('#btnSubirSVG').mousePressed(() => fileInputSVG.elt.click());

  // Initial preview
  generarCurvaBase();
}

function handleFile(file) {
  if (file.type === 'image' && file.subtype === 'svg') {
    let parser = new DOMParser();
    let svgDoc = parser.parseFromString(file.data, 'image/svg+xml');
    let paths = svgDoc.querySelectorAll('path');
    points = [];
    for (let path of paths) {
      let len = path.getTotalLength();
      let n = int(inputPuntos.value());
      for (let i = 0; i < n; i++) {
        let pt = path.getPointAtLength((i / n) * len);
        points.push(createVector(pt.x, pt.y));
      }
    }
    originalPoints = points.map(p => p.copy());
    iniciado = false;
    running = false;
    redraw();
  } else {
    alert('Por favor sube un archivo SVG válido.');
  }
}

function generarCurvaBase() {
  points = [];
  let tipo = formaGenericaSelect.value();
  let cantidad = int(inputPuntos.value());
  let r = float(sliderRadio.value());
  let lados = (tipo === 'poligono') ? int(inputLados.value()) : cantidad;

  if (tipo === 'circulo' || tipo === 'poligono') {
    for (let i = 0; i < lados; i++) {
      let ang = TWO_PI * i / lados;
      points.push(createVector(width / 2 + r * cos(ang), height / 2 + r * sin(ang)));
    }
    originalPoints = points.map(p => p.copy());
    iniciado = false;
    running = false;
  }
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

function iniciarCrecimiento() {
  if (points.length === 0) return;
  // Recompute distances
  let circ = TWO_PI * float(sliderRadio.value());
  let distIni = circ / int(inputPuntos.value());
  let minIn = float(inputMinDist.value());
  let maxIn = float(inputMaxDist.value());
  minDist = (!isNaN(minIn) && minIn > 0) ? minIn : distIni * 1.2;
  maxDist = (!isNaN(maxIn) && maxIn > 0) ? maxIn : distIni * 1.2;
  iniciado = true;
  running = true;
}

function reiniciarCrecimiento() {
  running = false;
  iniciado = false;
  offsetX = offsetY = 0;
  zoom = 1.0;
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
  translate(width / 2 + offsetX, height / 2 + offsetY);
  scale(zoom);
  translate(-width / 2, -height / 2);

  if (mostrarHistorial && historialFormas.length > 0) {
    stroke(180);
    strokeWeight(1 / zoom);
    noFill();
    for (let forma of historialFormas) {
      beginShape();
      for (let p of forma) {
        if (tipoVisualSelect.value() === 'curva') curveVertex(p.x, p.y);
        else vertex(p.x, p.y);
      }
      endShape(CLOSE);
    }
  }

  if (points.length > 0) {
    stroke(0);
    strokeWeight(1 / zoom);
    noFill();
    beginShape();
    if (tipoVisualSelect.value() === 'curva') {
      let L = points.length;
      curveVertex(points[L - 1].x, points[L - 1].y);
      curveVertex(points[0].x, points[0].y);
      for (let p of points) curveVertex(p.x, p.y);
      curveVertex(points[0].x, points[0].y);
      curveVertex(points[1].x, points[1].y);
    } else {
      for (let p of points) vertex(p.x, p.y);
    }
    endShape(CLOSE);

    if (mostrarNodos) {
      fill(0);
      noStroke();
      for (let p of points) circle(p.x, p.y, 4 / zoom);
    }
  }
  pop();

  if (!iniciado || !running || points.length >= maxPoints) return;

  if (mostrarHistorial && frameHistorial % frecuenciaHistorial === 0) {
    historialFormas.push(points.map(p => p.copy()));
  }
  frameHistorial++;

  let nuevos = [];
  for (let i = 0; i < points.length; i++) {
    let act = points[i];
    let fuer = createVector(0, 0);
    let cerc = 0;
    for (let j = 0; j < points.length; j++) {
      if (i !== j) {
        let otr = points[j];
        let d = dist(act.x, act.y, otr.x, otr.y);
        if (d < minDist) {
          let dir = p5.Vector.sub(act, otr).normalize().mult(float(sliderRepulsion.value()) / d);
          fuer.add(dir);
          cerc++;
        }
      }
    }
    // Noise
    let amp = float(sliderAmplitud.value());
    let freq = float(sliderFrecuencia.value());
    let rnoise = createVector(0, 0);
    let tr = tipoRuidoSelect.value();
    if (tr === 'perlin') {
      let n = noise(act.x * freq, act.y * freq + noiseOffset);
      rnoise = p5.Vector.fromAngle(n * TWO_PI).mult(amp);
    } else if (tr === 'perlinImproved') {
      let nx = noise(act.x * freq, noiseOffset);
      let ny = noise(act.y * freq, noiseOffset + 1000);
      rnoise = createVector((nx - 0.5) * amp * 2, (ny - 0.5) * amp * 2);
    } else if (tr === 'valor') {
      rnoise = createVector(random(-1, 1) * amp, random(-1, 1) * amp);
    } else if (tr === 'simple') {
      rnoise = p5.Vector.random2D().mult(amp);
    }
    if (cerc > 0) {
      fuer.div(cerc).add(rnoise);
    } else {
      fuer = rnoise.copy();
    }
    act.add(fuer);
    nuevos.push(act);
    let nxt = points[(i + 1) % points.length];
    if (p5.Vector.dist(act, nxt) > maxDist) {
      nuevos.push(p5.Vector.add(act, nxt).div(2));
    }
  }
  points = nuevos;
  noiseOffset += 0.01;
}

function mouseWheel(e) { zoom *= 1 - e.delta * 0.001; return false; }
function mousePressed() { if (mouseButton === LEFT) { isDragging = true; lastMouseX = mouseX; lastMouseY = mouseY; } }
function mouseReleased() { isDragging = false; }
function mouseDragged() { if (isMouseOverUI()) return; if (isDragging) { offsetX += mouseX - lastMouseX; offsetY += mouseY - lastMouseY; lastMouseX = mouseX; lastMouseY = mouseY; } }
function windowResized() { resizeCanvas(windowWidth, windowHeight); }
function isMouseOverUI() { const b = document.getElementById('ui').getBoundingClientRect(); return mouseX >= b.left && mouseX <= b.right && mouseY >= b.top && mouseY <= b.bottom; }

function exportarSVG() {
  let ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  exportandoSVG = true;
  beginRecordSVG(this, `crecimiento_diferencial_${ts}.svg`);
  redraw();
  endRecordSVG();
  exportandoSVG = false;
}

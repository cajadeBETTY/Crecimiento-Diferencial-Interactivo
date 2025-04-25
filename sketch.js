let points = [];
let originalPoints = [];
let fileLoaded = false;
let svgText = '';

let running = false;
let iniciado = false;
let maxPoints = 2000;

let zoom = 1.0;
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

// Generic vs file shapes
let formaGenericaSelect, inputLados;

// File upload
let fileInputSVG;

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
  inputPuntos.input(() => {
    if (fileLoaded) generarCurvaFromSVG();
    else if (formaGenericaSelect.value() !== 'none') generarCurvaBase();
    redraw();
  });
  inputFrecuenciaHistorial.input(() => frecuenciaHistorial = int(inputFrecuenciaHistorial.value()));

  // Radius slider
  sliderRadio = select('#sliderRadio');
  radioValorSpan = select('#radioValor');
  sliderRadio.input(() => {
    radioValorSpan.html(sliderRadio.value());
    if (!fileLoaded && formaGenericaSelect.value() !== 'none') {
      generarCurvaBase();
      redraw();
    }
  });
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

  // Visualization
  tipoVisualSelect = select('#tipoVisual');

  // Toggles
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

  // Generic shape selector
  formaGenericaSelect = select('#formaGenericaSelect');
  inputLados = select('#inputLados');
  inputLados.attribute('disabled', '');
  formaGenericaSelect.changed(() => {
    if (fileLoaded) fileLoaded = false;
    const tipo = formaGenericaSelect.value();
    if (tipo === 'poligono') inputLados.removeAttribute('disabled');
    else inputLados.attribute('disabled', '');
    generarCurvaBase();
    redraw();
  });
  inputLados.input(() => {
    if (formaGenericaSelect.value() === 'poligono') {
      generarCurvaBase();
      redraw();
    }
  });

  // File input
  fileInputSVG = createFileInput(handleFile);
  fileInputSVG.parent('ui');
  fileInputSVG.hide();
  select('#btnSubirSVG').mousePressed(() => {
    suppressDrag = true;
    fileInputSVG.elt.click();
  });

  // Initial preview
  generarCurvaBase();
}

function handleFile(file) {
  const isSvg = (file.subtype && file.subtype.toLowerCase().includes('svg'))
              || (file.name && file.name.toLowerCase().endsWith('.svg'));
  if (file.type === 'image' && isSvg) {
    svgText = file.data;
    fileLoaded = true;
    generarCurvaFromSVG();
  } else {
    alert('Por favor sube un archivo SVG válido.');
  }
}

function generarCurvaFromSVG() {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
  const paths = svgDoc.querySelectorAll('path');
  points = [];
  const n = int(inputPuntos.value());
  // Sample points along SVG paths
  paths.forEach(path => {
    const len = path.getTotalLength();
    for (let i = 0; i < n; i++) {
      const pt = path.getPointAtLength((i / n) * len);
      points.push(createVector(pt.x, pt.y));
    }
  });
  if (points.length === 0) return;
  // Compute bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const bboxW = maxX - minX;
  const bboxH = maxY - minY;
  // Scale to radius
  const radius = float(sliderRadio.value());
  const desiredSize = radius * 2;
  const scale = desiredSize / max(bboxW, bboxH);
  // Center and scale
  for (let p of points) {
    p.x = (p.x - (minX + bboxW / 2)) * scale + width / 2;
    p.y = (p.y - (minY + bboxH / 2)) * scale + height / 2;
  }
  originalPoints = points.map(p => p.copy());
  iniciado = false;
  running = false;
  redraw();
}
  });
  originalPoints = points.map(p => p.copy());
  iniciado = false;
  running = false;
  redraw();
}

function generarCurvaBase() {
  points = [];
  const tipo = formaGenericaSelect.value();
  const cantidad = int(inputPuntos.value());
  const r = float(sliderRadio.value());
  const lados = tipo === 'poligono' ? int(inputLados.value()) : cantidad;
  if (tipo === 'circulo' || tipo === 'poligono') {
    for (let i = 0; i < lados; i++) {
      const ang = TWO_PI * i / lados;
      points.push(createVector(width / 2 + r * cos(ang), height / 2 + r * sin(ang)));
    }
    originalPoints = points.map(p => p.copy());
    iniciado = false;
    running = false;
  }
}

function iniciarCrecimiento() {
  if (points.length === 0) return;
  const cantidad = int(inputPuntos.value());
  const circ = TWO_PI * float(sliderRadio.value());
  const distIni = circ / max(cantidad, 1);
  const minIn = float(inputMinDist.value());
  const maxIn = float(inputMaxDist.value());
  minDist = (!isNaN(minIn) && minIn > 0) ? minIn : distIni * 1.2;
  maxDist = (!isNaN(maxIn) && maxIn > 0) ? maxIn : distIni * 1.2;
  iniciado = true;
  running = true;
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

  // Draw history
  if (mostrarHistorial && historialFormas.length) {
    stroke(180);
    strokeWeight(1 / zoom);
    noFill();
    for (let forma of historialFormas) {
      beginShape();
      for (let p of forma) (tipoVisualSelect.value() === 'curva') ? curveVertex(p.x,p.y) : vertex(p.x,p.y);
      (tipoVisualSelect.value() === 'curva') ? endShape() : endShape(CLOSE);
    }
  }

  // Draw current
  if (points.length) {
    stroke(0);
    strokeWeight(1 / zoom);
    noFill();
    beginShape();
    if (tipoVisualSelect.value() === 'curva') {
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

  // Growth
  if (!iniciado || !running || points.length >= maxPoints) return;

  if (mostrarHistorial && frameHistorial % frecuenciaHistorial === 0) {
    historialFormas.push(points.map(p=>p.copy()));
  }
  frameHistorial++;

  const nuevos = [];
  points.forEach((act,i) => {
    let fuerza = createVector(0,0), cerc=0;
    points.forEach((otr,j) => {
      if(i!==j){
        const d=dist(act.x,act.y,otr.x,otr.y);
        if(d<minDist){
          const dir=p5.Vector.sub(act,otr).normalize().mult(float(sliderRepulsion.value())/d);
          fuerza.add(dir); cerc++;
        }
      }
    });
    let rnoise=createVector(0,0);
    const amp=float(sliderAmplitud.value()), freq=float(sliderFrecuencia.value());
    const tr=tipoRuidoSelect.value();
    if(tr==='perlin'){ const n=noise(act.x*freq,act.y*freq+noiseOffset); rnoise=p5.Vector.fromAngle(n*TWO_PI).mult(amp);} 
    else if(tr==='perlinImproved'){ const nx=noise(act.x*freq,noiseOffset), ny=noise(act.y*freq,noiseOffset+1000); rnoise=createVector((nx-0.5)*amp*2,(ny-0.5)*amp*2);} 
    else if(tr==='valor') rnoise=createVector(random(-1,1)*amp,random(-1,1)*amp);
    else if(tr==='simple') rnoise=p5.Vector.random2D().mult(amp);
    if(cerc>0) fuerza.div(cerc).add(rnoise); else fuerza=rnoise.copy();
    act.add(fuerza);
    nuevos.push(act);
    const nxt=points[(i+1)%points.length]; if(p5.Vector.dist(act,nxt)>maxDist) nuevos.push(p5.Vector.add(act,nxt).div(2));
  });
  points=nuevos;
  noiseOffset+=0.01;
}

function mouseWheel(e){ return false; }
function mousePressed(){ if(mouseButton===LEFT){ isDragging=true; lastMouseX=mouseX; lastMouseY=mouseY; }}
function mouseReleased(){ isDragging=false; suppressDrag=false; }
function mouseDragged(){ if(isDragging && !suppressDrag && !isMouseOverUI()){ offsetX+=mouseX-lastMouseX; offsetY+=mouseY-lastMouseY; lastMouseX=mouseX; lastMouseY=mouseY; }}
function windowResized(){ resizeCanvas(windowWidth,windowHeight);}  
function isMouseOverUI(){ const b=document.getElementById('ui').getBoundingClientRect(); return mouseX>=b.left && mouseX<=b.right && mouseY>=b.top && mouseY<=b.bottom; }

function exportarSVG(){
  const ts=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  exportandoSVG=true;
  beginRecordSVG(this,`crecimiento_diferencial_${ts}.svg`);
  redraw();
  endRecordSVG();
  exportandoSVG=false;
}

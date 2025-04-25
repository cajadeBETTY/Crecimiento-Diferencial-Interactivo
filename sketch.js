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
  sliderFrecuencia = select('#sliderFrecuencia');
  valorAmplitudSpan = select('#valorAmplitud');
  valorFrecuenciaSpan = select('#valorFrecuencia');
  sliderAmplitud.input(() => valorAmplitudSpan.html(sliderAmplitud.value()));
  sliderFrecuencia.input(() => valorFrecuenciaSpan.html(sliderFrecuencia.value()));

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

  // Forma genérica y lados
  formaGenericaSelect = select('#formaGenericaSelect');
  inputLados = select('#inputLados');
  inputLados.attribute('disabled', '');
  formaGenericaSelect.changed(() => {
    // <<-- Aquí: descartar SVG cargado al seleccionar forma genérica
    fileLoaded = false;
    const tipo = formaGenericaSelect.value();
    if (tipo === 'poligono') {
      inputLados.removeAttribute('disabled');
    } else {
      inputLados.attribute('disabled', '');
    }
    previewShape();
  });
  inputLados.input(previewShape);

  // File input SVG
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
  if (!elems.length) { console.warn('No se encontró ningún <path>, <polyline> ni <polygon>.'); return; }

  const n = int(inputPuntos.value());
  let pts = [];
  elems.forEach(el => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'path') {
      const L = el.getTotalLength();
      for (let i = 0; i < n; i++) {
        const p = el.getPointAtLength((i / n) * L);
        pts.push(createVector(p.x, p.y));
      }
    } else {
      const list = el.points;
      const coords = [];
      for (let i = 0; i < list.numberOfItems; i++) {
        const pt = list.getItem(i);
        coords.push({ x: pt.x, y: pt.y });
      }
      for (let i = 0; i < n; i++) {
        const idx = floor((i / n) * coords.length);
        const c = coords[idx];
        pts.push(createVector(c.x, c.y));
      }
    }
  });

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  pts.forEach(p => {
    minX = min(minX, p.x); maxX = max(maxX, p.x);
    minY = min(minY, p.y); maxY = max(maxY, p.y);
  });
  const w = maxX - minX, h = maxY - minY;
  const r = float(sliderRadio.value());
  const s = (r * 2) / max(w, h);

  points = pts.map(p => createVector(
    (p.x - (minX + w / 2)) * s + width / 2,
    (p.y - (minY + h / 2)) * s + height / 2
  ));
  originalPoints = points.map(p => p.copy());
  iniciado = running = false;
}

function generarCurvaBase() {
  points = [];
  const tipo = formaGenericaSelect.value();
  const n = int(inputPuntos.value());
  const r = float(sliderRadio.value());
  const lados = tipo === 'poligono' ? int(inputLados.value()) : n;
  if (tipo !== 'none') {
    for (let i = 0; i < lados; i++) {
      const a = TWO_PI * i / lados;
      points.push(createVector(
        width/2 + r * cos(a),
        height/2 + r * sin(a)
      ));
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
  minDist = float(inputMinDist.value())>0?float(inputMinDist.value()):d*1.2;
  maxDist = float(inputMaxDist.value())>0?float(inputMaxDist.value()):d*1.2;
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
  running=false; iniciado=false;
  offsetX=offsetY=0; zoom=1; noiseOffset=0;
  historialFormas=[]; frameHistorial=0;
  points=originalPoints.map(p=>p.copy());
  select('#playPauseBtn').html('▶ Iniciar');
  redraw();
}

function draw() {
  background(255);
  push();
  translate(width/2+offsetX, height/2+offsetY);
  scale(zoom);
  translate(-width/2, -height/2);

  if (mostrarHistorial) {
    stroke(180); noFill();
    historialFormas.forEach(f => {
      beginShape();
      f.forEach(p => tipoVisualSelect.value()==='curva'?curveVertex(p.x,p.y):vertex(p.x,p.y));
      tipoVisualSelect.value()==='curva'?endShape():endShape(CLOSE);
    });
  }

  if (points.length) {
    stroke(0); noFill(); strokeWeight(1/zoom);
    beginShape();
    if (tipoVisualSelect.value()==='curva') {
      const L = points.length;
      curveVertex(points[L-2].x, points[L-2].y);
      curveVertex(points[L-1].x, points[L-1].y);
      points.forEach(p => curveVertex(p.x,p.y));
      curveVertex(points[0].x, points[0].y);
      curveVertex(points[1].x, points[1].y);
      endShape();
    } else {
      points.forEach(p => vertex(p.x,p.y));
      endShape(CLOSE);
    }
    if (mostrarNodos) {
      fill(0); noStroke();
      points.forEach(p => circle(p.x,p.y,4/zoom));
    }
  }

  pop();
  if (!iniciado || !running || points.length>=maxPoints) return;
  if (mostrarHistorial && frameHistorial%frecuenciaHistorial===0) historialFormas.push(points.map(p=>p.copy()));
  frameHistorial++;
  let nuevos=[];
  points.forEach((act,i)=>{
    let f=createVector(0,0), c=0;
    points.forEach((o,j)=>{ if(i!==j){ const d=dist(act.x,act.y,o.x,o.y); if(d<minDist){ f.add(p5.Vector.sub(act,o).normalize().mult(float(sliderRepulsion.value())/d)); c++;}}});
    let rn=createVector(0,0), amp=float(sliderAmplitud.value()), fr=float(sliderFreencia.value()), tt=tipoRuidoSelect.value();
    if(tt==='perlin'){const n2=noise(act.x*fr, act.y*fr+noiseOffset); rn=p5.Vector.fromAngle(n2*TWO_PI).mult(amp);} 
    else if(tt==='perlinImproved'){const nx=noise(act.x*fr,noiseOffset), ny=noise(act.y*fr,noiseOffset+1000); rn=createVector((nx-0.5)*amp*2,(ny-0.5)*amp*2);} 
    else if(tt==='valor') rn=createVector(random(-1,1)*amp, random(-1,1)*amp); 
    else if(tt==='simple') rn=p5.Vector.random2D().mult(amp);
    if(c>0) f.div(c).add(rn); else f=rn.copy(); act.add(f); nuevos.push(act);
    const np=points[(i+1)%points.length]; if(p5.Vector.dist(act,np)>maxDist) nuevos.push(p5.Vector.add(act,np).div(2));
  });
  points=nuevos;
  noiseOffset+=0.01;
}

// Pan with mouse drag
function mousePressed(){ if(mouseButton===LEFT){ isDragging=true; lastMouseX=mouseX; lastMouseY=mouseY; }}
function mouseReleased(){ isDragging=false; suppressDrag=false; }
function mouseDragged(){ if(isDragging&&!suppressDrag&&!isMouseOverUI()){ offsetX+=mouseX-lastMouseX; offsetY+=mouseY-lastMouseY; lastMouseX=mouseX; lastMouseY=mouseY; }}

// Zoom with mouse wheel
function mouseWheel(event){
  const factor=1.05;
  if(event.deltaY<0) zoom*=factor; else zoom/=factor;
  return false; // prevenir scroll página
}

function windowResized(){ resizeCanvas(windowWidth,windowHeight); }

function isMouseOverUI(){ const b=document.getElementById('ui').getBoundingClientRect(); return mouseX>=b.left&&mouseX<=b.right&&mouseY>=b.top&&mouseY<=b.bottom; }

// Export SVG corregido con p5.svg
function exportarSVG(){
  const ts=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  // Off-screen SVG papel via p5.svg
  let g=createGraphics(windowWidth, windowHeight, SVG);
  g.beginDraw();
  g.noFill();
  g.translate(width/2+offsetX, height/2+offsetY);
  g.scale(zoom);
  g.translate(-width/2, -height/2);
  g.stroke(0);
  g.strokeWeight(1/zoom);
  g.beginShape();
  if(tipoVisualSelect.value()==='curva'){
    const L=points.length;
    g.curveVertex(points[L-2].x, points[L-2].y);
    g.curveVertex(points[L-1].x, points[L-1].y);
    points.forEach(p=>g.curveVertex(p.x,p.y));
    g.curveVertex(points[0].x, points[0].y);
    g.curveVertex(points[1].x, points[1].y);
    g.endShape();
  } else {
    points.forEach(p=>g.vertex(p.x,p.y));
    g.endShape(CLOSE);
  }
  if(mostrarNodos){ g.fill(0); g.noStroke(); points.forEach(p=>g.circle(p.x,p.y,4/zoom)); }
  g.endDraw();
  save(g,`crecimiento_diferencial_${ts}.svg`);
}

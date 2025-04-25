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
  pixelDensity(1);
  noFill();

  // Inputs
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

  // Radius
  sliderRadio = select('#sliderRadio');
  radioValorSpan = select('#radioValor');
  sliderRadio.input(() => {
    radioValorSpan.html(sliderRadio.value());
    if (!fileLoaded && formaGenericaSelect.value() !== 'none') {
      generarCurvaBase(); redraw();
    }
  });
  radioValorSpan.html(sliderRadio.value());

  // Noise
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
  toggleHistorialBtn.mousePressed(() => { mostrarHistorial = !mostrarHistorial; toggleHistorialBtn.html(mostrarHistorial?'🕘 Ocultar historial':'🕘 Ver historial'); });
  toggleNodosBtn.mousePressed(() => { mostrarNodos = !mostrarNodos; toggleNodosBtn.html(mostrarNodos?'🔘 Ocultar nodos':'🔘 Mostrar nodos'); });
  clearHistorialBtn.mousePressed(() => { historialFormas = []; frameHistorial = 0; });

  // Play/Pause & Restart
  select('#playPauseBtn').mousePressed(togglePlayPause);
  select('#restartBtn').mousePressed(reiniciarCrecimiento);

  // Export
  select('#btnExportPNG').mousePressed(() => saveCanvas('crecimiento_diferencial','png'));
  select('#btnExportSVG').mousePressed(exportarSVG);

  // Generic selector
  formaGenericaSelect = select('#formaGenericaSelect');
  inputLados = select('#inputLados');
  inputLados.attribute('disabled','');
  formaGenericaSelect.changed(() => { fileLoaded=false; const tipo=formaGenericaSelect.value(); if(tipo==='poligono')inputLados.removeAttribute('disabled'); else inputLados.attribute('disabled',''); generarCurvaBase(); redraw(); });
  inputLados.input(() => { if(formaGenericaSelect.value()==='poligono'){ generarCurvaBase(); redraw(); }});

  // File input
  fileInputSVG = createFileInput(handleFile);
  fileInputSVG.parent('ui'); fileInputSVG.hide();
  select('#btnSubirSVG').mousePressed(()=>{ suppressDrag=true; fileInputSVG.elt.click(); });

// handleFile moved here to ensure definition before use
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
} });

  // Initial preview
  generarCurvaBase();
}

// Load SVG: supports <path>, <polygon>, <polyline>, <circle>
function generarCurvaFromSVG() {
  const parser=new DOMParser();
  const doc=parser.parseFromString(svgText,'image/svg+xml');
  let pts=[];
  const n=int(inputPuntos.value());
  // paths
  doc.querySelectorAll('path').forEach(path=>{
    const len=path.getTotalLength();
    for(let i=0;i<n;i++){ const p=path.getPointAtLength((i/n)*len); pts.push(createVector(p.x,p.y)); }
  });
  // polygons/polylines
  doc.querySelectorAll('polygon,polyline').forEach(el=>{
    const list=el.getAttribute('points').trim().split(/\s+/).map(pt=>pt.split(',').map(Number));
    list.forEach(([x,y])=>pts.push(createVector(x,y)));
  });
  // circles
  doc.querySelectorAll('circle').forEach(c=>{
    const cx=float(c.getAttribute('cx')), cy=float(c.getAttribute('cy')), r=float(c.getAttribute('r'));
    for(let i=0;i<n;i++){ const a=TWO_PI*i/n; pts.push(createVector(cx+r*cos(a), cy+r*sin(a))); }
  });
  if(!pts.length) return;
  // Bounding box
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  pts.forEach(p=>{ minX=min(minX,p.x); maxX=max(maxX,p.x); minY=min(minY,p.y); maxY=max(maxY,p.y); });
  const w=maxX-minX, h=maxY-minY;
  const r=float(sliderRadio.value()), d=r*2, s=d/max(w,h);
  points=pts.map(p=>createVector((p.x-(minX+w/2))*s+width/2, (p.y-(minY+h/2))*s+height/2));
  originalPoints=points.map(p=>p.copy()); iniciado=false; running=false; redraw();
}

function generarCurvaBase() {
  points=[];
  const tipo=formaGenericaSelect.value(), n=int(inputPuntos.value()), r=float(sliderRadio.value());
  const lados=(tipo==='poligono')?int(inputLados.value()):n;
  if(tipo==='circulo'||tipo==='poligono'){
    for(let i=0;i<lados;i++){ const a=TWO_PI*i/lados; points.push(createVector(width/2+r*cos(a),height/2+r*sin(a))); }
    originalPoints=points.map(p=>p.copy()); iniciado=false; running=false;
  }
}

function iniciarCrecimiento(){ if(!points.length) return; const n=int(inputPuntos.value()), circ=TWO_PI*float(sliderRadio.value()), di=circ/max(n,1);
  minDist=float(inputMinDist.value())>0?float(inputMinDist.value()):di*1.2;
  maxDist=float(inputMaxDist.value())>0?float(inputMaxDist.value()):di*1.2;
  iniciado=true; running=true;
}
function togglePlayPause(){ if(!iniciado){ iniciarCrecimiento(); select('#playPauseBtn').html('⏸ Pausar'); } else { running=!running; select('#playPauseBtn').html(running?'⏸ Pausar':'▶ Reanudar'); }}
function reiniciarCrecimiento(){ running=false; iniciado=false; offsetX=offsetY=0; zoom=1; noiseOffset=0; historialFormas=[]; frameHistorial=0; points=originalPoints.map(p=>p.copy()); select('#playPauseBtn').html('▶ Iniciar'); redraw(); }

function draw(){ background(255); push(); translate(width/2+offsetX,height/2+offsetY); scale(zoom); translate(-width/2,-height/2);
  if(mostrarHistorial&&historialFormas.length){ stroke(180); strokeWeight(1/zoom); noFill(); historialFormas.forEach(f=>{ beginShape(); f.forEach(p=>(tipoVisualSelect.value()==='curva')?curveVertex(p.x,p.y):vertex(p.x,p.y)); (tipoVisualSelect.value()==='curva')?endShape():endShape(CLOSE); }); }
  if(points.length){ stroke(0); strokeWeight(1/zoom); noFill(); beginShape(); if(tipoVisualSelect.value()==='curva'){ const L=points.length; curveVertex(points[L-2].x,points[L-2].y); curveVertex(points[L-1].x,points[L-1].y); points.forEach(p=>curveVertex(p.x,p.y)); curveVertex(points[0].x,points[0].y); curveVertex(points[1].x,points[1].y); endShape(); } else { points.forEach(p=>vertex(p.x,p.y)); endShape(CLOSE);} if(mostrarNodos){ fill(0); noStroke(); points.forEach(p=>circle(p.x,p.y,4/zoom)); }}
  pop(); if(!iniciado||!running||points.length>=maxPoints) return; if(mostrarHistorial&&frameHistorial%frecuenciaHistorial===0) historialFormas.push(points.map(p=>p.copy())); frameHistorial++; const nuevos=[]; points.forEach((act,i)=>{ let f=createVector(0,0),c=0; points.forEach((o,j)=>{ if(i!==j){ const d=dist(act.x,act.y,o.x,o.y); if(d<minDist){ f.add(p5.Vector.sub(act,o).normalize().mult(float(sliderRepulsion.value())/d)); c++; } }}); let rn=createVector(0,0), amp=float(sliderAmplitud.value()), fr=float(sliderFrecuencia.value()), tt=tipoRuidoSelect.value(); if(tt==='perlin'){ const n=noise(act.x*fr,act.y*fr+noiseOffset); rn=p5.Vector.fromAngle(n*TWO_PI).mult(amp);} else if(tt==='perlinImproved'){ const nx=noise(act.x*fr,noiseOffset), ny=noise(act.y*fr,noiseOffset+1000); rn=createVector((nx-0.5)*amp*2,(ny-0.5)*amp*2);} else if(tt==='valor') rn=createVector(random(-1,1)*amp,random(-1,1)*amp); else if(tt==='simple') rn=p5.Vector.random2D().mult(amp); if(c>0) f.div(c).add(rn); else f=rn.copy(); act.add(f); nuevos.push(act); const nxt=points[(i+1)%points.length]; if(p5.Vector.dist(act,nxt)>maxDist) nuevos.push(p5.Vector.add(act,nxt).div(2)); }); points=nuevos; noiseOffset+=0.01; }
function mouseWheel(){return false;} function mousePressed(){ if(mouseButton===LEFT){ isDragging=true; lastMouseX=mouseX; lastMouseY=mouseY; }} function mouseReleased(){ isDragging=false; suppressDrag=false;} function mouseDragged(){ if(isDragging&&!suppressDrag&&!isMouseOverUI()){ offsetX+=mouseX-lastMouseX; offsetY+=mouseY-lastMouseY; lastMouseX=mouseX; lastMouseY=mouseY; }} function windowResized(){ resizeCanvas(windowWidth,windowHeight);} function isMouseOverUI(){ const b=document.getElementById('ui').getBoundingClientRect(); return mouseX>=b.left&&mouseX<=b.right&&mouseY>=b.top&&mouseY<=b.bottom; }

function exportarSVG() {
  const ts=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  beginRecordSVG(this, `crecimiento_diferencial_${ts}.svg`);
  redraw();
  endRecordSVG(this);
}

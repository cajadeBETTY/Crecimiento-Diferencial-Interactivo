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

// load logo
let logoImg;

// UI elements
let inputPuntos, sliderRadio, radioValorSpan;
let inputMinDist, inputMaxDist, inputMaxPoints, inputFrecuenciaHistorial;
let tipoRuidoSelect, sliderAmplitud, sliderFrecuencia;
let valorAmplitudSpan, valorFrecuenciaSpan;
let sliderRepulsion, valorRepulsionSpan;
let tipoVisualSelect;
let toggleHistorialBtn, toggleNodosBtn, clearHistorialBtn;
let formaGenericaSelect;
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

//logo in the bottom
function preload() {
  // 2) carga tu logo (PNG con transparencia)
  logoImg = loadImage('assets/logo.png');
}

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
  inputFrecuenciaHistorial.changed(() => frecuenciaHistorial = int(inputFrecuenciaHistorial.value()));

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

  formaGenericaSelect = select('#formaGenericaSelect');
  formaGenericaSelect.changed(() => { fileLoaded = false; previewShape(); });

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
  if (file.type === 'image' && file.subtype.includes('svg')) {
    svgText = file.data;
    fileLoaded = true;
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

function generarCurvaBase() {
  points = [];
  const n = int(inputPuntos.value());
  const r = float(sliderRadio.value());
  for (let i=0; i<n; i++) {
    const a = TWO_PI * i/n;
    points.push(createVector(width/2 + r*cos(a), height/2 + r*sin(a)));
  }
  originalPoints = points.map(p=>p.copy());
  iniciado = running = false;
}

function fitPoints(pts) {
  let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
  pts.forEach(p=>{minX=min(minX,p.x);maxX=max(maxX,p.x);minY=min(minY,p.y);maxY=max(maxY,p.y);});
  const s = (2*float(sliderRadio.value()))/max(maxX-minX,maxY-minY);
  points = pts.map(p=>createVector((p.x-(minX+(maxX-minX)/2))*s + width/2, (p.y-(minY+(maxY-minY)/2))*s + height/2));
}

function iniciarCrecimiento() {
  if (!points.length) return;
  const n = int(inputPuntos.value());
  const c = TWO_PI*float(sliderRadio.value());
  const d = c/max(n,1);
  minDist = max(float(inputMinDist.value()), d*1.2);
  maxDist = max(float(inputMaxDist.value()), d*1.2);
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
  push();
    translate(width/2 + offsetX, height/2 + offsetY);
    scale(zoom);
    translate(-width/2, -height/2);

    // --- HISTORIAL ---
    if (mostrarHistorial) {
      stroke(180);
      noFill();
      strokeWeight(1/zoom);

historialFormas.forEach(f => {
  if (f.length > 1 && tipoVisualSelect.value() === 'curva') {
    // Catmull–Rom cerrado sin lazos extra:
    beginShape();
      const L = f.length;
      // 1) duplicar los dos últimos puntos al inicio
      curveVertex(f[L-2].x, f[L-2].y);
      curveVertex(f[L-1].x, f[L-1].y);
      // 2) todos los puntos de la forma
      f.forEach(p => curveVertex(p.x, p.y));
      // 3) duplicar los dos primeros al final
      curveVertex(f[0].x, f[0].y);
      curveVertex(f[1].x, f[1].y);
    endShape();  // ← sin CLOSE
  } else {
    // Modo poligonal o historial
    beginShape();
      f.forEach(p => vertex(p.x, p.y));
    endShape(CLOSE);
  }
});

    }

    // --- CURVA PRINCIPAL ---
    if (points.length > 1) {
      stroke(0);
      noFill();
      strokeWeight(1/zoom);

if (tipoVisualSelect.value() === 'curva') {
  const L = points.length;
  beginShape();
    // — dos últimos puntos como control inicial
    curveVertex(points[(L-2+L)%L].x, points[(L-2+L)%L].y);
    curveVertex(points[(L-1)  ].x, points[(L-1)  ].y);
    // — todos los puntos “reales”
    points.forEach(p => curveVertex(p.x, p.y));
    // — duplicar primeros dos para cerrar suavemente
    curveVertex(points[0].x, points[0].y);
    curveVertex(points[1].x, points[1].y);
  endShape();    // ← sin CLOSE
} else {
        // Poligonal
        beginShape();
          points.forEach(p => vertex(p.x, p.y));
        endShape(CLOSE);
      }

      if (mostrarNodos) {
        fill(0);
        noStroke();
        points.forEach(p => circle(p.x, p.y, 4/zoom));
      }
    }
  pop();

  // --- CRECIMIENTO Y GRABACIÓN ---
  if (iniciado && running && points.length < maxPoints) {
    if (frameHistorial % frecuenciaHistorial === 0) {
      historialFormas.push(points.map(p => p.copy()));
    }
    frameHistorial++;

    // Lógica de crecimiento
    let nuevos=[];
    points.forEach((act,i)=>{
      let f=createVector(0,0),c=0;
      points.forEach((o,j)=>{
        if(i!==j){const d=dist(act.x,act.y,o.x,o.y);
          if(d<minDist){f.add(p5.Vector.sub(act,o).normalize().mult(float(sliderRepulsion.value())/d));c++;}}
      });
      const tt=tipoRuidoSelect.value(); let rn=createVector(0,0);
      const amp=float(sliderAmplitud.value()), fr=float(sliderFrecuencia.value());
      if(tt==='perlin'){const n2=noise(act.x*fr,act.y*fr+noiseOffset);rn=p5.Vector.fromAngle(n2*TWO_PI).mult(amp);}
      else if(tt==='perlinImproved'){const nx=noise(act.x*fr,noiseOffset),ny=noise(act.y*fr,noiseOffset+1000);
        rn=createVector((nx-0.5)*amp*2,(ny-0.5)*amp*2);} 
      else if(tt==='valor'){rn=createVector(random(-1,1)*amp,random(-1,1)*amp);} 
      else if(tt==='simple'){rn=p5.Vector.random2D().mult(amp);} 

      if(c>0){f.div(c).add(rn);} else f=rn;
      act.add(f); nuevos.push(act);
      const np=points[(i+1)%points.length];
      if(p5.Vector.dist(act,np)>maxDist) nuevos.push(p5.Vector.add(act,np).div(2));
    });
    points=nuevos; noiseOffset+=0.01;
  }
  // 3) dibuja el logo “en pantalla fija”
  imageMode(CORNER);
  // 1) el ancho máximo que quieras para tu logo
  const maxLogoWidth = 80;
  const margin = 10;          // margen al borde
  // 2) la proporción original del logo
  const aspect = logoImg.width / logoImg.height;
  // 3) calcula el alto para mantener ratio
  const w = maxLogoWidth;
  const h = maxLogoWidth / aspect;
  // 4) dibuja con esas dimensiones
  image(
    logoImg,
    width  - w - margin,
    height - h - margin,
    w, h
  );
}

// Pan with mouse drag
function mousePressed(){if(mouseButton===LEFT){isDragging=true;lastMouseX=mouseX;lastMouseY=mouseY;}}
function mouseReleased(){isDragging=false;suppressDrag=false;}
function mouseDragged(){if(isDragging&&!suppressDrag&&!isMouseOverUI()){offsetX+=mouseX-lastMouseX;offsetY+=mouseY-lastMouseY;lastMouseX=mouseX;lastMouseY=mouseY;}}
function mouseWheel(event){zoom*= (event.deltaY<0?1.05:1/1.05); return false;}
function windowResized(){resizeCanvas(windowWidth,windowHeight);}  
function isMouseOverUI(){const b=document.getElementById('ui').getBoundingClientRect();return mouseX>=b.left&&mouseX<=b.right&&mouseY>=b.top&&mouseY<=b.bottom;}

function exportarSVG(){
  const ts=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  const w=width, h=height;
  let svg='<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg"';
  svg+=` width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;

  // Historial export
  if (mostrarHistorial) historialFormas.forEach(f=>{
    if (f.length>1 && tipoVisualSelect.value()==='curva') {
      let L=f.length, d='';
      for (let i=0; i<L; i++) {
        const p0=f[(i-1+L)%L], p1=f[i], p2=f[(i+1)%L], p3=f[(i+2)%L];
        const cp1x=p1.x+(p2.x-p0.x)/6, cp1y=p1.y+(p2.y-p0.y)/6;
        const cp2x=p2.x-(p3.x-p1.x)/6, cp2y=p2.y-(p3.y-p1.y)/6;
        if (i===0) d+=`M${transformX(p1.x)},${transformY(p1.y)} C${transformX(cp1x)},${transformY(cp1y)} `+
                  `${transformX(cp2x)},${transformY(cp2y)} ${transformX(p2.x)},${transformY(p2.y)}`;
        else d+=` C${transformX(cp1x)},${transformY(cp1y)} ${transformX(cp2x)},${transformY(cp2y)} ${transformX(p2.x)},${transformY(p2.y)}`;
      }
      d+=' Z'; svg+=`<path d="${d}" fill="none" stroke="rgb(180,180,180)" stroke-width="${(1/zoom).toFixed(3)}"/>`;
    } else {
      const pts=f.map(p=>`${transformX(p.x)},${transformY(p.y)}`).join(' ');
      svg+=`<polyline fill="none" stroke="rgb(180,180,180)" stroke-width="${(1/zoom).toFixed(3)}" points="${pts}"/>`;
    }
  });

  // Principal export
  if (points.length>1 && tipoVisualSelect.value()==='curva') {
    let L=points.length, d='';
    for (let i=0; i<L; i++) {
      const p0=points[(i-1+L)%L], p1=points[i], p2=points[(i+1)%L], p3=points[(i+2)%L];
      const cp1x=p1.x+(p2.x-p0.x)/6, cp1y=p1.y+(p2.y-p0.y)/6;
      const cp2x=p2.x-(p3.x-p1.x)/6, cp2y=p2.y-(p3.y-p1.y)/6;
      if (i===0) d+=`M${transformX(p1.x)},${transformY(p1.y)} C${transformX(cp1x)},${transformY(cp1y)} `+
                `${transformX(cp2x)},${transformY(cp2y)} ${transformX(p2.x)},${transformY(p2.y)}`;
      else d+=` C${transformX(cp1x)},${transformY(cp1y)} ${transformX(cp2x)},${transformY(cp2y)} ${transformX(p2.x)},${transformY(p2.y)}`;
    }
    d+=' Z'; svg+=`<path d="${d}" fill="none" stroke="black" stroke-width="${(1/zoom).toFixed(3)}"/>`;
  } else {
    const pts=points.map(p=>`${transformX(p.x)},${transformY(p.y)}`).join(' ');
    svg+=`<polyline fill="none" stroke="black" stroke-width="${(1/zoom).toFixed(3)}" points="${pts}"/>`;
  }

  // Nodo export
  if (mostrarNodos) {
    const r=(2/zoom).toFixed(3);
    points.forEach(p=>{
      svg+=`<circle cx="${transformX(p.x)}" cy="${transformY(p.y)}" r="${r}" fill="black"/>`;
    });
  }

  svg+='</svg>';
  const blob=new Blob([svg],{type:'image/svg+xml'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`crecimiento_diferencial_${ts}.svg`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helpers for export coordinates
function transformX(x){return ((x - width/2)*zoom + width/2 + offsetX).toFixed(3);}
function transformY(y){return ((y - height/2)*zoom + height/2 + offsetY).toFixed(3);}



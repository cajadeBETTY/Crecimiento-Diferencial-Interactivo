// Sketch.js - Crecimiento Diferencial

// Helper: convierte coordenadas de pantalla a coordenadas locales para operaciones de drag
function toLocalCoords(mx, my) {
  return {
    x: (mx - (width/2 + offsetX)) / zoom + width/2,
    y: (my - (height/2 + offsetY)) / zoom + height/2
  };
}

// — Variables globales —
// Contorno
let contourPoints = [];
let contourLoaded = false;
let sliderContourRadius, contourRadiusValor;
let sliderScaleContour, contourScaleValor;
let scaleContainer;
let showLimitantes = true;
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

// <<--- NUEVO: Variables para los toggles manuales
let manualCurvaBase = false;
let manualCurvaContorno = false;
let manualObstaculos = false;

// ■ UI layout
const uiMargin      = 10;
const uiSpacing     = 20;
const uiBoxSize     = 12;
const uiTextOffset  = 5;

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
const selectThreshold = 10;
let draggingIndexBase = -1;
let draggingIndexContour = -1;
let draggingObstacleIndex = -1;

function preload() {
  logoImg = loadImage('assets/logo.png');
  fuenteMonoLight = loadFont('assets/SourceCodePro-Light.ttf');
}

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
  let svg = '<?xml version="1.0" encoding="UTF-8"?>';
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
  if (contourLoaded) {
    const pts = contourPoints.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
    svg += `<polyline fill="none" stroke="gray" stroke-width="2" points="${pts}"/>`;
  }
  if (showObstacles) {
    obstacleCircles.forEach(o => {
      svg += `<circle cx="${o.x.toFixed(3)}" cy="${o.y.toFixed(3)}" r="${o.r.toFixed(3)}" fill="none" stroke="red" stroke-width="2"/>`;
    });
    obstacleSVGPoints.forEach(shape => {
      const pts = shape.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
      svg += `<polyline fill="none" stroke="red" stroke-width="2" points="${pts}"/>`;
    });
  }
  if (mostrarHistorial) {
    historialFormas.forEach(f => {
      const pts = f.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
      svg += `<polyline fill="none" stroke="lightgray" stroke-width="1" points="${pts}"/>`;
    });
  }
  if (points.length > 1) {
    const pts = points.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
    svg += `<polyline fill="none" stroke="black" stroke-width="2" points="${pts}"/>`;
  }
  if (mostrarNodos) {
    points.forEach(p => {
      svg += `<circle cx="${p.x.toFixed(3)}" cy="${p.y.toFixed(3)}" r="2" fill="black"/>`;
    });
  }
  const margin = 30;
  const aspect = logoImg.width / logoImg.height;
  const lw = Math.min(750, w - 2 * margin);
  const lh = lw / aspect;
  const lx = margin;
  const ly = h - lh - margin;
  const logoDataURL = logoImg.canvas.toDataURL();
  svg += `<image x="${lx}" y="${ly}" width="${lw}" height="${lh}" href="${logoDataURL}"/>`;
  svg += '</svg>';
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
    // <<--- NUEVO: Usar toggles manuales como prioridad sobre los flags de overlay
    if (manualCurvaBase) {
      selectBaseCurve(mouseX, mouseY);
    } else if (manualCurvaContorno) {
      selectContourCurve(mouseX, mouseY);
    } else if (manualObstaculos) {
      selectObstacle(mouseX, mouseY);
    } else if (activeBase) {
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
    lastMouseY = mouseY; // <-- CORREGIDO: antes decía "my"
  }
}

function mouseReleased() {
  // Reset de estados de drag y supresión
  isDragging = false;
  draggingBase = draggingContour = draggingObstacle = false;
  suppressDrag = false;
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
  createCanvas(windowWidth - uiWidth, windowHeight).position(uiWidth, 0);
  pixelDensity(2);

  // — Base de Crecimiento —
  sliderBaseRadius   = select('#sliderBaseRadius');
  baseRadiusValor    = select('#baseRadiusValor');
  if (sliderBaseRadius && baseRadiusValor) {
    sliderBaseRadius.input(() => {
      baseRadiusValor.html(sliderBaseRadius.value());
      previewShape();
    });
  }
  select('#btnCircleBase').mousePressed(() => {
    fileLoaded = false;
    previewShape();
  });
  // input exclusivo para curva base
  fileInputBase = createFileInput(handleFile).parent('ui').hide();
  select('#btnSubirSVGBase').mousePressed(() => {
    suppressDrag = true;
    fileInputBase.elt.click();
  });

  // — Contorno —
  sliderContourRadius  = select('#sliderContourRadius');
  contourRadiusValor   = select('#contourRadiusValor');
  sliderScaleContour   = select('#sliderScaleContour');
  contourScaleValor    = select('#contourScaleValor');
  // Inicializar contenedor de escala de contorno
  scaleContainer = select('#scaleContourContainer');

  // Cuando ajustas radio (sólo para círculo genérico)
  if (sliderContourRadius && contourRadiusValor) {
    sliderContourRadius.input(() => {
      contourRadiusValor.html(sliderContourRadius.value());
      generateContourCircle();
    });
  }
  // Botón círculo genérico
  select('#btnCircleContour').mousePressed(() => {
    contourLoaded = false;
    scaleContainer.hide();          // oculta el slider de escalar
    sliderContourRadius.show();     // muestra radio
    generateContourCircle();
  });

  // — Contorno / Limitantes —
  // Referencias a controles
  scaleContainer      = select('#scaleContourContainer');
  sliderContourRadius     = select('#sliderContourRadius');
  contourRadiusValor      = select('#contourRadiusValor');
  sliderScaleContour      = select('#sliderScaleContour');
  contourScaleValor       = select('#contourScaleValor');

  // Slider Radio (10–200 mm)
  if (sliderContourRadius && contourRadiusValor) {
    sliderContourRadius
      .attribute('min', 10)
      .attribute('max', 200)
      .input(() => {
        contourRadiusValor.html(sliderContourRadius.value());
        generateContourCircle();
      });
  }

  // Botón “Círculo Genérico”
  select('#btnCircleContour').mousePressed(() => {
    contourLoaded = false;
    scaleContainer.hide();          // oculta “Escalar”
    sliderContourRadius.show();     // muestra “Radio”
    contourScaleValor.html('1.00');
    generateContourCircle();
  });

  // Input exclusivo para Contorno SVG
  const fileInputContour = createFileInput(file => {
    handleContourFile(file);
    scaleContainer.show();          // muestra “Escalar”
    sliderContourRadius.hide();     // oculta “Radio”
    contourScaleValor.html(nf(sliderScaleContour.value(), 1, 2));
  })
    .parent('ui')
    .hide();

  // Botón “Subir Contorno (SVG)”
  select('#btnSubirSVGContour').mousePressed(() => {
    suppressDrag = true;
    fileInputContour.elt.click();
  });

  // Slider Escalar (0.1–5.0)
  if (sliderScaleContour && contourScaleValor) {
    sliderScaleContour
      .attribute('min', 0.1)
      .attribute('max', 5.0)
      .attribute('step', 0.01)
      .input(() => {
        const s = parseFloat(sliderScaleContour.value());
        contourScaleValor.html(nf(s, 1, 2));
        // reescala todos los puntos respecto al centro
        contourPoints = contourPoints.map(p =>
          createVector(
            width/2 + (p.x - width/2) * s,
            height/2 + (p.y - height/2) * s
          )
        );
      });
  }

  // Checkbox “Mostrar Limitantes”
  const toggleLimit = select('#toggleLimitantes');
  if (toggleLimit) {
    toggleLimit.changed(() => {
      showLimitantes = toggleLimit.checked();
    });
  }

  // — Obstáculos —
  inputNumObstacles      = select('#inputNumObstacles');
  sliderRadiusObstacle  = select('#sliderRadiusObstacle');
  obstacleRadiusValor   = select('#obstacleRadiusValor');
  sliderObstacleSeed    = select('#sliderObstacleSeed');
  obstacleSeedValor     = select('#obstacleSeedValor');
  sliderScaleObstacles  = select('#sliderScaleObstacles');
  obstacleScaleValor    = select('#obstacleScaleValor');

  if (inputNumObstacles) {
    inputNumObstacles.input(() => {
      numObstacles = int(inputNumObstacles.value());
      generateObstacleCircles();
    });
  }
  if (sliderRadiusObstacle && obstacleRadiusValor) {
    sliderRadiusObstacle.input(() => {
      obstacleRadiusValor.html(sliderRadiusObstacle.value());
      generateObstacleCircles();
    });
  }
  if (sliderObstacleSeed && obstacleSeedValor) {
    sliderObstacleSeed.input(() => {
      obstacleSeedValor.html(sliderObstacleSeed.value());
      generateObstacleCircles();
    });
  }
  if (sliderScaleObstacles && obstacleScaleValor) {
    sliderScaleObstacles.input(() => {
      obstacleScaleValor.html(sliderScaleObstacles.value());
      obstacleScale = float(sliderScaleObstacles.value());
      generateObstacleCircles();
    });
  }
  select('#toggleObstacles').changed(() => {
    showObstacles = select('#toggleObstacles').checked();
  });
  select('#btnCircleObstacle').mousePressed(() => {
    obstacleSVGPoints = [];
    generateObstacleCircles();
  });
  // input exclusivo para obstáculos SVG
  const fileInputObstacles = createFileInput(handleObstaclesFile).parent('ui').hide();
  select('#btnSubirSVGObstacles').mousePressed(() => {
    suppressDrag = true;
    fileInputObstacles.elt.click();
  });

  // — Nodos y Crecimiento —
  inputPuntos      = select('#inputPuntos');
  inputMinDist     = select('#inputMinDist');
  inputMaxDist     = select('#inputMaxDist');
  inputMaxPoints   = select('#inputMaxPoints');
  if (inputPuntos) inputPuntos.input(previewShape);
  if (inputMaxPoints) inputMaxPoints.input(() => maxPoints = int(inputMaxPoints.value()));
  select('#playPauseBtn').mousePressed(togglePlayPause);
  select('#restartBtn').mousePressed(reiniciarCrecimiento);

  // — Visualización —
  tipoVisualSelect    = select('#tipoVisual');
  toggleNodosBtn      = select('#toggleNodosBtn').mousePressed(() => {
    mostrarNodos = !mostrarNodos;
    toggleNodosBtn.html(mostrarNodos ? '🔘 Ocultar nodos' : '🔘 Mostrar nodos');
  });
  toggleHistorialBtn = select('#toggleHistorialBtn').mousePressed(() => {
    mostrarHistorial = !mostrarHistorial;
    toggleHistorialBtn.html(mostrarHistorial ? '🕘 Ocultar historial' : '🕘 Ver historial');
  });
  clearHistorialBtn  = select('#clearHistorialBtn').mousePressed(() => {
    historialFormas = [];
    frameHistorial = 0;
  });
  select('#inputFrecuenciaHistorial').changed(() => {
    frecuenciaHistorial = int(select('#inputFrecuenciaHistorial').value());
  });

  // — Experimental —
  tipoRuidoSelect  = select('#tipoRuido');
  sliderAmplitud    = select('#sliderAmplitud');
  valorAmplitudSpan = select('#valorAmplitud');
  sliderFrecuencia  = select('#sliderFrecuencia');
  valorFrecuenciaSpan = select('#valorFrecuencia');
  sliderRepulsion   = select('#sliderRepulsion');
  valorRepulsionSpan = select('#valorRepulsion');

  if (sliderAmplitud && valorAmplitudSpan) {
    sliderAmplitud.input(() => valorAmplitudSpan.html(sliderAmplitud.value()));
  }
  if (sliderFrecuencia && valorFrecuenciaSpan) {
    sliderFrecuencia.input(() => valorFrecuenciaSpan.html(sliderFrecuencia.value()));
  }
  if (sliderRepulsion && valorRepulsionSpan) {
    sliderRepulsion.input(() => valorRepulsionSpan.html(sliderRepulsion.value()));
  }

  // — Export —
  select('#btnExportPNG').mousePressed(() => saveCanvas('crecimiento_diferencial', 'png'));
  select('#btnExportSVG').mousePressed(exportarSVG);

  // --- MODIFICACIONES APLICADAS AQUÍ ---
  // <<--- NUEVO: ENLACE Y LECTURA INICIAL DE LOS TOGGLES MANUALES
  const chkCurvaBase = select('#chkCurvaBase');
  const chkCurvaContorno = select('#chkCurvaContorno');
  const chkObstaculos = select('#chkObstaculos');

  // Lee el estado inicial de los checkboxes desde el HTML
  manualCurvaBase = chkCurvaBase && chkCurvaBase.checked();
  manualCurvaContorno = chkCurvaContorno && chkCurvaContorno.checked();
  manualObstaculos = chkObstaculos && chkObstaculos.checked();

  // Actualiza el texto de los toggles de acuerdo a su estado inicial, si es necesario.
  select('#txtCurvaBase').html('CURVA BASE');
  select('#txtCurvaContorno').html('CURVA CONTORNO');
  select('#txtObstaculos').html('OBSTÁCULOS');

  if (chkCurvaBase) chkCurvaBase.changed(() => {
    manualCurvaBase = chkCurvaBase.checked();
  });
  if (chkCurvaContorno) chkCurvaContorno.changed(() => {
    manualCurvaContorno = chkCurvaContorno.checked();
  });
  if (chkObstaculos) chkObstaculos.changed(() => {
    manualObstaculos = chkObstaculos.checked();
  });
  // --- FIN DE MODIFICACIONES ---

  // — Inicializar base y dibujar una vez —
  generarCurvaBase(); // Esto puede ser sobrescrito si el HTML tiene una base SVG preseleccionada
  previewShape(); // Llama a previewShape() para asegurar que la base inicial se dibuje correctamente
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

function draw() {
  background(255);

  // 1-2) Dibujar LIMITANTES (contorno + obstáculos)
  push();
    translate(width/2 + offsetX, height/2 + offsetY);
    scale(zoom);
    translate(-width/2, -height/2);

    if (showLimitantes) {
      // Contorno
      if (contourLoaded) {
        stroke(180);
        noFill();
        strokeWeight(1);
        beginShape();
          contourPoints.forEach(p => vertex(p.x, p.y));
        endShape(CLOSE);
      }

      // Obstáculos
      obstacleCircles.forEach(o => {
        stroke(255, 0, 0);
        noFill();
        strokeWeight(1);
        circle(o.x, o.y, o.r * 2);
      });
      obstacleSVGPoints.forEach(shape => {
        stroke(255, 0, 0);
        noFill();
        strokeWeight(1);
        beginShape();
          shape.forEach(p => vertex(p.x, p.y));
        endShape(CLOSE);
      });
    }

    // 3) Dibujar historial si está activado
    if (mostrarHistorial) {
      stroke(180);
      noFill();
      strokeWeight(1/zoom);
      historialFormas.forEach(f => {
        beginShape();
          const Lh = f.length;
          // curva suavizada de historial
          curveVertex(f[(Lh - 2 + Lh) % Lh].x, f[(Lh - 2 + Lh) % Lh].y);
          curveVertex(f[Lh - 1].x, f[Lh - 1].y);
          f.forEach(p => curveVertex(p.x, p.y));
          curveVertex(f[0].x, f[0].y);
          curveVertex(f[1].x, f[1].y);
        endShape();
      });
    }

    // 4) Dibujar curva principal siempre
    if (points.length > 1) {
      stroke(0);
      noFill();
      strokeWeight(1/zoom);

      if (!iniciado) {
        // preview inicial
        beginShape();
          points.forEach(p => vertex(p.x, p.y));
        endShape(CLOSE);

      } else if (tipoVisualSelect.value() === 'curva') {
        const L = points.length;
        beginShape();
          curveVertex(points[(L - 2 + L) % L].x, points[(L - 2 + L) % L].y);
          points.forEach(p => curveVertex(p.x, p.y));
          curveVertex(points[0].x, points[0].y);
        endShape();

      } else {
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

  // 5) Lógica de crecimiento
  if (iniciado && running && points.length < maxPoints) {
    if (frameHistorial % frecuenciaHistorial === 0) {
      historialFormas.push(points.map(p => p.copy()));
    }
    frameHistorial++;

    let nuevos = [];
    points.forEach((act, i) => {
      let f = createVector(0, 0), c = 0;

      // repulsión entre puntos
      points.forEach((o, j) => {
        if (i !== j) {
          const d = dist(act.x, act.y, o.x, o.y);
          if (d < minDist) {
            f.add(p5.Vector.sub(act, o).normalize().mult(float(sliderRepulsion.value()) / d));
            c++;
          }
        }
      });

      // ruido
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

      // contorno
      const nextPos = p5.Vector.add(act, f);
      if (contourLoaded && !pointInPolygon(nextPos, contourPoints)) {
        const centroid = contourPoints
          .slice(0, -1)
          .reduce((ac, v) => ac.add(v), createVector(0, 0))
          .div(contourPoints.length - 1);
        f = p5.Vector.sub(centroid, act).normalize().mult(f.mag());
      }

      // obstáculos
      if (activeObstacles || manualObstaculos) { // <<--- PERMITE ACCIÓN CON TOGGLE MANUAL
        obstacleCircles.forEach(o => {
          const centro = createVector(o.x, o.y);
          const dObs = p5.Vector.dist(nextPos, centro);
          if (dObs < o.r) {
            const away = p5.Vector.sub(act, centro).normalize();
            const strength = (o.r - dObs) * 0.5;
            f.add(away.mult(strength));
          }
        });
        obstacleSVGPoints.forEach(shape => {
          if (pointInPolygon(nextPos, shape)) {
            const centroidSVG = shape
              .slice(0, -1)
              .reduce((ac, v) => ac.add(v.copy()), createVector(0, 0))
              .div(shape.length - 1);
            const away = p5.Vector.sub(act, centroidSVG).normalize();
            f.add(away.mult(5));
          }
        });
      }

      // movimiento y subdivisión
      act.add(f);
      nuevos.push(act);
      const np = points[(i + 1) % points.length];
      if (p5.Vector.dist(act, np) > maxDist) {
        nuevos.push(p5.Vector.add(act, np).div(2));
      }
    });

    points = nuevos;
    noiseOffset = (noiseOffset + 0.01) % 1000;
  }

  // 6) Texto de info en borde inferior (sólo si existe `lines`)
  if (typeof lines !== 'undefined' && Array.isArray(lines)) {
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
  }

  // 7) Overlay UI y logo
  drawOverlayUI();
}

// Función de dibujo del menú overlay y logo
function drawOverlayUI() {
  push(); noFill(); stroke(0); strokeWeight(1); textAlign(LEFT, TOP); textSize(14);
  const startX = width - uiMargin;
  const startY = uiMargin;
  const items = [
    { label: 'Curva Base',        flag: () => activeBase },
    { label: 'Curva Contorno', flag: () => activeContour },
    { label: 'Obstáculos',        flag: () => activeObstacles }
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

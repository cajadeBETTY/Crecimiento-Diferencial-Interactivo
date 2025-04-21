let points = [];
let running = false;
let maxPoints = 1000;
let inputPuntos, sliderRadio, radioValorSpan;
let playPauseBtn, restartBtn;
let radio = 96;
let minDist, maxDist;
let iniciado = false;

let zoom = 1.0;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let lastMouseX, lastMouseY;

let tipoRuidoSelect;
let sliderAmplitud, sliderFrecuencia;
let valorAmplitudSpan, valorFrecuenciaSpan;
let noiseOffset = 0;

let sliderRepulsion, valorRepulsionSpan;
let tipoVisualSelect;

let toggleHistorialBtn, toggleNodosBtn, clearHistorialBtn;
let mostrarHistorial = false;
let mostrarNodos = true;
let historialFormas = [];

let frameHistorial = 0;
let frecuenciaHistorial = 10;  // cada 2 frames

let inputFrecuenciaHistorial;
let inputMinDist, inputMaxDist;

let inputMaxPoints;
let btnExportPNG, btnExportSVG;
let exportandoSVG = false;


function setup() {
  createCanvas(windowWidth, windowHeight);

  // === INPUTS numéricos ===
  inputMinDist = select('#inputMinDist');
  inputMaxDist = select('#inputMaxDist');
  inputMaxPoints = select('#inputMaxPoints');
  inputFrecuenciaHistorial = select('#inputFrecuenciaHistorial');
  inputPuntos = select('#inputPuntos');

  inputFrecuenciaHistorial.input(() => {
    frecuenciaHistorial = int(inputFrecuenciaHistorial.value());
  });

  // === RADIO ===
  sliderRadio = select('#sliderRadio');
  radioValorSpan = select('#radioValor');
  sliderRadio.input(() => {
    radioValorSpan.html(sliderRadio.value());
  });

  // === RUIDO ===
  tipoRuidoSelect = select('#tipoRuido');
  sliderAmplitud = select('#sliderAmplitud');
  sliderFrecuencia = select('#sliderFrecuencia');
  valorAmplitudSpan = select('#valorAmplitud');
  valorFrecuenciaSpan = select('#valorFrecuencia');

  sliderAmplitud.input(() => {
    valorAmplitudSpan.html(sliderAmplitud.value());
  });
  sliderFrecuencia.input(() => {
    valorFrecuenciaSpan.html(sliderFrecuencia.value());
  });

  // === REPULSIÓN ===
  sliderRepulsion = select('#sliderRepulsion');
  valorRepulsionSpan = select('#valorRepulsion');
  sliderRepulsion.input(() => {
    valorRepulsionSpan.html(sliderRepulsion.value());
  });

  // === VISUALIZACIÓN ===
  tipoVisualSelect = select('#tipoVisual');
  toggleHistorialBtn = select('#toggleHistorialBtn');
  toggleNodosBtn = select('#toggleNodosBtn');
  clearHistorialBtn = select('#clearHistorialBtn');

  toggleHistorialBtn.mousePressed(() => {
    mostrarHistorial = !mostrarHistorial;
    toggleHistorialBtn.html(mostrarHistorial ? "🕘 Ocultar historial" : "🕘 Ver historial");
  });

  toggleNodosBtn.mousePressed(() => {
    mostrarNodos = !mostrarNodos;
    toggleNodosBtn.html(mostrarNodos ? "🔘 Ocultar nodos" : "🔘 Mostrar nodos");
  });

  clearHistorialBtn.mousePressed(() => {
    historialFormas = [];
    frameHistorial = 0;
  });

  // === BOTONES FUNCIONALES ===
  playPauseBtn = select('#playPauseBtn');
  restartBtn = select('#restartBtn');
  playPauseBtn.mousePressed(togglePlayPause);
  restartBtn.mousePressed(reiniciarCrecimiento);

  // === EXPORTAR ===
  btnExportPNG = select('#btnExportPNG');
  btnExportSVG = select('#btnExportSVG');

  btnExportPNG.mousePressed(() => {
    saveCanvas('crecimiento_diferencial', 'png');
  });

  btnExportSVG.mousePressed(() => {
    exportarSVG();
  });

  noFill();
}

function togglePlayPause() {
  if (!iniciado) {
    iniciarCrecimiento();
    playPauseBtn.html('⏸ Pausar');
  } else {
    running = !running;
    playPauseBtn.html(running ? '⏸ Pausar' : '▶ Reanudar');
  }
}

function iniciarCrecimiento() {
  let cantidad = int(inputPuntos.value());
  radio = float(sliderRadio.value());

  if (isNaN(cantidad) || cantidad < 3 || isNaN(radio) || radio <= 0) {
    alert("Por favor ingresa valores válidos.");
    return;
  }

  // Parámetros de ruido
  let tipo = tipoRuidoSelect.value();
  let amp = float(sliderAmplitud.value());
  let freq = float(sliderFrecuencia.value());

  // Distancia mínima y máxima definidas por el usuario
  let minInput = float(inputMinDist.value());
  let maxInput = float(inputMaxDist.value());

  let circunferencia = TWO_PI * radio;
  let distInicial = circunferencia / cantidad;

  // Fallback si no hay valores válidos
  minDist = (!isNaN(minInput) && minInput > 0) ? minInput : distInicial * 1.2;
  maxDist = (!isNaN(maxInput) && maxInput > 0) ? maxInput : distInicial * 1.2;

  points = [];

  for (let i = 0; i < cantidad; i++) {
    let angle = TWO_PI * i / cantidad;
    let x = width / 2 + radio * cos(angle);
    let y = height / 2 + radio * sin(angle);

    // === Aplicar ruido inicial a la curva base ===
    let ruido = createVector(0, 0);
    if (tipo === 'perlin') {
      let n = noise(x * freq, y * freq);
      let angleOffset = n * TWO_PI;
      ruido = p5.Vector.fromAngle(angleOffset).mult(amp);
    } else if (tipo === 'perlinImproved') {
      let nx = noise(x * freq);
      let ny = noise(y * freq);
      ruido = createVector((nx - 0.5) * amp * 2, (ny - 0.5) * amp * 2);
    } else if (tipo === 'valor') {
      ruido = createVector(random(-1, 1) * amp, random(-1, 1) * amp);
    } else if (tipo === 'simple') {
      ruido = p5.Vector.random2D().mult(amp);
    }

    x += ruido.x;
    y += ruido.y;

    points.push(createVector(x, y));
  }

  iniciado = true;
  running = true;
}


function reiniciarCrecimiento() {
  points = [];
  running = false;
  iniciado = false;
  playPauseBtn.html('▶ Iniciar');
  offsetX = 0;
  offsetY = 0;
  zoom = 1.0;
  noiseOffset = 0;
  historialFormas = [];
}

function draw() {
  background(255);
  push();

  // === Aplicar zoom y pan antes de todo ===
  translate(width / 2 + offsetX, height / 2 + offsetY);
  scale(zoom);
  translate(-width / 2, -height / 2);
  maxPoints = int(inputMaxPoints.value());


  let tipoVisual = tipoVisualSelect.value();

  // === Dibujar historial dentro del mismo espacio ===
  if (mostrarHistorial && historialFormas.length > 0) {
    stroke(180);
    strokeWeight(1 / zoom);
    noFill();

    for (let forma of historialFormas) {
      beginShape();
      for (let p of forma) {
        if (tipoVisual === 'curva') {
          curveVertex(p.x, p.y);
        } else {
          vertex(p.x, p.y);
        }
      }
      if (tipoVisual === 'curva') {
        curveVertex(forma[0].x, forma[0].y);
        curveVertex(forma[1].x, forma[1].y);
      }
      endShape(CLOSE);
    }
  }

  // === Dibujar curva activa ===
  if (points.length > 0) {
    stroke(0);
    strokeWeight(1 / zoom);
    noFill();

    beginShape();
    if (tipoVisual === 'curva') {
      let len = points.length;
curveVertex(points[0].x, points[0].y); // repetir primeros dos
curveVertex(points[0].x, points[0].y);
for (let i = 0; i < points.length; i++) {
  curveVertex(points[i].x, points[i].y);
}
curveVertex(points[0].x, points[0].y);
curveVertex(points[0].x, points[0].y);

    } else {
      for (let p of points) vertex(p.x, p.y);
    }
    endShape(CLOSE);

    if (mostrarNodos) {
      fill(0);
      noStroke();
      for (let p of points) {
        circle(p.x, p.y, 4 / zoom);
      }
    }
  }

  // === Previsualización antes de iniciar ===
  if (!iniciado) {
    let cantidad = int(inputPuntos.value());
    let r = float(sliderRadio.value());

    stroke(150);
    strokeWeight(1 / zoom);
    noFill();

    beginShape();
    for (let i = 0; i < cantidad; i++) {
      let angle = TWO_PI * i / cantidad;
      let x = width / 2 + r * cos(angle);
      let y = height / 2 + r * sin(angle);
      vertex(x, y);
    }
    endShape(CLOSE);

    if (mostrarNodos) {
      fill(0);
      noStroke();
      for (let i = 0; i < cantidad; i++) {
        let angle = TWO_PI * i / cantidad;
        let x = width / 2 + r * cos(angle);
        let y = height / 2 + r * sin(angle);
        circle(x, y, 4 / zoom);
      }
    }
  }

  pop();

  // === Fin de dibujado si no corre ===
  if (!running || points.length >= maxPoints) return;

  // === Guardar historial cada X frames ===
  if (mostrarHistorial && frameHistorial % frecuenciaHistorial === 0) {
    let copia = points.map(p => createVector(p.x, p.y));
    historialFormas.push(copia);
  }
  frameHistorial++;

  // === Algoritmo de crecimiento ===
  let nuevosPuntos = [];

  for (let i = 0; i < points.length; i++) {
    let actual = points[i];
    let fuerza = createVector(0, 0);
    let cercanos = 0;

    for (let j = 0; j < points.length; j++) {
      if (i !== j) {
        let otro = points[j];
        let d = dist(actual.x, actual.y, otro.x, otro.y);
        if (d < minDist) {
          let dir = p5.Vector.sub(actual, otro);
          let repulsionFactor = float(sliderRepulsion.value());
          dir.normalize();
          dir.mult(repulsionFactor / d);
          fuerza.add(dir);
          cercanos++;
        }
      }
    }

    // === Agregar ruido ===
    let tipo = tipoRuidoSelect.value();
    let amp = float(sliderAmplitud.value());
    let freq = float(sliderFrecuencia.value());
    let ruido = createVector(0, 0);

    if (tipo === 'perlin') {
      let n = noise(actual.x * freq, actual.y * freq + noiseOffset);
      let angle = n * TWO_PI;
      ruido = p5.Vector.fromAngle(angle).mult(amp);
    } else if (tipo === 'perlinImproved') {
      let nx = noise(actual.x * freq, noiseOffset);
      let ny = noise(actual.y * freq, noiseOffset + 1000);
      ruido = createVector((nx - 0.5) * amp * 2, (ny - 0.5) * amp * 2);
    } else if (tipo === 'valor') {
      ruido = createVector(random(-1, 1) * amp, random(-1, 1) * amp);
    } else if (tipo === 'simple') {
      ruido = p5.Vector.random2D().mult(amp);
    }

    if (cercanos > 0) {
      fuerza.div(cercanos);
      fuerza.add(ruido);
    } else {
      fuerza = ruido.copy();
    }

    actual.add(fuerza);
    nuevosPuntos.push(actual);

    let siguiente = points[(i + 1) % points.length];
    let dNext = p5.Vector.dist(actual, siguiente);
    if (dNext > maxDist) {
      let mid = p5.Vector.add(actual, siguiente).div(2);
      nuevosPuntos.push(mid);
    }
  }

  points = nuevosPuntos;
  noiseOffset += 0.01;
}

function mouseWheel(event) {
  let zoomSpeed = 0.001;
  let factor = 1 - event.delta * zoomSpeed;
  zoom *= factor;
  return false;
}

function mousePressed() {
  if (mouseButton === LEFT) {
    isDragging = true;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}

function mouseReleased() {
  isDragging = false;
}

function mouseDragged() {
  if (isMouseOverUI()) return;

  if (isDragging) {
    let dx = mouseX - lastMouseX;
    let dy = mouseY - lastMouseY;
    offsetX += dx;
    offsetY += dy;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function isMouseOverUI() {
  const ui = document.getElementById("ui");
  const bounds = ui.getBoundingClientRect();
  return mouseX >= bounds.left && mouseX <= bounds.right &&
         mouseY >= bounds.top && mouseY <= bounds.bottom;
}

function exportarSVG() {
  let w = windowWidth;
  let h = windowHeight;

  let svgCanvas = createGraphics(w, h, SVG);
  textFont('sans-serif'); // Evita errores de tipografía

  svgCanvas.translate(w / 2 + offsetX, h / 2 + offsetY);
  svgCanvas.scale(zoom);
  svgCanvas.translate(-w / 2, -h / 2);

  svgCanvas.strokeWeight(1 / zoom);
  svgCanvas.noFill();

  const tipoVisual = tipoVisualSelect.value();

  // === Dibujar historial si está activado ===
  if (mostrarHistorial && historialFormas.length > 0) {
    svgCanvas.stroke(180);
    for (let forma of historialFormas) {
      svgCanvas.beginShape();
      for (let p of forma) {
        if (tipoVisual === 'curva') {
          svgCanvas.curveVertex(p.x, p.y);
        } else {
          svgCanvas.vertex(p.x, p.y);
        }
      }
      if (tipoVisual === 'curva') {
        svgCanvas.curveVertex(forma[0].x, forma[0].y);
        svgCanvas.curveVertex(forma[0].x, forma[0].y);
      }
      svgCanvas.endShape(CLOSE);
    }
  }

  // === Dibujar curva actual ===
  if (points.length > 0) {
    svgCanvas.stroke(0);
    svgCanvas.beginShape();
    if (tipoVisual === 'curva') {
      svgCanvas.curveVertex(points[0].x, points[0].y);
      svgCanvas.curveVertex(points[0].x, points[0].y);
      for (let i = 0; i < points.length; i++) {
        svgCanvas.curveVertex(points[i].x, points[i].y);
      }
      svgCanvas.curveVertex(points[0].x, points[0].y);
      svgCanvas.curveVertex(points[0].x, points[0].y);
    } else {
      for (let p of points) {
        svgCanvas.vertex(p.x, p.y);
      }
    }
    svgCanvas.endShape(CLOSE);

    // === Dibujar nodos si están activados ===
    if (mostrarNodos) {
      svgCanvas.noStroke();
      svgCanvas.fill(0);
      for (let p of points) {
        svgCanvas.circle(p.x, p.y, 4 / zoom);
      }
    }
  }

  // === Exportar con timestamp ===
  let timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
  save(svgCanvas, `crecimiento_diferencial_${timestamp}.svg`);
}

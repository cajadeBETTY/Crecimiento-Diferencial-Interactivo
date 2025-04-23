let points = [];
let running = false;
let maxPoints = 2000;
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

  inputFrecuenciaHistorial.input(() => frecuenciaHistorial = int(inputFrecuenciaHistorial.value()));

  sliderRadio = select('#sliderRadio');
  radioValorSpan = select('#radioValor');
  sliderRadio.input(() => radioValorSpan.html(sliderRadio.value()));

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

  playPauseBtn = select('#playPauseBtn');
  restartBtn = select('#restartBtn');
  playPauseBtn.mousePressed(togglePlayPause);
  restartBtn.mousePressed(reiniciarCrecimiento);

  btnExportPNG = select('#btnExportPNG');
  btnExportSVG = select('#btnExportSVG');

  btnExportPNG.mousePressed(() => saveCanvas('crecimiento_diferencial', 'png'));
  btnExportSVG.mousePressed(() => exportarSVG());

  // NUEVOS ELEMENTOS
  formaGenericaSelect = select('#formaGenericaSelect');
  inputLados = select('#inputLados'); // 🔥 corregido según HTML

  // 🔥 Listener único para activar campos y crear curva
  formaGenericaSelect.elt.addEventListener('change', () => {
    let tipo = formaGenericaSelect.value();
    if (tipo === 'circulo') {
      inputLados.attribute('disabled', '');
    } else if (tipo === 'poligono') {
      inputLados.removeAttribute('disabled');
    } else {
      inputLados.attribute('disabled', '');
    }
    iniciarCrecimiento();
    redraw();
  });

  // Input de archivo SVG
  fileInputSVG = createFileInput(handleFile);
  fileInputSVG.parent('ui');
  fileInputSVG.hide();

  select('#btnSubirSVG').mousePressed(() => fileInputSVG.elt.click());

  noFill();
}


function handleFile(file) {
  if (file.type === 'image' && file.subtype === 'svg') {
    let parser = new DOMParser();
    let svgDoc = parser.parseFromString(file.data, "image/svg+xml");

    let paths = svgDoc.querySelectorAll('path');
    points = [];  // Limpiar puntos existentes

    paths.forEach(path => {
      let pathLength = path.getTotalLength();
      let numSamples = int(inputPuntos.value());  // cantidad de muestras

      for (let i = 0; i < numSamples; i++) {
        let pt = path.getPointAtLength((i / numSamples) * pathLength);
        points.push(createVector(pt.x, pt.y));
      }
    });

    console.log("SVG cargado con " + points.length + " puntos.");
    iniciado = true;
    running = false;  // No inicia crecimiento automático
    redraw();         // 🔥 Forzar dibujo inicial del SVG
  } else {
    alert("Por favor sube un archivo SVG válido.");
  }
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
  console.log("Iniciando crecimiento...");

  points = []; // Limpiar puntos existentes

  let tipoForma = formaGenericaSelect.value();
  radio = float(sliderRadio.value());
  let cantidad = int(inputPuntos.value());

  console.log("Tipo forma:", tipoForma, "Radio:", radio, "Cantidad:", cantidad);

  if (tipoForma === 'circulo' || tipoForma === 'poligono') {
    let lados = (tipoForma === 'poligono') ? int(inputLados.value()) : cantidad;

    for (let i = 0; i < lados; i++) {
      let angle = TWO_PI * i / lados;
      let x = width / 2 + radio * cos(angle);
      let y = height / 2 + radio * sin(angle);
      points.push(createVector(x, y));
    }

    console.log("Puntos generados:", points.length);

    // Aplicar ruido si corresponde
    let tipoRuido = tipoRuidoSelect.value();
    let amp = float(sliderAmplitud.value());
    let freq = float(sliderFrecuencia.value());

    for (let p of points) {
      let ruido = createVector(0, 0);

      if (tipoRuido === 'perlin') {
        let n = noise(p.x * freq, p.y * freq);
        let angleOffset = n * TWO_PI;
        ruido = p5.Vector.fromAngle(angleOffset).mult(amp);
      } else if (tipoRuido === 'perlinImproved') {
        let nx = noise(p.x * freq);
        let ny = noise(p.y * freq);
        ruido = createVector((nx - 0.5) * amp * 2, (ny - 0.5) * amp * 2);
      } else if (tipoRuido === 'valor') {
        ruido = createVector(random(-1, 1) * amp, random(-1, 1) * amp);
      } else if (tipoRuido === 'simple') {
        ruido = p5.Vector.random2D().mult(amp);
      }

      p.add(ruido);
    }
  }

  // Recalcular minDist y maxDist cada vez
  let circunferencia = TWO_PI * radio;
  let distInicial = circunferencia / cantidad;
  let minInput = float(inputMinDist.value());
  let maxInput = float(inputMaxDist.value());
  minDist = (!isNaN(minInput) && minInput > 0) ? minInput : distInicial * 1.2;
  maxDist = (!isNaN(maxInput) && maxInput > 0) ? maxInput : distInicial * 1.2;

  if (points.length > 0) {
    iniciado = true;
    running = false; // 🔧 No iniciar el crecimiento automático
  } else {
    alert("Por favor selecciona una forma genérica o sube un SVG.");
  }
}


function reiniciarCrecimiento() {
  running = false;
  iniciado = false;
  offsetX = 0;
  offsetY = 0;
  zoom = 1.0;
  noiseOffset = 0;
  historialFormas = [];
  playPauseBtn.html('▶ Iniciar');

  // 🔥 Solo reiniciar si no es un SVG cargado
  if (formaGenericaSelect.value() !== 'none') {
    iniciarCrecimiento();  // Vuelve a generar la curva base
  }

  if (points.length > 0) redraw();  // 🔥 Dibuja inmediatamente si hay puntos
}


function draw() {
  background(255);
  push();
  translate(width / 2 + offsetX, height / 2 + offsetY);
  scale(zoom);
  translate(-width / 2, -height / 2);

  let tipoVisual = tipoVisualSelect.value();

  // === Previsualización antes de iniciar ===
  if (!iniciado) {
    if (points.length > 0) {  // 🔥 Mostrar SVG o forma cargada
      stroke(150);
      strokeWeight(1 / zoom);
      noFill();
      beginShape();
      for (let p of points) {
        vertex(p.x, p.y);
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
    pop();
if (points.length === 0) return;  // 🔥 Evita salir si hay curva cargada

    return;  // 🔥 Salir para evitar el resto de draw()
  }

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
      curveVertex(points[len - 1].x, points[len - 1].y);
      curveVertex(points[0].x, points[0].y);
      for (let i = 0; i < len; i++) {
        curveVertex(points[i].x, points[i].y);
      }
      curveVertex(points[0].x, points[0].y);
      curveVertex(points[1].x, points[1].y);
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
  pop();

  // === Algoritmo de crecimiento ===
  if (iniciado && running && points.length < maxPoints) {
    if (mostrarHistorial && frameHistorial % frecuenciaHistorial === 0) {
      let copia = points.map(p => createVector(p.x, p.y));
      historialFormas.push(copia);
    }
    frameHistorial++;

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
            dir.normalize();
            dir.mult(float(sliderRepulsion.value()) / d);
            fuerza.add(dir);
            cercanos++;
          }
        }
      }

      let ruido = createVector(0, 0);
      let tipo = tipoRuidoSelect.value();
      let amp = float(sliderAmplitud.value());
      let freq = float(sliderFrecuencia.value());

      if (tipo === 'perlin') {
        let n = noise(actual.x * freq, actual.y * freq + noiseOffset);
        ruido = p5.Vector.fromAngle(n * TWO_PI).mult(amp);
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
        fuerza.div(cercanos).add(ruido);
      } else {
        fuerza = ruido.copy();
      }

      actual.add(fuerza);
      nuevosPuntos.push(actual);

      let siguiente = points[(i + 1) % points.length];
      if (dist(actual.x, actual.y, siguiente.x, siguiente.y) > maxDist) {
        nuevosPuntos.push(p5.Vector.add(actual, siguiente).div(2));
      }
    }

    points = nuevosPuntos;
    noiseOffset += 0.01;
  }
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
  let timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  exportandoSVG = true;
  beginRecordSVG(this, `crecimiento_diferencial_${timestamp}.svg`);
  redraw(); // 🔥 Forzar redibujo en el SVG context


  const tipoVisual = tipoVisualSelect.value();

  // Dibujar historial
  if (mostrarHistorial && historialFormas.length > 0) {
    stroke(0);
    noFill();
    for (let forma of historialFormas) {
      beginShape();
      if (tipoVisual === 'curva') {
        let len = forma.length;
        let p0 = ajustarCoordenadas(forma[len - 1], width, height);
        curveVertex(p0.x, p0.y);
        let p1 = ajustarCoordenadas(forma[0], width, height);
        curveVertex(p1.x, p1.y);
        for (let p of forma) {
          let adj = ajustarCoordenadas(p, width, height);
          curveVertex(adj.x, adj.y);
        }
        curveVertex(p1.x, p1.y);
        let p2 = ajustarCoordenadas(forma[1], width, height);
        curveVertex(p2.x, p2.y);
      } else {
        for (let p of forma) {
          let adj = ajustarCoordenadas(p, width, height);
          vertex(adj.x, adj.y);
        }
      }
      endShape(CLOSE);
    }
  }

  // Dibujar puntos actuales
  if (points.length > 0) {
    stroke(0);
    noFill();
    beginShape();
    if (tipoVisual === 'curva') {
      let len = points.length;
      let p0 = ajustarCoordenadas(points[len - 1], width, height);
      curveVertex(p0.x, p0.y);
      let p1 = ajustarCoordenadas(points[0], width, height);
      curveVertex(p1.x, p1.y);
      for (let i = 0; i < len; i++) {
        let adj = ajustarCoordenadas(points[i], width, height);
        curveVertex(adj.x, adj.y);
      }
      curveVertex(p1.x, p1.y);
      let p2 = ajustarCoordenadas(points[1], width, height);
      curveVertex(p2.x, p2.y);
    } else {
      for (let p of points) {
        let adj = ajustarCoordenadas(p, width, height);
        vertex(adj.x, adj.y);
      }
    }
    endShape(CLOSE);

    if (mostrarNodos) {
      for (let p of points) {
        let adj = ajustarCoordenadas(p, width, height);
        stroke(0);
        fill(0);
        ellipse(adj.x, adj.y, 4, 4);
      }
    }
  }
exportandoSVG = false;

  endRecordSVG();
}


function ajustarCoordenadas(p, w, h) {
  let adjX = (p.x - width / 2) * zoom + w / 2;
  let adjY = (p.y - height / 2) * zoom + h / 2;
  return createVector(adjX, adjY);
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
  console.log("Iniciando crecimiento...");

  points = []; // Limpiar puntos existentes

  let tipoForma = formaGenericaSelect.value();
  radio = float(sliderRadio.value());
  let cantidad = int(inputPuntos.value());

  console.log("Tipo forma:", tipoForma, "Radio:", radio, "Cantidad:", cantidad);

  if (tipoForma === 'circulo' || tipoForma === 'poligono') {
    let lados = (tipoForma === 'poligono') ? int(inputLados.value()) : cantidad;

    for (let i = 0; i < lados; i++) {
      let angle = TWO_PI * i / lados;
      let x = width / 2 + radio * cos(angle);
      let y = height / 2 + radio * sin(angle);
      points.push(createVector(x, y));
    }

    console.log("Puntos generados:", points.length);

    // Aplicar ruido si corresponde
    let tipoRuido = tipoRuidoSelect.value();
    let amp = float(sliderAmplitud.value());
    let freq = float(sliderFrecuencia.value());

    for (let p of points) {
      let ruido = createVector(0, 0);

      if (tipoRuido === 'perlin') {
        let n = noise(p.x * freq, p.y * freq);
        let angleOffset = n * TWO_PI;
        ruido = p5.Vector.fromAngle(angleOffset).mult(amp);
      } else if (tipoRuido === 'perlinImproved') {
        let nx = noise(p.x * freq);
        let ny = noise(p.y * freq);
        ruido = createVector((nx - 0.5) * amp * 2, (ny - 0.5) * amp * 2);
      } else if (tipoRuido === 'valor') {
        ruido = createVector(random(-1, 1) * amp, random(-1, 1) * amp);
      } else if (tipoRuido === 'simple') {
        ruido = p5.Vector.random2D().mult(amp);
      }

      p.add(ruido);
    }
  }

  // Recalcular minDist y maxDist cada vez
  let circunferencia = TWO_PI * radio;
  let distInicial = circunferencia / cantidad;
  let minInput = float(inputMinDist.value());
  let maxInput = float(inputMaxDist.value());
  minDist = (!isNaN(minInput) && minInput > 0) ? minInput : distInicial * 1.2;
  maxDist = (!isNaN(maxInput) && maxInput > 0) ? maxInput : distInicial * 1.2;

  if (points.length > 0) {
    iniciado = true;
    running = false; // 🔧 No iniciar el crecimiento automático
  } else {
    alert("Por favor selecciona una forma genérica o sube un SVG.");
  }
}

function reiniciarCrecimiento() {
  running = false;
  iniciado = false;
  offsetX = 0;
  offsetY = 0;
  zoom = 1.0;
  noiseOffset = 0;
  historialFormas = [];
  playPauseBtn.html('▶ Iniciar');
  
  iniciarCrecimiento();  // 🔥 Vuelve a generar la curva base
  redraw();              // 🔥 Dibuja inmediatamente sin movimiento
}


function draw() {

  if (!running && !exportandoSVG) return; // solo dibuja si está corriendo o exportando

  background(255);
  push();


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
    // 🔥 Corrección aquí:
    curveVertex(points[len - 1].x, points[len - 1].y);  // Repetir último punto al inicio
    curveVertex(points[0].x, points[0].y);              // Repetir primero
    for (let i = 0; i < len; i++) {
      curveVertex(points[i].x, points[i].y);
    }
    curveVertex(points[0].x, points[0].y);              // Repetir primero
    curveVertex(points[1].x, points[1].y);              // Repetir segundo para suavizar
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
  let timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  exportandoSVG = true;
  beginRecordSVG(this, `crecimiento_diferencial_${timestamp}.svg`);
  redraw(); // 🔥 Forzar redibujo en el SVG context


  const tipoVisual = tipoVisualSelect.value();

  // Dibujar historial
  if (mostrarHistorial && historialFormas.length > 0) {
    stroke(0);
    noFill();
    for (let forma of historialFormas) {
      beginShape();
      if (tipoVisual === 'curva') {
        let len = forma.length;
        let p0 = ajustarCoordenadas(forma[len - 1], width, height);
        curveVertex(p0.x, p0.y);
        let p1 = ajustarCoordenadas(forma[0], width, height);
        curveVertex(p1.x, p1.y);
        for (let p of forma) {
          let adj = ajustarCoordenadas(p, width, height);
          curveVertex(adj.x, adj.y);
        }
        curveVertex(p1.x, p1.y);
        let p2 = ajustarCoordenadas(forma[1], width, height);
        curveVertex(p2.x, p2.y);
      } else {
        for (let p of forma) {
          let adj = ajustarCoordenadas(p, width, height);
          vertex(adj.x, adj.y);
        }
      }
      endShape(CLOSE);
    }
  }

  // Dibujar puntos actuales
  if (points.length > 0) {
    stroke(0);
    noFill();
    beginShape();
    if (tipoVisual === 'curva') {
      let len = points.length;
      let p0 = ajustarCoordenadas(points[len - 1], width, height);
      curveVertex(p0.x, p0.y);
      let p1 = ajustarCoordenadas(points[0], width, height);
      curveVertex(p1.x, p1.y);
      for (let i = 0; i < len; i++) {
        let adj = ajustarCoordenadas(points[i], width, height);
        curveVertex(adj.x, adj.y);
      }
      curveVertex(p1.x, p1.y);
      let p2 = ajustarCoordenadas(points[1], width, height);
      curveVertex(p2.x, p2.y);
    } else {
      for (let p of points) {
        let adj = ajustarCoordenadas(p, width, height);
        vertex(adj.x, adj.y);
      }
    }
    endShape(CLOSE);

    if (mostrarNodos) {
      for (let p of points) {
        let adj = ajustarCoordenadas(p, width, height);
        stroke(0);
        fill(0);
        ellipse(adj.x, adj.y, 4, 4);
      }
    }
  }
exportandoSVG = false;

  endRecordSVG();
}


function ajustarCoordenadas(p, w, h) {
  let adjX = (p.x - width / 2) * zoom + w / 2;
  let adjY = (p.y - height / 2) * zoom + h / 2;
  return createVector(adjX, adjY);
}

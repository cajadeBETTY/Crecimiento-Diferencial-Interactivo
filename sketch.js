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
let frecuenciaHistorial = 10;

let inputFrecuenciaHistorial;
let inputMinDist, inputMaxDist;
let inputMaxPoints;
let btnExportPNG, btnExportSVG;

// setup() y iniciarCrecimiento() aquí...

function draw() {
  background(255);
  push();

  translate(width / 2 + offsetX, height / 2 + offsetY);
  scale(zoom);
  translate(-width / 2, -height / 2);
  maxPoints = int(inputMaxPoints.value());

  let tipoVisual = tipoVisualSelect.value();

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
        curveVertex(forma[0].x, forma[0].y);
      }
      endShape(CLOSE);
    }
  }

  if (points.length > 0) {
    stroke(0);
    strokeWeight(1 / zoom);
    noFill();

    beginShape();
    if (tipoVisual === 'curva') {
      curveVertex(points[0].x, points[0].y);
      curveVertex(points[0].x, points[0].y);
      for (let p of points) {
        curveVertex(p.x, p.y);
      }
      curveVertex(points[0].x, points[0].y);
      curveVertex(points[0].x, points[0].y);
    } else {
      for (let p of points) {
        vertex(p.x, p.y);
      }
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

  if (!running || points.length >= maxPoints) return;

  if (mostrarHistorial && frameHistorial % frecuenciaHistorial === 0) {
    historialFormas.push(points.map(p => createVector(p.x, p.y)));
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

    let tipo = tipoRuidoSelect.value();
    let amp = float(sliderAmplitud.value());
    let freq = float(sliderFrecuencia.value());
    let ruido = createVector(0, 0);

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

    fuerza.div(max(1, cercanos)).add(ruido);
    actual.add(fuerza);
    nuevosPuntos.push(actual);

    let siguiente = points[(i + 1) % points.length];
    if (p5.Vector.dist(actual, siguiente) > maxDist) {
      nuevosPuntos.push(p5.Vector.add(actual, siguiente).div(2));
    }
  }
  points = nuevosPuntos;
  noiseOffset += 0.01;
}

function mouseWheel(event) {
  zoom *= 1 - event.delta * 0.001;
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
  if (isDragging) {
    let dx = mouseX - lastMouseX;
    let dy = mouseY - lastMouseY;
    offsetX += dx;
    offsetY += dy;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}

function exportarSVG() {
  let svgCanvas = createGraphics(windowWidth, windowHeight, SVG);
  svgCanvas.translate(width / 2 + offsetX, height / 2 + offsetY);
  svgCanvas.scale(zoom);
  svgCanvas.translate(-width / 2, -height / 2);
  svgCanvas.strokeWeight(1 / zoom);
  svgCanvas.noFill();

  const tipoVisual = tipoVisualSelect.value();

  if (mostrarHistorial) {
    svgCanvas.stroke(180);
    for (let forma of historialFormas) {
      svgCanvas.beginShape();
      for (let p of forma) {
        tipoVisual === 'curva' ? svgCanvas.curveVertex(p.x, p.y) : svgCanvas.vertex(p.x, p.y);
      }
      if (tipoVisual === 'curva') {
        svgCanvas.curveVertex(forma[0].x, forma[0].y);
        svgCanvas.curveVertex(forma[0].x, forma[0].y);
      }
      svgCanvas.endShape(CLOSE);
    }
  }

  if (points.length > 0) {
    svgCanvas.stroke(0);
    svgCanvas.beginShape();
    if (tipoVisual === 'curva') {
      svgCanvas.curveVertex(points[0].x, points[0].y);
      svgCanvas.curveVertex(points[0].x, points[0].y);
      for (let p of points) svgCanvas.curveVertex(p.x, p.y);
      svgCanvas.curveVertex(points[0].x, points[0].y);
      svgCanvas.curveVertex(points[0].x, points[0].y);
    } else {
      for (let p of points) svgCanvas.vertex(p.x, p.y);
    }
    svgCanvas.endShape(CLOSE);

    if (mostrarNodos) {
      svgCanvas.noStroke();
      svgCanvas.fill(0);
      for (let p of points) svgCanvas.circle(p.x, p.y, 4 / zoom);
    }
  }

  svgCanvas.save('crecimiento_diferencial.svg');
}

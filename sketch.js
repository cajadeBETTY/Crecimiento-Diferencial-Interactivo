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


function setup() {
  createCanvas(windowWidth, windowHeight);

  inputPuntos = select('#inputPuntos');
  sliderRadio = select('#sliderRadio');
  radioValorSpan = select('#radioValor');
  playPauseBtn = select('#playPauseBtn');
  restartBtn = select('#restartBtn');

  sliderRadio.input(() => {
    radioValorSpan.html(sliderRadio.value());
  });
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

  playPauseBtn.mousePressed(togglePlayPause);
  restartBtn.mousePressed(reiniciarCrecimiento);

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

  let circunferencia = TWO_PI * radio;
  let distInicial = circunferencia / cantidad;
  minDist = distInicial * 1.2;
  maxDist = distInicial * 1.2;

  points = [];
  for (let i = 0; i < cantidad; i++) {
    let angle = TWO_PI * i / cantidad;
    let x = width / 2 + radio * cos(angle);
    let y = height / 2 + radio * sin(angle);
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
}

function draw() {
  background(255);

  push();
  translate(width / 2 + offsetX, height / 2 + offsetY);
  scale(zoom);
  translate(-width / 2, -height / 2);

// === Dibujo de la curva, sin escalar grosores ===
push();
translate(width / 2 + offsetX, height / 2 + offsetY);
scale(zoom);
translate(-width / 2, -height / 2);

// Polilínea cerrada
noFill();
stroke(0);
strokeWeight(1 / zoom); // evita que engrosen al hacer zoom
beginShape();
for (let p of points) {
  vertex(p.x, p.y);
}
endShape(CLOSE);

// Nodos
noStroke();
fill(0);
for (let p of points) {
  circle(p.x, p.y, 4 / zoom); // escala inversa al zoom
}

pop();

  // === Dibujar círculo inicial antes de iniciar ===
if (!iniciado) {
  let cantidad = int(inputPuntos.value());
  let r = float(sliderRadio.value());

  push();
  translate(width / 2 + offsetX, height / 2 + offsetY);
  scale(zoom);
  translate(-width / 2, -height / 2);

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

  fill(0);
  noStroke();
  for (let i = 0; i < cantidad; i++) {
    let angle = TWO_PI * i / cantidad;
    let x = width / 2 + r * cos(angle);
    let y = height / 2 + r * sin(angle);
    circle(x, y, 4 / zoom);
  }

  pop();
}



  if (!running || points.length >= maxPoints) return;

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
          dir.div(d);
          fuerza.add(dir);
          cercanos++;
        }
      }
    }

if (cercanos > 0) {
  fuerza.div(cercanos);

  // Aplicar ruido
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
    let vx = random(-1, 1) * amp;
    let vy = random(-1, 1) * amp;
    ruido = createVector(vx, vy);
  } else if (tipo === 'simple') {
    ruido = p5.Vector.random2D().mult(amp);
  }

  fuerza.add(ruido);
  actual.add(fuerza);
}

noiseOffset += 0.01;


    nuevosPuntos.push(actual);

    let siguiente = points[(i + 1) % points.length];
    let dNext = p5.Vector.dist(actual, siguiente);
    if (dNext > maxDist) {
      let mid = p5.Vector.add(actual, siguiente).div(2);
      nuevosPuntos.push(mid);
    }
  }

  points = nuevosPuntos;
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
  if (isDragging) {
    let dx = mouseX - lastMouseX;
    let dy = mouseY - lastMouseY;
    offsetX += dx;
    offsetY += dy;
    lastMouseX = mouseX;

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

    lastMouseY = mouseY;
  }
}

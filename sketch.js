let points = [];
let running = false;
let maxPoints = 1000;
let inputPuntos, playPauseBtn, restartBtn;
let radio = 96;
let minDist, maxDist;
let iniciado = false;

function setup() {
  createCanvas(800, 800);

  // Input de puntos iniciales
  createP('Número de puntos iniciales:');
  inputPuntos = createInput('50');
  inputPuntos.position(10, 40);
  inputPuntos.size(100);

  // Botón Play/Pause
  playPauseBtn = createButton('▶ Iniciar');
  playPauseBtn.position(10, 70);
  playPauseBtn.mousePressed(togglePlayPause);

  // Botón Reiniciar
  restartBtn = createButton('🔄 Reiniciar');
  restartBtn.position(120, 70);
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
  if (isNaN(cantidad) || cantidad < 3) {
    alert("Por favor ingresa un número válido mayor a 2.");
    return;
  }

  // Calcula distancias basadas en los puntos
  let circunferencia = TWO_PI * radio;
  let distProm = circunferencia / cantidad;
  minDist = distProm * 0.5;
  maxDist = distProm * 1.5;

  // Genera puntos iniciales en círculo
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
  running = false;
  iniciado = false;
  points = [];
  playPauseBtn.html('▶ Iniciar');
}

function draw() {
  background(255);

  // Dibujar polilínea cerrada
  stroke(0);
  strokeWeight(1);
  beginShape();
  for (let p of points) {
    vertex(p.x, p.y);
  }
  endShape(CLOSE);

  // Dibujar nodos
  fill(0);
  noStroke();
  for (let p of points) {
    circle(p.x, p.y, 4);
  }
  noFill();

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
      actual.add(fuerza);
    }

    nuevosPuntos.push(actual);

    // Insertar punto si está muy lejos del siguiente
    let siguiente = points[(i + 1) % points.length];
    let dNext = p5.Vector.dist(actual, siguiente);
    if (dNext > maxDist) {
      let mid = p5.Vector.add(actual, siguiente).div(2);
      nuevosPuntos.push(mid);
    }
  }

  points = nuevosPuntos;
}

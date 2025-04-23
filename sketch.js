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
let btnExportPNG;

function setup() {
  createCanvas(windowWidth, windowHeight);

  inputMinDist = select('#inputMinDist');
  inputMaxDist = select('#inputMaxDist');
  inputMaxPoints = select('#inputMaxPoints');
  inputFrecuenciaHistorial = select('#inputFrecuenciaHistorial');
  inputPuntos = select('#inputPuntos');

  inputFrecuenciaHistorial.input(() => {
    frecuenciaHistorial = int(inputFrecuenciaHistorial.value());
  });

  sliderRadio = select('#sliderRadio');
  radioValorSpan = select('#radioValor');
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

  sliderRepulsion = select('#sliderRepulsion');
  valorRepulsionSpan = select('#valorRepulsion');
  sliderRepulsion.input(() => {
    valorRepulsionSpan.html(sliderRepulsion.value());
  });

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
  btnExportPNG.mousePressed(() => {
    saveCanvas('crecimiento_diferencial', 'png');
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

  let tipo = tipoRuidoSelect.value();
  let amp = float(sliderAmplitud.value());
  let freq = float(sliderFrecuencia.value());

  let minInput = float(inputMinDist.value());
  let maxInput = float(inputMaxDist.value());

  let circunferencia = TWO_PI * radio;
  let distInicial = circunferencia / cantidad;

  minDist = (!isNaN(minInput) && minInput > 0) ? minInput : distInicial * 1.2;
  maxDist = (!isNaN(maxInput) && maxInput > 0) ? maxInput : distInicial * 1.2;

  points = [];

  for (let i = 0; i < cantidad; i++) {
    let angle = TWO_PI * i / cantidad;
    let x = width / 2 + radio * cos(angle);
    let y = height / 2 + radio * sin(angle);

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

let points = [];
let minDist = 10;
let maxDist = 25;
let running = true;
let maxPoints = 1000;

function setup() {
  createCanvas(800, 800);
  let radius = 96; // 1 inch ≈ 96px
  let initialPoints = 50;
  for (let i = 0; i < initialPoints; i++) {
    let angle = TWO_PI * i / initialPoints;
    let x = width / 2 + radius * cos(angle);
    let y = height / 2 + radius * sin(angle);
    points.push(createVector(x, y));
  }

  let stopBtn = createButton("Detener");
  stopBtn.position(10, 10);
  stopBtn.mousePressed(() => running = false);
}

function draw() {
  background(255);
  noFill();
  stroke(0);
  beginShape();
  for (let p of points) {
    vertex(p.x, p.y);
  }
  endShape(CLOSE);

  if (!running || points.length >= maxPoints) return;

  let newPoints = [];

  for (let i = 0; i < points.length; i++) {
    let current = points[i];
    let force = createVector(0, 0);
    let closeCount = 0;

    for (let j = 0; j < points.length; j++) {
      if (i !== j) {
        let other = points[j];
        let d = dist(current.x, current.y, other.x, other.y);
        if (d < minDist) {
          let dir = p5.Vector.sub(current, other);
          dir.normalize();
          dir.div(d); // menor distancia, más empuje
          force.add(dir);
          closeCount++;
        }
      }
    }

    if (closeCount > 0) {
      force.div(closeCount);
      current.add(force);
    }

    newPoints.push(current);

    // Inserta punto si está muy lejos del siguiente
    let next = points[(i + 1) % points.length];
    let dNext = p5.Vector.dist(current, next);
    if (dNext > maxDist) {
      let mid = p5.Vector.add(current, next).div(2);
      newPoints.push(mid);
    }
  }

  points = newPoints;
}

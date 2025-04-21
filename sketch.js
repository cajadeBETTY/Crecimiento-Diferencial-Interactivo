function exportarSVG() {
  let w = windowWidth;
  let h = windowHeight;

  let svgCanvas = createGraphics(w, h, SVG); // Asegúrate de tener p5.svg cargado
  textFont('sans-serif'); // evita errores en algunos navegadores

  svgCanvas.translate(w / 2 + offsetX, h / 2 + offsetY);
  svgCanvas.scale(zoom);
  svgCanvas.translate(-w / 2, -h / 2);

  svgCanvas.strokeWeight(1 / zoom);
  svgCanvas.noFill();

  const tipoVisual = tipoVisualSelect.value();

  // === Dibujar historial si está activo
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

  // === Dibujar curva actual
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

    if (mostrarNodos) {
      svgCanvas.noStroke();
      svgCanvas.fill(0);
      for (let p of points) {
        svgCanvas.circle(p.x, p.y, 4 / zoom);
      }
    }
  }

  // ✅ Guardar como archivo SVG
  let timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
  save(svgCanvas, `crecimiento_diferencial_${timestamp}.svg`);
}

ÍNDICE DEL SKETCH.JS

Variables declaradas
1.1. Contorno
  • contourPoints
  • contourLoaded
  • fileInputContour
  • sliderContourRadius, contourRadiusValor
1.2. Obstáculos
  • inputNumObstacles, numObstacles
  • obstacleCircles, obstacleSVGPoints
  • sliderRadiusObstacle, obstacleRadiusValor
  • sliderObstacleSeed, obstacleSeedValor
  • sliderScaleObstacles, obstacleScaleValor
  • obstacleScale, showObstacles, fileInputObstacles
1.3. Base de crecimiento
  • sliderBaseRadius, baseRadiusValor, fileInputBase
1.4. Nodos y Curva
  • inputPuntos, inputMinDist, inputMaxDist, inputMaxPoints
  • points, originalPoints
  • fileLoaded, svgText, loadedFileName
  • fuenteMonoLight
  • running, iniciado, maxPoints
  • zoom, offsetX, offsetY
1.5. UI Visualización
  • tipoVisualSelect
  • toggleHistorialBtn, toggleNodosBtn, clearHistorialBtn
1.6. Historial
  • mostrarHistorial, mostrarNodos
  • historialFormas, frameHistorial, frecuenciaHistorial
1.7. Experimental
  • tipoRuidoSelect
  • sliderAmplitud, sliderFrecuencia, sliderRepulsion
  • valorAmplitudSpan, valorFrecuenciaSpan, valorRepulsionSpan
1.8. Parámetros de crecimiento
  • noiseOffset, minDist, maxDist

Funciones declaradas
2.1. Ciclo de vida p5.js
  • preload()
  • setup()
  • draw()
  • windowResized()
2.2. Exportación
  • exportarSVG()
2.3. Contorno
  • generateContourCircle()
  • handleContourFile(file)
2.4. Obstáculos
  • generateObstacleCircles()
  • handleObstaclesFile(file)
2.5. Forma base y SVG
  • generarCurvaBase()
  • generarCurvaFromSVG()
  • fitPoints(pts)
  • handleFile(file)
2.6. Control de crecimiento
  • iniciarCrecimiento()
  • togglePlayPause()
  • reiniciarCrecimiento()
2.7. Helpers
  • previewShape()
  • pointInPolygon(pt, poly)

Funciones propias INVOCADAS en setup()
3.1. Al final de la configuración
  • previewShape()
  • generarCurvaBase()
  • redraw()
3.2. Botones y sliders
  • handleFile (createFileInput)
  • handleContourFile (createFileInput)
  • handleObstaclesFile (createFileInput)
  • previewShape (sliderBaseRadius, inputPuntos)
  • generateContourCircle (sliderContourRadius)
  • generateObstacleCircles (inputNumObstacles, sliders …)
  • togglePlayPause (playPauseBtn)
  • reiniciarCrecimiento (restartBtn)
  • exportarSVG (btnExportSVG)

Funciones propias INVOCADAS en draw()
4.1. Dibujo estático
  • Ninguna función propia aparte de pintar arrays de puntos
4.2. Dibujo bajo transformaciones
  • pointInPolygon (uso en límites y obstáculos)
4.3. Crecimiento
  • noise() y random() de p5.js, pero no llama más funciones internas
4.4. Información y logo
  • Ninguna función propia, solo p5.js (textFont, text, image)

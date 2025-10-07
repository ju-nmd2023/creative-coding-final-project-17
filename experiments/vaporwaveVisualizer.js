/* Used this as sort of a cheat sheet / rough guide on how to configure a 3d landscape with perlin noise
- Omar salinas https://codepen.io/osalinasv/pen/Epjaxp.
Also a early source of inspiration even though we want this to be way more angular and not smooth to fit the vaporwave theme   */

// in order to combine two canvases WebGL 3D (this one) and a regular 2d one in the future

// source

let foregroundLayer

const canvasWidth = 1920
const canvasHeight = 1080

// wireframe ground
const gridWidth = canvasWidth
const gridHeight = canvasHeight * 2
const gridScale = 40
const columns = Math.floor(gridWidth / gridScale)
const rows = Math.floor(gridHeight / gridScale)

// --- New variables for road and mountain boundaries ---
const roadWidthRatio = 0.15
const firstMountainRangeRatio = 0.35

let vertices = []
const noiseScale = 0.15
const noiseOffsetSpeed = 0.007
let noiseOffset = 0

function setup() {
  createCanvas(canvasWidth, canvasHeight)
  foregroundLayer = createGraphics(canvasWidth, canvasHeight, WEBGL)
  //create terrain
  vertices = createVertices(columns, rows, gridScale)
}

const createVertices = (cols, rows, scale = 1) => {
  const numDots = cols * rows
  const points = new Array(numDots)

  for (let i = 0; i < numDots; i++) {
    const x = i % cols
    points[i] = [x * scale, ((i - x) / cols) * scale]
  }

  return points
}

function draw() {
  background(0)
  // Draw animated wireframe
  drawWireframeLandscape()
  // Display the wireframe
  image(foregroundLayer, 0, 0)

  // make bumps move
  noiseOffset -= noiseOffsetSpeed
}

// cool wireframe mountains and road
function drawWireframeLandscape() {
  foregroundLayer.clear()
  foregroundLayer.push()

  // camera
  foregroundLayer.translate(0, -1000, -1920)
  foregroundLayer.rotateX(PI / 2.7)
  foregroundLayer.translate(-gridWidth / 2, gridHeight / 2 - 150)

  // wireframe style
  foregroundLayer.stroke(255)
  foregroundLayer.strokeWeight(1)
  foregroundLayer.fill(0)

  const amplitude = 100
  // Draw terrain using triangle strips
  for (let y = 0; y < rows - 1; y++) {
    foregroundLayer.beginShape(TRIANGLE_STRIP)

    for (let x = 0; x < columns; x++) {
      // --- road or mountains ---
      // Calculate how far the current point is from the center (0.0 to 1.0)
      let distFromCenter = abs(x - columns / 2) / (columns / 2)

      const currentIndex = y * columns + x
      const nextIndex = (y + 1) * columns + x

      // Get x,y positions
      let [x1, y1] = vertices[currentIndex]
      let [x2, y2] = vertices[nextIndex]

      // noise sampling
      let xnoise = (x * gridScale * noiseScale) / gridScale
      let ynoise1 = (y1 * noiseScale) / gridScale + noiseOffset
      let ynoise2 = (y2 * noiseScale) / gridScale + noiseOffset

      // --- get terrain height with road and mountains ---
      let z1 = getTerrainHeight(xnoise, ynoise1, distFromCenter, amplitude)
      let z2 = getTerrainHeight(xnoise, ynoise2, distFromCenter, amplitude)

      foregroundLayer.vertex(x1, y1, z1)
      foregroundLayer.vertex(x2, y2, z2)
    }

    foregroundLayer.endShape()
  }
  foregroundLayer.pop()
}

// calculate terrain height with noise and mountains
function getTerrainHeight(xnoise, ynoise, distFromCenter, amplitude) {
  // basic terrain bumps (Perlin noise)
  let baseHeight = map(noise(xnoise, ynoise), 0, 1, -amplitude, amplitude)

  // mountains taller further from road
  let linearHeightBoost = distFromCenter * amplitude * 1.5

  // road flat, mountains tall (two ranges)
  let heightMultiplier
  let finalHeight

  if (distFromCenter < roadWidthRatio) {
    // road super flat
    heightMultiplier = pow(distFromCenter + 0.2, 4)
    finalHeight = baseHeight * heightMultiplier
  } else if (distFromCenter < firstMountainRangeRatio) {
    // first mountains kinda tall
    let rangePos = map(
      distFromCenter,
      roadWidthRatio,
      firstMountainRangeRatio,
      0,
      1,
    )
    heightMultiplier = pow(rangePos + 0.5, 2.5)
    finalHeight = baseHeight * heightMultiplier * 1.5
    finalHeight += linearHeightBoost
  } else {
    // second mountains OMG so tall!
    let rangePos = map(distFromCenter, firstMountainRangeRatio, 1, 0, 1)
    heightMultiplier = pow(rangePos + 0.3, 2)
    finalHeight = baseHeight * heightMultiplier * 3.5
    finalHeight += linearHeightBoost * 2
  }

  // nothing below road level (0)
  finalHeight = max(finalHeight, 0)

  return finalHeight
}
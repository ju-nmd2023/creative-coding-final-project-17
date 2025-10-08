// Vaporwave Visualizer
// 3D landscape with perlin noise by Omar salinas https://codepen.io/osalinasv/pen/Epjaxp

// layers
let backgroundLayer
let foregroundLayer

// canvas size
const canvasWidth = 1920
const canvasHeight = 1080

// wireframe terrain
const gridWidth = canvasWidth
const gridHeight = canvasHeight * 2
const gridScale = 40
const columns = Math.floor(gridWidth / gridScale)
const rows = Math.floor(gridHeight / gridScale)

// road and mountain boundaries
const roadWidthRatio = 0.15
const firstMountainRangeRatio = 0.35

let vertices = []
const noiseScale = 0.15
const noiseOffsetSpeed = 0.007
let noiseOffset = 0

// terrain scrolling
const terrainScrollDuration = 1.052
let terrainScrollOffset = 0

// scale to fit window
let scaleFactor = 1

// music variables
let midi = null
let synths = []
let isPlaying = false
let audioAnalyser = null
let currentIntensity = 0
let currentTempo = 120

// all the songs
const midiFiles = [
  "Initial D - Rage Your Dream.json",
  "Cool Cool Mountain.json",
  "Timber.json",
  "Mii Channel.json",
  "var ska vi sova inatt perikles.json",
  "International Love.json",
  "All Star smash mouth.json",
  "Beethoven Moonlight Sonata.json",
  "MGMT - Kids.json",
  "Tokyo drift.json",
  "Pingu.json",
  "Smash Mouth Im A Believer.json",
  "daft_punk-giorgio_by_moroder.json",
  "Gangnam Style.json",
  "Feel this moment.json",
  "Ma Baker.json",
  "What ive done.json",
  "Rasputin.json",
  "Crawling (linkin park).json",
  "Alphaville - Big in Japan.json",
  "Axel F.json",
  "Numb.json",
  "Maroon 5 - One more night.json",
  "Hamster Dance.json",
  "Dreamscape.json",
  "David Guetta Kid Cudi - Memories.json",
  "Cry for you.json",
  "Sans undertale.json",
]
let currentMidiIndex = 0


function setup() {
  createCanvas(canvasWidth, canvasHeight)

  pixelDensity(Math.floor(1 + Math.max(windowWidth, windowHeight) / canvasWidth))

  // figure out scaling
  calculateScaleFactor()

  // make layers to add the sun later
  backgroundLayer = createGraphics(canvasWidth, canvasHeight)
  foregroundLayer = createGraphics(canvasWidth, canvasHeight, WEBGL)

  // make terrain height points
  vertices = createVertices(columns, rows, gridScale)


  
  // setup music
  setupAudioContext()
// music ui controls
  createUIControls()

  // scale canvas
  let canvasElement = document.querySelector("canvas")
  if (canvasElement) {
    canvasElement.style.width = windowWidth + "px"
    canvasElement.style.height = canvasHeight * scaleFactor + "px"
  }
}

function calculateScaleFactor() {
  scaleFactor = windowWidth / canvasWidth
}

// make terrain height points
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
  // update audi
  if (isPlaying && audioAnalyser) {
    updateAudioAnalysis()
  }

  clear()

  image(backgroundLayer, 0, 0)

  // draw  wireframe
  drawWireframeLandscape()

  // put wireframe on top
  image(foregroundLayer, 0, 0)

  // move bumps
  noiseOffset -= noiseOffsetSpeed

  // scroll terrain forward
  terrainScrollOffset += gridScale / (terrainScrollDuration * 60)
  if (terrainScrollOffset >= gridScale) {
    terrainScrollOffset -= gridScale
  }
}

// draw wireframe mountains and road
function drawWireframeLandscape() {
  foregroundLayer.clear()
  foregroundLayer.push()

  //should make this lower
  foregroundLayer.translate(0, -1000, -1920)
  foregroundLayer.rotateX(PI / 2.7)
  foregroundLayer.translate(-gridWidth / 2, gridHeight / 2 - 150)

  // wireframe style - white, no color animation
  foregroundLayer.stroke(255)
  foregroundLayer.strokeWeight(1)
  foregroundLayer.noFill()

  // base height
  const baseAmplitude = 25
  // music controls amplitude of mountains
  const audioMultiplier = 1 + currentIntensity * 2.5
  const amplitude = baseAmplitude * audioMultiplier

  // draw terrain
  for (let y = 0; y < rows - 1; y++) {
    foregroundLayer.beginShape(TRIANGLE_STRIP)

    for (let x = 0; x < columns; x++) {
      // distance from center (for road vs mountains)
      let distFromCenter = abs(x - columns / 2) / (columns / 2)

      const currentIndex = y * columns + x
      const nextIndex = (y + 1) * columns + x

      // get positions
      let [x1, y1] = vertices[currentIndex]
      let [x2, y2] = vertices[nextIndex]

      // add scroll and loop
      let scrolledY1 = (y1 + terrainScrollOffset) % gridHeight
      let scrolledY2 = (y2 + terrainScrollOffset) % gridHeight

      // noise sampling
      let xnoise = (x * gridScale) * noiseScale / gridScale
      let ynoise1 =
        (scrolledY1 + noiseOffset * gridScale / noiseScale) * noiseScale /
        gridScale
      let ynoise2 =
        (scrolledY2 + noiseOffset * gridScale / noiseScale) * noiseScale /
        gridScale

      // get height with music and mountains
      let z1 = getTerrainHeight(xnoise, ynoise1, distFromCenter, amplitude)
      let z2 = getTerrainHeight(xnoise, ynoise2, distFromCenter, amplitude)

      foregroundLayer.vertex(x1, scrolledY1, z1)
      foregroundLayer.vertex(x2, scrolledY2, z2)
    }

    foregroundLayer.endShape()
  }

  foregroundLayer.pop()
}

// calculate terrain height
function getTerrainHeight(xnoise, ynoise, distFromCenter, amplitude) {
  // basic noise
  let baseHeight = map(noise(xnoise, ynoise), 0, 1, -amplitude, amplitude)

  // add detail 
  baseHeight += map(
    noise(xnoise * 2, ynoise * 2),
    0,
    1,
    -amplitude * 0.3,
    amplitude * 0.3,
  )
  baseHeight += map(
    noise(xnoise * 4, ynoise * 4),
    0,
    1,
    -amplitude * 0.15,
    amplitude * 0.15,
  )

  // mountains taller away from road
  let linearHeightBoost = distFromCenter * amplitude * 1.5

  let heightMultiplier
  let finalHeight

  if (distFromCenter < roadWidthRatio) {
    // road flat
    heightMultiplier = pow(distFromCenter + 0.2, 4)
    finalHeight = baseHeight * heightMultiplier
  } else if (distFromCenter < firstMountainRangeRatio) {
    // first mountains small
    let rangePos = map(distFromCenter, roadWidthRatio, firstMountainRangeRatio, 0, 1)
    heightMultiplier = pow(rangePos + 0.5, 2.5)
    finalHeight = baseHeight * heightMultiplier * 1.5
    finalHeight += linearHeightBoost
  } else {
    // second mountains tall
    let rangePos = map(distFromCenter, firstMountainRangeRatio, 1, 0, 1)
    heightMultiplier = pow(rangePos + 0.3, 2)
    finalHeight = baseHeight * heightMultiplier * 3.5
    finalHeight += linearHeightBoost * 2
  }

  // nothing below zero
  finalHeight = max(finalHeight, 0)

  return finalHeight
}


// setup audio
async function setupAudioContext() {
  try {
    audioAnalyser = new Tone.Analyser("waveform", 256)
    await loadMidiFile(midiFiles[currentMidiIndex])
  } catch (error) {
    console.error("audio setup failed", error)
  }
}

// load midi file
async function loadMidiFile(filename) {
  try {
    const response = await fetch(`../assets/MIDI/${filename}`)
    const midiData = await response.json()
    midi = midiData

    if (midi.header.tempos && midi.header.tempos.length > 0) {
      currentTempo = midi.header.tempos[0].bpm || 120
    }

    console.log(`loaded ${filename}, tempo ${currentTempo}`)
  } catch (error) {
    console.error("midi load failed", error)
  }
}

// analyze audio
function updateAudioAnalysis() {
  if (!audioAnalyser) return

  const waveform = audioAnalyser.getValue()

  // calculate loudness
  let sum = 0
  for (let i = 0; i < waveform.length; i++) {
    sum += waveform[i] * waveform[i]
  }
  let rms = Math.sqrt(sum / waveform.length)

  // smooth it out
  currentIntensity = lerp(currentIntensity, rms * 5, 0.15)
}

// play music
async function playMusic() {
  if (!midi || isPlaying) return

  try {
    if (Tone.context.state !== "running") {
      await Tone.start()
    }

    // clear old synths
    synths.forEach((synth) => synth.dispose())
    synths = []

    const now = Tone.now() + 0.1

    // make synths for each track
    midi.tracks.forEach((track) => {
      if (track.notes && track.notes.length > 0) {
        const synth = new Tone.PolySynth(Tone.Synth, {
          envelope: {
            attack: 0.02,
            decay: 0.1,
            sustain: 0.3,
            release: 1,
          },
          volume: -6,
        })

        synth.connect(audioAnalyser)
        synth.toDestination()

        synths.push(synth)

        // schedule notes
        track.notes.forEach((note) => {
          const duration = Math.max(0.01, note.duration || 0)
          synth.triggerAttackRelease(
            note.name,
            duration,
            note.time + now,
            note.velocity,
          )
        })
      }
    })

    isPlaying = true
  } catch (error) {
    console.error("play failed", error)
  }
}

// stop music
function stopMusic() {
  if (!isPlaying) return

  synths.forEach((synth) => synth.dispose())
  synths = []
  isPlaying = false
  currentIntensity = 0
}

// next song
async function nextSong() {
  stopMusic()
  currentMidiIndex = (currentMidiIndex + 1) % midiFiles.length
  await loadMidiFile(midiFiles[currentMidiIndex])
  updateSongDisplay()
}

// previous song
async function prevSong() {
  stopMusic()
  currentMidiIndex =
    (currentMidiIndex - 1 + midiFiles.length) % midiFiles.length
  await loadMidiFile(midiFiles[currentMidiIndex])
  updateSongDisplay()
}

// update song name
function updateSongDisplay() {
  const songName = midiFiles[currentMidiIndex].replace(".json", "")
  select("#songDisplay").html(
    `Now playing <strong>${songName}</strong><br>Tempo ${Math.floor(
      currentTempo,
    )} BPM`,
  )
}

// make UI buttons
function createUIControls() {
  const uiContainer = createDiv("")
  uiContainer.position(20, 20)
  uiContainer.style("color", "white")
  uiContainer.style("font-family", "Arial, sans-serif")
  uiContainer.style("background", "rgba(0,0,0,0.7)")
  uiContainer.style("padding", "15px")
  uiContainer.style("border-radius", "10px")
  uiContainer.style("z-index", "1000")

  const title = createP("Vaporwave Visualizer")
  title.parent(uiContainer)
  title.style("margin", "0 0 10px 0")
  title.style("font-weight", "bold")

  const songDisplay = createP("")
  songDisplay.id("songDisplay")
  songDisplay.parent(uiContainer)
  songDisplay.style("margin", "0 0 10px 0")

  const buttonContainer = createDiv("")
  buttonContainer.parent(uiContainer)
  buttonContainer.style("display", "flex")
  buttonContainer.style("gap", "10px")

  const prevBtn = createButton("⏮ Prev")
  prevBtn.parent(buttonContainer)
  prevBtn.mousePressed(prevSong)
  styleButton(prevBtn)

  const playBtn = createButton("▶ Play")
  playBtn.parent(buttonContainer)
  playBtn.mousePressed(() => {
    if (isPlaying) {
      stopMusic()
      playBtn.html("▶ Play")
    } else {
      playMusic()
      playBtn.html("⏸ Pause")
    }
  })
  styleButton(playBtn)

  const nextBtn = createButton("Next ⏭")
  nextBtn.parent(buttonContainer)
  nextBtn.mousePressed(nextSong)
  styleButton(nextBtn)

  updateSongDisplay()
}

// style buttons
function styleButton(button) {
  button.style("background", "#333")
  button.style("color", "white")
  button.style("border", "none")
  button.style("padding", "8px 12px")
  button.style("border-radius", "5px")
  button.style("cursor", "pointer")
}

// resize window
function windowResized() {
  calculateScaleFactor()

  let canvasElement = document.querySelector("canvas")
  if (canvasElement) {
    canvasElement.style.width = windowWidth + "px"
    canvasElement.style.height = canvasHeight * scaleFactor + "px"
  }
}
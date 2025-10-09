// Vaporwave Visualizer
// layers
let backgroundLayer // gradient and sun
let foregroundLayer // 3D, wireframe mountains

// fixed canvas size
const canvasWidth = 1080
const canvasHeight = 720

// wireframe ground
const gridWidth = canvasWidth
const gridHeight = canvasHeight * 2
const gridScale = 40
const columns = Math.floor(gridWidth / gridScale)
const rows = Math.floor(gridHeight / gridScale)

// road and mountain  boundaries
const roadWidthRatio = 0.15
const firstMountainRangeRatio = 0.35

let vertices = []
const noiseScale = 0.15
const noiseOffsetSpeed = 0.007
let noiseOffset = 0

// terrain scrolling animation
// terrainScrollDuration time (seconds) for ground to scroll one grid square (40 units)
const terrainScrollDuration = 1.052
let terrainScrollOffset = 0

// scaling the whole thing
let scaleFactor = 1

// music tone.js variables
let midi = null
let synths = []
let isPlaying = false
let audioAnalyser = null
let currentIntensity = 0
let currentTempo = 120


const midiFiles = [
  "Initial D - Rage Your Dream.json",
  "MGMT - Kids.json",
  "daft_punk-giorgio_by_moroder.json",
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
let currentMidiIndex = 0;

// colors
let pink, cyan, green

function setup() {
  createCanvas(canvasWidth, canvasHeight)

  pixelDensity(Math.floor(1 + Math.max(windowWidth, windowHeight) / canvasWidth))

  // figure out how much to tretch
  calculateScaleFactor()

  // two separate drawing areas (remove this or add background layer  code in here)
  backgroundLayer = createGraphics(canvasWidth, canvasHeight)
  foregroundLayer = createGraphics(canvasWidth, canvasHeight, WEBGL)

  // make all the little dots for terrain
  vertices = createVertices(columns, rows, gridScale)

  // define sick color palette
  pink = color(255, 0, 255)
  cyan = color(0, 255, 255)
  green = color(0, 255, 0)
  sunColor1 = color(255, 100, 150)
  sunColor2 = color(255, 200, 50)

  // draw the background here 
  drawVaporwaveBackground(
    backgroundLayer,
    canvasWidth,
    canvasHeight,
  )

  // setup music player
  setupAudioContext()

  // make play/pause/next song buttons
  createUIControls()

  // apply initial scaling
  let canvasElement = document.querySelector("canvas")
  if (canvasElement) {
    canvasElement.style.width = windowWidth + "px"
    canvasElement.style.height = canvasHeight * scaleFactor + "px"
  }
}

function calculateScaleFactor() {
  scaleFactor = windowWidth / canvasWidth
}

// helper functions for bumpy terrain
const mapNoise = (value, min, max) =>
  (max - min) * Math.sin(value * value * Math.PI) + min

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
  // if music playing, update visualizer
  if (isPlaying && audioAnalyser) {
    updateAudioAnalysis()
  }

  // clear main canvas
  clear()

  // put background on main canvas
  image(backgroundLayer, 0, 0)

  // draw 3D wireframe onto its own layer
  drawWireframeLandscape()

  // put 3D layer on top of background
  image(foregroundLayer, 0, 0)

  // make bumps move
  noiseOffset -= noiseOffsetSpeed

  // make terrain scroll forward
  terrainScrollOffset += gridScale / (terrainScrollDuration * 60)
  if (terrainScrollOffset >= gridScale) {
    terrainScrollOffset -= gridScale // loop seamlessly
  }
}

// cool wireframe mountains and road
function drawWireframeLandscape() {
  foregroundLayer.clear()
  foregroundLayer.push()

  foregroundLayer.translate(0, 10, -1400)
  foregroundLayer.rotateX(PI / 2.006)
  foregroundLayer.translate(-gridWidth / 2, gridHeight / 2 - 150)

  // make colors pulse
  let time = frameCount * 0.05
  let mountainMix = (sin(time) + 1) / 2

  foregroundLayer.strokeWeight(1)
  foregroundLayer.noFill()

  // base amplitude
  const baseAmplitude = 25
  // bounce with music
  const audioMultiplier = 1 + currentIntensity * 2.5
  const amplitude = baseAmplitude * audioMultiplier

  // draw terrain using triangle strips
  for (let y = 0; y < rows - 1; y++) {
    foregroundLayer.beginShape(TRIANGLE_STRIP)

    for (let x = 0; x < columns; x++) {
      // road or mountains
      let distFromCenter = abs(x - columns / 2) / (columns / 2)

      // calculate colors
      let strokeColor = lerpColor(cyan, pink, mountainMix)

      foregroundLayer.stroke(strokeColor)
      foregroundLayer.strokeWeight(0.5)
      foregroundLayer.fill(0)

      const currentIndex = y * columns + x
      const nextIndex = (y + 1) * columns + x

      // get x,y positions
      let [x1, y1] = vertices[currentIndex]
      let [x2, y2] = vertices[nextIndex]

      // add scroll offset and loop seamlessly
      let scrolledY1 = (y1 + terrainScrollOffset) % gridHeight
      let scrolledY2 = (y2 + terrainScrollOffset) % gridHeight

      // sample noise based on scrolled position for smooth movement
      let xnoise = (x * gridScale) * noiseScale / gridScale
      let ynoise1 =
        (scrolledY1 + noiseOffset * gridScale / noiseScale) * noiseScale /
        gridScale
      let ynoise2 =
        (scrolledY2 + noiseOffset * gridScale / noiseScale) * noiseScale /
        gridScale

      // get terrain height with music and mountains
      let z1 = getTerrainHeight(xnoise, ynoise1, distFromCenter, amplitude)
      let z2 = getTerrainHeight(xnoise, ynoise2, distFromCenter, amplitude)

      foregroundLayer.vertex(x1, scrolledY1, z1)
      foregroundLayer.vertex(x2, scrolledY2, z2)
    }

    foregroundLayer.endShape()
  }

  foregroundLayer.pop()
}

// calculate terrain height with noise and music and mountains
function getTerrainHeight(xnoise, ynoise, distFromCenter, amplitude) {
  // basic terrain bumps (Perlin noise)
  let baseHeight = map(noise(xnoise, ynoise), 0, 1, -amplitude, amplitude)

  // add more detail for roughness
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
    let rangePos = map(distFromCenter, roadWidthRatio, firstMountainRangeRatio, 0, 1)
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

// making it actually play sounds
async function setupAudioContext() {
  try {
    audioAnalyser = new Tone.Analyser("waveform", 256) // watches the sound
    await loadMidiFile(midiFiles[currentMidiIndex])
  } catch (error) {
    console.error("oops, audio setup messed up error", error)
  }
}

async function loadMidiFile(filename) {
  try {
    const response = await fetch(`assets/MIDI/${filename}`)
    const midiData = await response.json()
    midi = midiData

    if (midi.header.tempos && midi.header.tempos.length > 0) {
      currentTempo = midi.header.tempos[0].bpm || 120
    }

    console.log(`yo, loaded ${filename}, tempo ${currentTempo}`)
  } catch (error) {
    console.error("Error loading MIDI file error", error)
  }
}

function updateAudioAnalysis() {
  if (!audioAnalyser) return

  const waveform = audioAnalyser.getValue()

  // calculate RMS
  let sum = 0
  for (let i = 0; i < waveform.length; i++) {
    sum += waveform[i] * waveform[i]
  }
  let rms = Math.sqrt(sum / waveform.length)

  // smooth intensity to not get choppy movments
  currentIntensity = lerp(currentIntensity, rms * 5, 0.15)
}

async function playMusic() {
  if (!midi || isPlaying) return

  try {
    if (Tone.context.state !== "running") {
      await Tone.start()
    }

    // get rid of old synths
    synths.forEach((synth) => synth.dispose())
    synths = []

    const now = Tone.now() + 0.1

    // create synths for each track
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
    console.error("error playing music error", error)
  }
}

function stopMusic() {
  if (!isPlaying) return

  synths.forEach((synth) => synth.dispose())
  synths = []
  isPlaying = false
  currentIntensity = 0
}

async function nextSong() {
  stopMusic()
  currentMidiIndex = (currentMidiIndex + 1) % midiFiles.length
  await loadMidiFile(midiFiles[currentMidiIndex])
  updateSongDisplay()
}

async function prevSong() {
  stopMusic()
  currentMidiIndex =
    (currentMidiIndex - 1 + midiFiles.length) % midiFiles.length
  await loadMidiFile(midiFiles[currentMidiIndex])
  updateSongDisplay()
}

function updateSongDisplay() {
  const songName = midiFiles[currentMidiIndex].replace(".json", "")
  select("#songDisplay").html(
    `Now playing <strong>${songName}</strong><br>Tempo ${Math.floor(
      currentTempo,
    )} BPM`,
  )
}

// buttons and stuff
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

function styleButton(button) {
  button.style("background", "#333")
  button.style("color", "white")
  button.style("border", "none")
  button.style("padding", "8px 12px")
  button.style("border-radius", "5px")
  button.style("cursor", "pointer")
}

// looks good on any screen
function windowResized() {
 
  calculateScaleFactor()

  // scale canvas to fit window
  let canvasElement = document.querySelector("canvas")
  if (canvasElement) {
    canvasElement.style.width = windowWidth + "px"
    canvasElement.style.height = canvasHeight * scaleFactor + "px"
  }
}
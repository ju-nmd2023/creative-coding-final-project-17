
function drawVaporwaveSun(layer, x, y, size) {
  layer.push()
  layer.colorMode(HSB)
  layer.noStroke()
  // layer.rectMode(CENTER)  
  // big radial gradient background
  let bgGradient = layer.drawingContext.createRadialGradient(x, y, 0, x, y, size * 3)
  
  bgGradient.addColorStop(0, 'rgba(100, 50, 1, 1)') // purple magenta thing
  bgGradient.addColorStop(0.1, 'rgba(10, 10, 40, 1)') // dark blue
  bgGradient.addColorStop(0.4, 'rgba(5, 5, 25, 1)') // black
  bgGradient.addColorStop(0.8, 'rgba(0, 0, 0, 1)') // black
  
  layer.drawingContext.fillStyle = bgGradient
  layer.ellipse(x, y - 600, size * 6, size * 6) 
  
  // sun gradient
  // gradient tutorial from https://www.youtube.com/watch?v=-MUOweQ6wac&t=171s
  let sunGradient = layer.drawingContext.createLinearGradient(
    x, y - size/2,  // top
    x, y + size/2   // bottom
  )
  
  sunGradient.addColorStop(0.5, layer.color(340, 80, 100,0.9))
  sunGradient.addColorStop(0.75, layer.color(50, 100, 100,0.95))
  sunGradient.addColorStop(1, layer.color(30, 100, 100,1))
  

  layer.drawingContext.fillStyle = sunGradient
  layer.ellipse(x, y, size/1.33, size/1.33)
  
  // stripes on sun
  let stripeGradient = layer.drawingContext.createLinearGradient(
    x, y - size/2.66,  
    x, y + size/2.66   
  )
  
  // stripe settings
  let numStripes = 4
  let initialStripeSize = 0.005
  let gapSize = 0.1
  
  // top half is see through
  stripeGradient.addColorStop(0.0, 'rgba(0, 0, 0, 0)')
  stripeGradient.addColorStop(0.555, 'rgba(0, 0, 0, 0)')
  
  // draw stripes from center down, each one twice as thick
  let currentPosition = 0.555
  
  for (let i = 0; i < numStripes; i++) {
    let stripeThickness = initialStripeSize * Math.pow(2, i)
    
    stripeGradient.addColorStop(currentPosition, 'rgba(10, 10, 40, 0)')
    
    let stripeEnd = Math.min(currentPosition + stripeThickness, 1)
    stripeGradient.addColorStop(stripeEnd, 'rgba(10, 10, 40, 1)')
    
    // add gap if not last stripe
    if (i < numStripes - 1 && stripeEnd < 1.0) {
      stripeGradient.addColorStop(stripeEnd + 0.01, 'rgba(0, 0, 0, 0)')
      currentPosition = stripeEnd + gapSize
      stripeGradient.addColorStop(currentPosition, 'rgba(0, 0, 0, 0)')
    }
  }
  
  layer.drawingContext.fillStyle = stripeGradient
  layer.ellipse(x, y, size/1.33, size/1.33)
  
let circleRing = layer.drawingContext.createRadialGradient(x, y, 0, x, y, size * 3)

circleRing.addColorStop(0, 'rgba(0, 0, 0, 0)')
circleRing.addColorStop(0.1, 'rgba(0, 0, 0, 0)')
circleRing.addColorStop(0.12, 'rgba(10, 10, 40, 0.01)') // dark blue
circleRing.addColorStop(0.125, 'rgba(10, 10, 40, 1)') // dark blue


layer.drawingContext.fillStyle = circleRing
layer.ellipse(x, y, size/1.3, size/1.3)

  
  // overlay gradient thing
  let canvasWidth = layer.width
  let canvasHeight = layer.height
  

  
  let overlayGradient = layer.drawingContext.createLinearGradient(
    0, 0,           // top
    0, canvasHeight // bottom
  )
  
  // overlayGradient.addColorStop(0.1, 'rgba(0, 0, 0, 0)')
  overlayGradient.addColorStop(0.4, 'rgba(255, 52, 128, 0)')
  overlayGradient.addColorStop(0.55, 'rgba(0, 0, 0, 1)')

  

  
  layer.drawingContext.fillStyle = overlayGradient
  layer.rect(0, 0, canvasWidth, canvasHeight)

  layer.pop()
}

// test sketch stuff
function setup() {
  createCanvas(windowWidth, windowHeight)
  noStroke()
  // colorMode(RGB)
  background()
}


function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  colorMode(HSB);
  background(0);
}

function draw() {
   
    fill(255, 204, 0); // yellow color
    //ellipse(width / 2, height / 2, 200, 200); }
    

    //citation, tutorial for gradient cited from this link https://www.youtube.com/watch?v=-MUOweQ6wac&t=171s 
    let gradient = drawingContext.createLinearGradient(
        width/2-200, height/2-200, width/2+200, height/2+200);
        
        
      gradient.addColorStop(0.5, color(340, 80, 100));  
  gradient.addColorStop(1, color(50, 100, 100)); 
  gradient.addColorStop(1, color(30, 100, 100, 0)); 
        
        
        drawingContext.fillStyle=gradient;
        ellipse(width/2,height/2,400,400,50);}
        
        linearGradient (

    width/2, height/2, 0,
    width/2, height/2,350,
    color(310,100,100,100),
    color(250,100,100,100)
);
ellipse(width/2,height/2,400,400);


function linearGradient(sX,sY,eX,colorS,colorE) {

    let gradient = drawingContext.createLinearGradient(sX,sY,eX,eY);
    gradient.addColorStop(0, colorS);
  gradient.addColorStop(1, colorE);
  drawingContext.fillStyle = gradient;
  // drawingContext.strokeStyle = gradient;

}
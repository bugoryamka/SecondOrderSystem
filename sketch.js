// sketch.js
let system;
let targetPosition;
let currentPosition;
let movementSpeed = 200;
let fSlider, zSlider, rSlider; // Sliders for parameters
let targetHistory = []; // Stores the history of the red ball (target position)
let currentHistory = []; // Stores the history of the blue ball (current position)

function setup() {
  const canvas = createCanvas(800, 600);
  canvas.parent('sketch');

  // Get slider elements
  fSlider = document.getElementById('fSlider');
  zSlider = document.getElementById('zSlider');
  rSlider = document.getElementById('rSlider');

  // Initialize the second-order system with slider values
  let initialPosition = createVector(width / 2, height / 2);
  system = new SecondOrderDynamics(
    parseFloat(fSlider.value),
    parseFloat(zSlider.value),
    parseFloat(rSlider.value),
    initialPosition
  );

  // Initialize target and current positions
  targetPosition = initialPosition.copy();
  currentPosition = initialPosition.copy();

  // Add event listeners to sliders
  fSlider.addEventListener('input', () => {
    document.getElementById('fValue').textContent = fSlider.value;
  });

  zSlider.addEventListener('input', () => {
    document.getElementById('zValue').textContent = zSlider.value;
  });

  rSlider.addEventListener('input', () => {
    document.getElementById('rValue').textContent = rSlider.value;
  });
}

function draw() {
  background(240);

  // Update the system parameters if sliders are changed
  system.setParameters(parseFloat(fSlider.value), parseFloat(zSlider.value), parseFloat(rSlider.value));

  // Update the system with the target position
  currentPosition = system.update(deltaTime / 1000, targetPosition);

  // Add the current and target positions to their histories
  targetHistory.push(targetPosition.copy());
  currentHistory.push(currentPosition.copy());
  if (targetHistory.length > 200) {
    targetHistory.splice(0, 1); // Keep the history length fixed
    currentHistory.splice(0, 1);
  }

  // Draw the target position (red circle)
  fill(234, 67, 53); // Google red
  noStroke();
  ellipse(targetPosition.x, targetPosition.y, 20, 20);

  // Draw the current position (blue circle)
  fill(66, 133, 244); // Google blue
  noStroke();
  ellipse(currentPosition.x, currentPosition.y, 30, 30);

  // Handle WASD input to update the target position
  handleWASDInput();

  // Draw the x, y graph in the right visualization box
  drawGraph();
}

function handleWASDInput() {
  // Get input from the keyboard
  let moveX = 0;
  let moveY = 0;

  if (keyIsDown(87)) { // W key (up)
    moveY -= 1;
  }
  if (keyIsDown(83)) { // S key (down)
    moveY += 1;
  }
  if (keyIsDown(65)) { // A key (left)
    moveX -= 1;
  }
  if (keyIsDown(68)) { // D key (right)
    moveX += 1;
  }

  // Normalize the movement vector to ensure consistent speed in all directions
  let movement = createVector(moveX, moveY).normalize().mult(movementSpeed * deltaTime / 1000);

  // Update the target position based on input
  targetPosition.add(movement);
}

function drawGraph() {
  // Draw the visualization box on the right
  let graphWidth = 250; // Decreased size
  let graphHeight = 150; // Decreased size
  let graphX = width - graphWidth - 100; // Shifted 100 pixels to the left
  let graphY = height - graphHeight - 20;

  // Draw the graph background with rounded corners
  fill(255);
  noStroke(); // Remove the black frame
  rect(graphX, graphY, graphWidth, graphHeight, 12); // Rounded corners with radius 12

  // Draw the x, y history of the red ball (target position)
  noFill();
  stroke(234, 67, 53); // Google red
  strokeWeight(2);
  beginShape();
  for (let i = 0; i < targetHistory.length; i++) {
    let x = map(i, 0, targetHistory.length, graphX, graphX + graphWidth);
    let y = map(targetHistory[i].y, 0, height, graphY + graphHeight, graphY);
    vertex(x, y);
  }
  endShape();

  // Draw the x, y history of the blue ball (current position)
  noFill();
  stroke(66, 133, 244); // Google blue
  strokeWeight(2);
  beginShape();
  for (let i = 0; i < currentHistory.length; i++) {
    let x = map(i, 0, currentHistory.length, graphX, graphX + graphWidth);
    let y = map(currentHistory[i].y, 0, height, graphY + graphHeight, graphY);
    vertex(x, y);
  }
  endShape();
}

class SecondOrderDynamics {
  constructor(f, z, r, x0) {
    // Store parameters
    this.f = f;
    this.z = z;
    this.r = r;
    this.x0 = x0.copy();

    // Initialize state variables
    this.xp = x0.copy(); // Previous input
    this.y = x0.copy();  // Current position
    this.yd = createVector(0, 0); // Current velocity

    // Compute dynamics constants (handle edge cases)
    this.computeConstants();
  }

  computeConstants() {
    if (this.f === 0) {
      // If frequency is zero, the system does not respond
      this.k1 = 0;
      this.k2 = 0;
      this.k3 = 0;
    } else {
      // Compute dynamics constants
      this.k1 = this.z / (PI * this.f);
      this.k2 = 1 / ((2 * PI * this.f) * (2 * PI * this.f));
      this.k3 = (this.r * this.z) / (2 * PI * this.f);
    }
  }

  update(T, x, xd = null) {
    if (this.f === 0) {
      // If frequency is zero, the system remains at its initial position
      this.y = this.x0.copy();
      return this.y.copy();
    }

    // Estimate velocity if not provided
    if (xd === null) {
      xd = p5.Vector.sub(x, this.xp).div(T);
    }
    this.xp = x.copy();

    // Integrate position by velocity
    this.y.add(p5.Vector.mult(this.yd, T));

    // Integrate velocity by acceleration
    let acceleration = p5.Vector.sub(x, this.y)
      .add(p5.Vector.mult(xd, this.k3))
      .sub(p5.Vector.mult(this.yd, this.k1))
      .div(this.k2);
    this.yd.add(p5.Vector.mult(acceleration, T));

    return this.y.copy();
  }

  setParameters(f, z, r) {
    // Update parameters and recompute constants
    this.f = f;
    this.z = z;
    this.r = r;
    this.computeConstants();
  }
}
let system;
let targetPosition;
let currentPosition;
let fSlider, zSlider, rSlider; // Sliders for parameters
let targetHistory = []; // Stores the history of the red ball (target position)
let currentHistory = []; // Stores the history of the blue ball (current position)
let isMobile = false; // Flag to check if the site is accessed from a mobile device
let permissionGranted = false; // Flag to check if gyroscope access is granted

function setup() {
  const canvas = createCanvas(800, 600);
  canvas.parent('sketch');

  // Check if the site is accessed from a mobile device
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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

  // Add touch event listeners for mobile devices
  if (isMobile) {
    canvas.elt.addEventListener('touchstart', handleTouch);
    canvas.elt.addEventListener('touchmove', handleTouch);
  }

  // Add gyroscope event listener for mobile devices
  if (isMobile && window.DeviceOrientationEvent) {
    requestGyroscopePermission();
  }
}

function requestGyroscopePermission() {
  if (typeof(DeviceOrientationEvent) !== 'undefined' && typeof(DeviceOrientationEvent.requestPermission) === 'function') {
    // iOS 13+ device
    DeviceOrientationEvent.requestPermission()
      .catch(() => {
        // Show permission dialog the first time
        showPermissionButton();
      })
      .then(() => {
        // Permission granted on subsequent visits
        permissionGranted = true;
      });
  } else {
    // Non-iOS 13 device
    permissionGranted = true;
  }
}

function showPermissionButton() {
  // Create a button to request gyroscope access
  let button = createButton("Click to Allow Access to Sensors");
  button.style("font-size", "24px");
  button.center();
  button.mousePressed(() => {
    DeviceOrientationEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          permissionGranted = true;
          button.remove(); // Remove the button after permission is granted
        } else {
          permissionGranted = false;
        }
      })
      .catch(console.error);
  });
}

function draw() {
  background(240);

  // Update the system parameters if sliders are changed
  system.setParameters(parseFloat(fSlider.value), parseFloat(zSlider.value), parseFloat(rSlider.value));

  // Update the target position based on input (mouse, touch, or gyroscope)
  if (isMobile) {
    if (permissionGranted) {
      updateTargetPositionWithGyroscope();
    }
  } else {
    updateTargetPositionWithMouse();
  }

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

  // Draw the x, y graph in the right visualization box
  drawGraph();
}

function updateTargetPositionWithMouse() {
  // Set the target position to the mouse position
  targetPosition.set(mouseX, mouseY);

  // Constrain the target position to stay within the canvas
  targetPosition.x = constrain(targetPosition.x, 0, width);
  targetPosition.y = constrain(targetPosition.y, 0, height);
}

function handleTouch(event) {
  // Prevent default touch behavior (e.g., scrolling)
  event.preventDefault();

  // Get the first touch point
  let touch = event.touches[0];

  // Update the target position based on touch coordinates
  targetPosition.set(touch.clientX, touch.clientY);

  // Constrain the target position to stay within the canvas
  targetPosition.x = constrain(targetPosition.x, 0, width);
  targetPosition.y = constrain(targetPosition.y, 0, height);
}

function updateTargetPositionWithGyroscope() {
  // Use gyroscope data (rotationX and rotationY) to control the target position
  let gamma = rotationY; // Left/right tilt (range: -90 to 90)
  let beta = rotationX;  // Front/back tilt (range: -180 to 180)

  // Map the tilt values to the canvas dimensions
  let x = map(gamma, -90, 90, 0, width);
  let y = map(beta, -180, 180, 0, height);

  // Update the target position
  targetPosition.set(x, y);

  // Constrain the target position to stay within the canvas
  targetPosition.x = constrain(targetPosition.x, 0, width);
  targetPosition.y = constrain(targetPosition.y, 0, height);
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

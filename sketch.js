let system;
let targetPosition;
let currentPosition;
let fSlider, zSlider, rSlider;
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

function setup() {
  let canvasWidth = isMobile ? windowWidth : 800;
  let canvasHeight = isMobile ? windowHeight * 0.7 : 600; // 70% of window height for mobile
  const canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('sketch');

  // Get slider elements
  fSlider = document.getElementById('fSlider');
  zSlider = document.getElementById('zSlider');
  rSlider = document.getElementById('rSlider');

  // Initialize the second-order system
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

  // Add gyroscope event listener for mobile devices
  if (isMobile && window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', handleDeviceOrientation);
  }
}

function draw() {
  background(240);

  // Update the system parameters if sliders are changed
  system.setParameters(parseFloat(fSlider.value), parseFloat(zSlider.value), parseFloat(rSlider.value));

  // Update the system with the target position
  currentPosition = system.update(deltaTime / 1000, targetPosition);

  // Draw the target position (red circle)
  fill(234, 67, 53);
  noStroke();
  ellipse(targetPosition.x, targetPosition.y, 20, 20);

  // Draw the current position (blue circle)
  fill(66, 133, 244);
  noStroke();
  ellipse(currentPosition.x, currentPosition.y, 30, 30);
}

function handleDeviceOrientation(event) {
  // Use the gamma (left/right tilt) and beta (front/back tilt) values to control the target position
  let gamma = event.gamma; // Left/right tilt (range: -90 to 90)
  let beta = event.beta;   // Front/back tilt (range: -180 to 180)

  // Map the tilt values to the canvas dimensions
  let x = map(gamma, -90, 90, 0, width);
  let y = map(beta, -180, 180, 0, height);

  // Update the target position
  targetPosition.set(x, y);

  // Constrain the target position to stay within the canvas
  targetPosition.x = constrain(targetPosition.x, 0, width);
  targetPosition.y = constrain(targetPosition.y, 0, height);
}

class SecondOrderDynamics {
  constructor(f, z, r, x0) {
    this.f = f;
    this.z = z;
    this.r = r;
    this.x0 = x0.copy();
    this.xp = x0.copy();
    this.y = x0.copy();
    this.yd = createVector(0, 0);
    this.computeConstants();
  }

  computeConstants() {
    if (this.f === 0) {
      this.k1 = 0;
      this.k2 = 0;
      this.k3 = 0;
    } else {
      this.k1 = this.z / (PI * this.f);
      this.k2 = 1 / ((2 * PI * this.f) * (2 * PI * this.f));
      this.k3 = (this.r * this.z) / (2 * PI * this.f);
    }
  }

  update(T, x, xd = null) {
    if (this.f === 0) {
      this.y = this.x0.copy();
      return this.y.copy();
    }

    if (xd === null) {
      xd = p5.Vector.sub(x, this.xp).div(T);
    }
    this.xp = x.copy();

    this.y.add(p5.Vector.mult(this.yd, T));

    let acceleration = p5.Vector.sub(x, this.y)
      .add(p5.Vector.mult(xd, this.k3))
      .sub(p5.Vector.mult(this.yd, this.k1))
      .div(this.k2);
    this.yd.add(p5.Vector.mult(acceleration, T));

    return this.y.copy();
  }

  setParameters(f, z, r) {
    this.f = f;
    this.z = z;
    this.r = r;
    this.computeConstants();
  }
}

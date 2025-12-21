// Dino Game - Main Game Logic

// Mobile device detection
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.matchMedia && window.matchMedia('(max-width: 768px)').matches && 'ontouchstart' in window);
}

// Check for mobile and show appropriate content
if (isMobileDevice()) {
  document.getElementById('mobileMessage').style.display = 'block';
  document.getElementById('gameContent').style.display = 'none';
  throw new Error('Mobile device detected - game not loaded');
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const gameOverElement = document.getElementById('gameOver');
const birdScoreElement = document.getElementById('birdScore');

// Delta time variables for frame-rate independent movement
const TARGET_FPS = 60;
const TARGET_FRAME_TIME = 1000 / TARGET_FPS; // ~16.67ms
let lastTime = 0;
let deltaTime = 0;
let gameTime = 0; // Total game time in milliseconds

// Game variables
let gameStarted = false;
let gameOver = false;
let gameMode = 'classic'; // 'classic' or 'shooting'
let score = 0;
let distance = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;
let highScoreShooting = localStorage.getItem('dinoHighScoreShooting') || 0;
highScoreElement.textContent = highScore;
let gameSpeed = 480; // pixels per second (was 6 per frame * 60 fps)
let nightProgress = 0; // 0 = day, 1 = night (gradual transition)

// Timing variables (in milliseconds)
let lastSpeedIncreaseTime = 0;
let nextObstacleTime = 0;
const OBSTACLE_SPAWN_MIN = 833; // ~50 frames at 60fps
const OBSTACLE_SPAWN_MAX = 1667; // ~100 frames at 60fps
const SPEED_INCREASE_INTERVAL = 1000; // Increase speed every second

// Shooting mode variables
let birdsKilled = 0;
let bullets = [];
let explosions = [];
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;
let lastShotTime = 0;
const shootCooldown = 300; // 0.3 seconds in milliseconds

// Dino properties (converted to per-second values)
const dino = {
  x: 50,
  y: 135,
  width: 45,
  height: 45,
  normalHeight: 45,
  duckHeight: 27,
  velocityY: 0,
  gravity: 2160, // pixels per second squared (was 0.6 * 60 * 60)
  fastFallGravity: 5400, // pixels per second squared (was 1.5 * 60 * 60)
  jumpPower: -730, // pixels per second (was -13 * 60)
  isJumping: false,
  isDucking: false,
  isFastFalling: false,
  moveSpeed: 300, // pixels per second (was 5 * 60)
  minX: 10,
  maxX: 750
};

// Ground
const ground = {
  y: 180,
  height: 20
};

// Obstacles array
let obstacles = [];

// Colors for day/night
const colors = {
  day: {
    bg: '#f7f7f7',
    ground: '#535353',
    dino: '#535353',
    obstacle: '#535353',
    text: '#535353'
  },
  night: {
    bg: '#000000',
    ground: '#525252',
    dino: '#525252',
    obstacle: '#525252',
    text: '#ffffff'
  }
};

// Interpolate between two hex colors
function lerpColor(color1, color2, t) {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);
  const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
  const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Get current theme colors (interpolated based on nightProgress)
function getColors() {
  return {
    bg: lerpColor(colors.day.bg, colors.night.bg, nightProgress),
    ground: lerpColor(colors.day.ground, colors.night.ground, nightProgress),
    dino: lerpColor(colors.day.dino, colors.night.dino, nightProgress),
    obstacle: lerpColor(colors.day.obstacle, colors.night.obstacle, nightProgress),
    text: lerpColor(colors.day.text, colors.night.text, nightProgress)
  };
}

// Create obstacle (cactus or bird)
function createObstacle() {
  const rand = Math.random();
  const type = rand > 0.5 ? 'cactus' : 'bird';

  if (type === 'cactus') {
    const size = Math.random() > 0.5 ? 'small' : 'large';
    obstacles.push({
      type: 'cactus',
      x: canvas.width,
      y: ground.y - (size === 'small' ? 40 : 50),
      width: size === 'small' ? 17 : 25,
      height: size === 'small' ? 40 : 50,
      size: size
    });
  } else {
    // Bird flies at different heights (high or low)
    const height = Math.random() > 0.5 ? 120 : 80;
    obstacles.push({
      type: 'bird',
      x: canvas.width,
      y: height,
      width: 45,
      height: 35,
      wingUp: false
    });
  }

  // Calculate next obstacle spawn time (random interval, scaled by game speed)
  const baseInterval = Math.random() * (OBSTACLE_SPAWN_MAX - OBSTACLE_SPAWN_MIN) + OBSTACLE_SPAWN_MIN;
  // Reduce spawn interval as game speeds up (but not too much)
  const speedFactor = 360 / gameSpeed;
  nextObstacleTime = gameTime + baseInterval * Math.max(0.5, speedFactor);
}

// Draw dino - pixel art style
function drawDino() {
  const theme = getColors();
  const eyeColor = nightProgress > 0.5 ? '#000' : '#fff';
  const px = 3; // pixel size for scaling

  const currentY = dino.isDucking && !dino.isJumping ? ground.y - dino.duckHeight : dino.y;
  const isOnGround = currentY >= ground.y - (dino.isDucking ? dino.duckHeight : dino.normalHeight) - 1;

  // Animation frame for running (time-based, ~8 frames per second)
  const animInterval = Math.max(60, 150 - gameSpeed / 6); // ms per frame
  const runFrame = Math.floor(gameTime / animInterval) % 2;

  // Helper to draw a pixel
  function pixel(x, y, color) {
    ctx.fillStyle = color || theme.dino;
    ctx.fillRect(dino.x + x * px, currentY + y * px, px, px);
  }

  if (dino.isDucking) {
    // Ducking dino - wider and shorter
    // Tail (extended back when ducking)
    pixel(-4, 4, theme.dino);
    pixel(-3, 4, theme.dino);
    pixel(-2, 3, theme.dino);
    pixel(-1, 3, theme.dino);

    // Body (horizontal elongated)
    for (let x = 0; x <= 12; x++) {
      for (let y = 2; y <= 6; y++) {
        pixel(x, y, theme.dino);
      }
    }

    // Head (front, lower)
    for (let x = 10; x <= 14; x++) {
      for (let y = 1; y <= 5; y++) {
        pixel(x, y, theme.dino);
      }
    }

    // Eye
    pixel(12, 2, eyeColor);

    // Mouth gap
    pixel(14, 4, eyeColor);
    pixel(14, 5, eyeColor);

    // Legs (short when ducking)
    if (isOnGround && gameStarted && !gameOver) {
      if (runFrame === 0) {
        pixel(3, 7, theme.dino);
        pixel(3, 8, theme.dino);
        pixel(9, 7, theme.dino);
      } else {
        pixel(3, 7, theme.dino);
        pixel(9, 7, theme.dino);
        pixel(9, 8, theme.dino);
      }
    } else {
      pixel(3, 7, theme.dino);
      pixel(9, 7, theme.dino);
    }
  } else {
    // Standing/jumping dino - T-Rex shape

    // Tail (3 segments going back and down)
    pixel(-3, 6, theme.dino);
    pixel(-2, 5, theme.dino);
    pixel(-2, 6, theme.dino);
    pixel(-1, 4, theme.dino);
    pixel(-1, 5, theme.dino);

    // Body (main torso)
    for (let x = 0; x <= 7; x++) {
      for (let y = 3; y <= 10; y++) {
        pixel(x, y, theme.dino);
      }
    }

    // Neck
    for (let x = 6; x <= 8; x++) {
      for (let y = 1; y <= 4; y++) {
        pixel(x, y, theme.dino);
      }
    }

    // Head
    for (let x = 7; x <= 13; x++) {
      for (let y = 0; y <= 5; y++) {
        pixel(x, y, theme.dino);
      }
    }

    // Eye
    pixel(11, 1, eyeColor);

    // Mouth opening (makes it look like T-Rex)
    pixel(13, 4, eyeColor);
    pixel(13, 5, eyeColor);
    pixel(12, 5, eyeColor);

    // Small arm
    pixel(7, 7, theme.dino);
    pixel(8, 7, theme.dino);
    pixel(8, 8, theme.dino);

    // Legs with running animation
    if (isOnGround && gameStarted && !gameOver) {
      // Running animation - two distinct leg positions
      if (runFrame === 0) {
        // Frame 1: Left leg forward, right leg back
        // Left leg (forward)
        pixel(2, 11, theme.dino);
        pixel(2, 12, theme.dino);
        pixel(2, 13, theme.dino);
        pixel(1, 13, theme.dino); // foot forward
        pixel(2, 14, theme.dino);

        // Right leg (back)
        pixel(5, 11, theme.dino);
        pixel(6, 12, theme.dino);
        pixel(7, 13, theme.dino);
        pixel(7, 14, theme.dino);
      } else {
        // Frame 2: Right leg forward, left leg back
        // Left leg (back)
        pixel(2, 11, theme.dino);
        pixel(1, 12, theme.dino);
        pixel(0, 13, theme.dino);
        pixel(0, 14, theme.dino);

        // Right leg (forward)
        pixel(5, 11, theme.dino);
        pixel(5, 12, theme.dino);
        pixel(5, 13, theme.dino);
        pixel(6, 13, theme.dino); // foot forward
        pixel(5, 14, theme.dino);
      }
    } else {
      // Standing still or jumping - both legs straight
      // Left leg
      pixel(2, 11, theme.dino);
      pixel(2, 12, theme.dino);
      pixel(2, 13, theme.dino);
      pixel(2, 14, theme.dino);

      // Right leg
      pixel(5, 11, theme.dino);
      pixel(5, 12, theme.dino);
      pixel(5, 13, theme.dino);
      pixel(5, 14, theme.dino);
    }
  }
}

// Draw handgun for shooting mode
function drawGun() {
  if (gameMode !== 'shooting') return;

  const theme = getColors();
  const px = 3;
  const currentY = dino.isDucking && !dino.isJumping ? ground.y - dino.duckHeight : dino.y;

  // Calculate angle to mouse
  const gunX = dino.x + (dino.isDucking ? 40 : 30);
  const gunY = currentY + (dino.isDucking ? 12 : 21);
  const angle = Math.atan2(mouseY - gunY, mouseX - gunX);

  ctx.save();
  ctx.translate(gunX, gunY);
  ctx.rotate(angle);

  // Draw gun body
  ctx.fillStyle = '#333';
  ctx.fillRect(0, -4, 20, 8); // barrel
  ctx.fillRect(-5, -6, 12, 12); // grip area
  ctx.fillRect(-5, 0, 8, 10); // handle

  ctx.restore();
}

// Create bullet (with cooldown check)
function createBullet() {
  const now = Date.now();
  if (now - lastShotTime < shootCooldown) return; // Cooldown not ready
  lastShotTime = now;

  const currentY = dino.isDucking && !dino.isJumping ? ground.y - dino.duckHeight : dino.y;
  const gunX = dino.x + (dino.isDucking ? 40 : 30);
  const gunY = currentY + (dino.isDucking ? 12 : 21);
  const angle = Math.atan2(mouseY - gunY, mouseX - gunX);

  const bulletSpeed = 900; // pixels per second (was 15 * 60)
  bullets.push({
    x: gunX + Math.cos(angle) * 20,
    y: gunY + Math.sin(angle) * 20,
    vx: Math.cos(angle) * bulletSpeed,
    vy: Math.sin(angle) * bulletSpeed
  });
}

// Draw bullets
function drawBullets() {
  ctx.fillStyle = '#ff6600';
  bullets.forEach(bullet => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Update bullets
function updateBullets(dt) {
  bullets.forEach(bullet => {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
  });

  // Remove off-screen bullets
  bullets = bullets.filter(b => b.x >= 0 && b.x <= canvas.width && b.y >= 0 && b.y <= canvas.height);
}

// Create explosion
function createExplosion(x, y) {
  explosions.push({
    x: x,
    y: y,
    elapsed: 0,
    duration: 250 // milliseconds (was 15 frames at 60fps)
  });
}

// Draw explosions
function drawExplosions() {
  explosions.forEach(exp => {
    const progress = exp.elapsed / exp.duration;
    const radius = 10 + progress * 25;
    const alpha = 1 - progress;

    // Outer explosion
    ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner explosion
    ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Update explosions
function updateExplosions(dt) {
  explosions.forEach(exp => {
    exp.elapsed += dt * 1000; // Convert to milliseconds
  });

  // Remove finished explosions
  explosions = explosions.filter(exp => exp.elapsed < exp.duration);
}

// Check bullet-bird collisions
function checkBulletCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    for (let j = obstacles.length - 1; j >= 0; j--) {
      const obstacle = obstacles[j];

      if (obstacle.type === 'bird') {
        // Check if bullet hits bird
        if (
          bullet.x >= obstacle.x &&
          bullet.x <= obstacle.x + obstacle.width + 10 &&
          bullet.y >= obstacle.y &&
          bullet.y <= obstacle.y + obstacle.height
        ) {
          // Create explosion at bird position
          createExplosion(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);

          // Remove bird and bullet
          obstacles.splice(j, 1);
          bullets.splice(i, 1);

          // Increment bird kill counter
          birdsKilled++;

          break;
        }
      }
    }
  }
}

// Draw ground
function drawGround() {
  const theme = getColors();
  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, ground.y, canvas.width, ground.height);

  // Ground line pattern (based on distance traveled, not frames)
  ctx.strokeStyle = theme.ground;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const offset = (distance * 0.1) % 20; // Use distance for consistent scrolling
  for (let i = -20; i < canvas.width; i += 20) {
    ctx.moveTo(i + offset, ground.y);
    ctx.lineTo(i + 10 + offset, ground.y);
  }
  ctx.stroke();
}

// Draw obstacles
function drawObstacles() {
  const theme = getColors();
  ctx.fillStyle = theme.obstacle;

  obstacles.forEach(obstacle => {
    if (obstacle.type === 'cactus') {
      // Cactus body
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

      // Cactus arms
      if (obstacle.size === 'large') {
        ctx.fillRect(obstacle.x - 6, obstacle.y + 12, 6, 15);
        ctx.fillRect(obstacle.x + obstacle.width, obstacle.y + 18, 6, 12);
      }
    } else if (obstacle.type === 'bird') {
      // Bird body
      ctx.fillRect(obstacle.x + 10, obstacle.y + 10, 25, 15);

      // Bird head
      ctx.fillRect(obstacle.x + 30, obstacle.y + 5, 15, 15);

      // Eye (interpolate between white and black based on nightProgress)
      ctx.fillStyle = lerpColor('#ffffff', '#000000', nightProgress);
      ctx.fillRect(obstacle.x + 38, obstacle.y + 10, 4, 4);
      ctx.fillStyle = theme.obstacle;

      // Wings (animated - time-based)
      const wingFrame = Math.floor(gameTime / 83) % 2; // ~12 fps wing animation
      const wingOffset = wingFrame === 0 ? -5 : 5;
      ctx.fillRect(obstacle.x + 5, obstacle.y + 15 + wingOffset, 20, 5);
      ctx.fillRect(obstacle.x + 25, obstacle.y + 15 - wingOffset, 20, 5);

      // Beak
      ctx.fillRect(obstacle.x + 45, obstacle.y + 12, 5, 4);
    }
  });
}

// Draw clouds (decorative)
function drawClouds() {
  const theme = getColors();
  ctx.fillStyle = lerpColor('#cccccc', '#444444', nightProgress);

  // Simple cloud decoration (time-based movement)
  const cloudSpeed = 30; // pixels per second
  const cloudX = ((gameTime * cloudSpeed / 1000) % (canvas.width + 100)) - 100;
  ctx.fillRect(cloudX, 30, 40, 15);
  ctx.fillRect(cloudX + 10, 20, 30, 15);
  ctx.fillRect(cloudX + 20, 25, 30, 15);
}

// Draw stars (fade in during night)
function drawStars() {
  if (nightProgress <= 0) return;

  ctx.fillStyle = `rgba(255, 255, 255, ${nightProgress})`;
  // Static stars based on score
  const starSeed = Math.floor(score / 1000);
  for (let i = 0; i < 20; i++) {
    const x = (i * 73 + starSeed * 37) % canvas.width;
    const y = (i * 47 + starSeed * 23) % 100;
    ctx.fillRect(x, y, 2, 2);
  }
}

// Draw moon (fade in during night)
function drawMoon() {
  if (nightProgress <= 0) return;

  ctx.fillStyle = `rgba(255, 255, 255, ${nightProgress})`;
  ctx.beginPath();
  ctx.arc(canvas.width - 100, 50, 20, 0, Math.PI * 2);
  ctx.fill();
}

// Update dino physics
function updateDino(dt) {
  // Jumping physics
  if (dino.isJumping || dino.y < ground.y - dino.height) {
    // Apply gravity (faster if fast falling)
    const currentGravity = dino.isFastFalling ? dino.fastFallGravity : dino.gravity;
    dino.velocityY += currentGravity * dt;
    dino.y += dino.velocityY * dt;

    const targetY = ground.y - (dino.isDucking ? dino.duckHeight : dino.normalHeight);

    if (dino.y >= targetY) {
      dino.y = targetY;
      dino.velocityY = 0;
      dino.isJumping = false;
      dino.isFastFalling = false;
    }
  }

  // Update current height
  if (!dino.isJumping) {
    dino.height = dino.isDucking ? dino.duckHeight : dino.normalHeight;
    dino.y = ground.y - dino.height;
  }
}

// Update obstacles
function updateObstacles(dt) {
  // Move obstacles
  obstacles.forEach(obstacle => {
    obstacle.x -= gameSpeed * dt;
  });

  // Remove off-screen obstacles
  obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);

  // Create new obstacles (time-based)
  if (gameTime >= nextObstacleTime && gameStarted && !gameOver) {
    createObstacle();
  }

  // Increase game speed over time (every second)
  if (gameTime - lastSpeedIncreaseTime >= SPEED_INCREASE_INTERVAL && gameStarted && !gameOver) {
    gameSpeed += 6; // was 0.1 per frame * 60 fps = 6 per second
    lastSpeedIncreaseTime = gameTime;
  }
}

// Update score (distance-based)
function updateScore(dt) {
  if (!gameOver && gameStarted) {
    // Distance traveled is based on game speed
    distance += gameSpeed * dt;
    score = Math.floor(distance / 10);
    scoreElement.textContent = score;

    // Gradual day/night cycle transition (200 points to transition)
    const halfTransition = 100;
    const cyclePos = score % 2000;

    if (cyclePos < halfTransition && score >= 2000 - halfTransition) {
      // End of night-to-day transition (wraps from previous cycle)
      nightProgress = 1 - (cyclePos + halfTransition) / (halfTransition * 2);
    } else if (cyclePos < 1000 - halfTransition) {
      // Day zone (0-899 in cycle)
      nightProgress = 0;
    } else if (cyclePos < 1000 + halfTransition) {
      // Day-to-night transition (900-1099 in cycle)
      nightProgress = (cyclePos - (1000 - halfTransition)) / (halfTransition * 2);
    } else if (cyclePos < 2000 - halfTransition) {
      // Night zone (1100-1899 in cycle)
      nightProgress = 1;
    } else {
      // Night-to-day transition start (1900-1999 in cycle)
      nightProgress = 1 - (cyclePos - (2000 - halfTransition)) / (halfTransition * 2);
    }
  }
}

// Check collision with improved hitboxes
function checkCollision() {
  const currentY = dino.isDucking && !dino.isJumping ? ground.y - dino.duckHeight : dino.y;
  const currentHeight = dino.isDucking ? dino.duckHeight : dino.normalHeight;

  // Hitbox that matches the pixel art body (not including tail/legs)
  const dinoBox = {
    x: dino.x + 3,
    y: currentY + 3,
    width: dino.width - 6,
    height: currentHeight - 12
  };

  for (let obstacle of obstacles) {
    const obstacleBox = {
      x: obstacle.x + 5,
      y: obstacle.y + 5,
      width: obstacle.width - 10,
      height: obstacle.height - 10
    };

    if (
      dinoBox.x < obstacleBox.x + obstacleBox.width &&
      dinoBox.x + dinoBox.width > obstacleBox.x &&
      dinoBox.y < obstacleBox.y + obstacleBox.height &&
      dinoBox.y + dinoBox.height > obstacleBox.y
    ) {
      return true;
    }
  }
  return false;
}

// Jump function
function jump() {
  if (!dino.isJumping && dino.y >= ground.y - dino.normalHeight) {
    dino.velocityY = dino.jumpPower;
    dino.isJumping = true;
    dino.isDucking = false;
  }
}

// Duck function
function duck() {
  if (!dino.isJumping) {
    dino.isDucking = true;
  } else {
    // Fast fall when ducking in air
    dino.isFastFalling = true;
    dino.isDucking = true;
  }
}

// Stand up function
function standUp() {
  dino.isDucking = false;
}

// Reset game
function resetGame(mode) {
  gameOver = false;
  gameStarted = true;
  gameMode = mode || gameMode;

  // Update high score based on mode
  const currentHighScore = gameMode === 'shooting' ? highScoreShooting : highScore;
  const finalScore = gameMode === 'shooting' ? score + (birdsKilled * 50) : score;

  if (finalScore > currentHighScore) {
    if (gameMode === 'shooting') {
      highScoreShooting = finalScore;
      localStorage.setItem('dinoHighScoreShooting', highScoreShooting);
    } else {
      highScore = finalScore;
      localStorage.setItem('dinoHighScore', highScore);
    }
  }

  // Update displayed high score based on mode
  highScoreElement.textContent = gameMode === 'shooting' ? highScoreShooting : highScore;

  score = 0;
  distance = 0;
  gameTime = 0;
  lastSpeedIncreaseTime = 0;
  gameSpeed = 360; // Reset to initial speed (pixels per second)
  nightProgress = 0;
  obstacles = [];
  nextObstacleTime = OBSTACLE_SPAWN_MIN + Math.random() * (OBSTACLE_SPAWN_MAX - OBSTACLE_SPAWN_MIN);
  dino.x = 50;
  dino.y = ground.y - dino.normalHeight;
  dino.height = dino.normalHeight;
  dino.velocityY = 0;
  dino.isJumping = false;
  dino.isDucking = false;
  dino.isFastFalling = false;
  scoreElement.textContent = '0';
  gameOverElement.style.display = 'none';
  birdScoreElement.style.display = 'none';

  // Reset shooting mode variables
  birdsKilled = 0;
  bullets = [];
  explosions = [];
}

// Game loop with delta time
function gameLoop(currentTime) {
  // Calculate delta time
  if (lastTime === 0) {
    lastTime = currentTime;
  }
  deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;

  // Cap delta time to prevent huge jumps (e.g., when tab is inactive)
  deltaTime = Math.min(deltaTime, 0.1);

  // Update game time
  if (gameStarted && !gameOver) {
    gameTime += deltaTime * 1000; // Track in milliseconds
  }

  const theme = getColors();

  // Clear canvas with theme background
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw decorations (both during transitions for smooth crossfade)
  drawClouds();
  if (nightProgress > 0) {
    drawStars();
    drawMoon();
  }

  if (!gameStarted) {
    // Draw start screen
    ctx.fillStyle = theme.text;
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACE for Classic Mode', canvas.width / 2, canvas.height / 2 - 15);
    ctx.fillText('Press ENTER for Shooting Mode', canvas.width / 2, canvas.height / 2 + 15);
    drawGround();
    drawDino();
  } else if (!gameOver) {
    // Update game with delta time
    updateDino(deltaTime);

    // Horizontal movement (delta time based)
    if (keysPressed['ArrowLeft'] || keysPressed['KeyA']) {
      dino.x = Math.max(dino.minX, dino.x - dino.moveSpeed * deltaTime);
    }
    if (keysPressed['ArrowRight'] || keysPressed['KeyD']) {
      dino.x = Math.min(dino.maxX, dino.x + dino.moveSpeed * deltaTime);
    }

    updateObstacles(deltaTime);
    updateScore(deltaTime);

    // Shooting mode updates
    if (gameMode === 'shooting') {
      updateBullets(deltaTime);
      updateExplosions(deltaTime);
      checkBulletCollisions();
    }

    // Check collision
    if (checkCollision()) {
      gameOver = true;
      gameOverElement.style.display = 'block';

      // Calculate final score for shooting mode
      const finalScore = gameMode === 'shooting' ? score + (birdsKilled * 50) : score;
      const currentHighScore = gameMode === 'shooting' ? highScoreShooting : highScore;

      // Update high score
      if (finalScore > currentHighScore) {
        if (gameMode === 'shooting') {
          highScoreShooting = finalScore;
          localStorage.setItem('dinoHighScoreShooting', highScoreShooting);
        } else {
          highScore = finalScore;
          localStorage.setItem('dinoHighScore', highScore);
        }
        highScoreElement.textContent = gameMode === 'shooting' ? highScoreShooting : highScore;
      }

      // Show bird score in shooting mode
      if (gameMode === 'shooting' && birdsKilled > 0) {
        birdScoreElement.textContent = `Birds Eliminated: ${birdsKilled} (+${birdsKilled * 50} pts)`;
        birdScoreElement.style.display = 'block';
      }
    }

    // Draw everything
    drawGround();
    drawObstacles();
    drawDino();

    // Shooting mode drawing
    if (gameMode === 'shooting') {
      drawGun();
      drawBullets();
      drawExplosions();

      // Draw bird kill counter
      ctx.fillStyle = '#d63031';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('🎯 ' + birdsKilled, 10, 20);
    }
  } else {
    // Game over screen
    drawGround();
    drawObstacles();
    drawDino();

    // Draw remaining explosions
    if (gameMode === 'shooting') {
      drawExplosions();
      updateExplosions(deltaTime);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = lerpColor('#000000', '#ffffff', nightProgress);
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = '18px Arial';

    if (gameMode === 'shooting') {
      const finalScore = score + (birdsKilled * 50);
      ctx.fillText('Distance: ' + score + ' | Birds: ' + birdsKilled + ' (+' + (birdsKilled * 50) + ')', canvas.width / 2, canvas.height / 2 + 5);
      ctx.font = 'bold 20px Arial';
      ctx.fillText('Total: ' + finalScore, canvas.width / 2, canvas.height / 2 + 35);
    } else {
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 10);
    }
  }

  requestAnimationFrame(gameLoop);
}

// Event listeners
let keysPressed = {};

document.addEventListener('keydown', (e) => {
  // Space - Start/restart classic mode
  if (e.code === 'Space') {
    e.preventDefault();
    if (!gameStarted || gameOver) {
      resetGame('classic');
    }
  }

  // Enter - Start/restart shooting mode
  if (e.code === 'Enter') {
    e.preventDefault();
    if (!gameStarted || gameOver) {
      resetGame('shooting');
    }
  }

  // Jump - Up arrow or W
  if (e.code === 'ArrowUp' || e.code === 'KeyW') {
    e.preventDefault();
    if (gameStarted && !gameOver) {
      jump();
    }
  }

  // Duck - Down arrow or S
  if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    e.preventDefault();
    if (gameStarted && !gameOver) {
      duck();
    }
  }

  // Move left - Left arrow or A
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    e.preventDefault();
  }

  // Move right - Right arrow or D
  if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    e.preventDefault();
  }

  keysPressed[e.code] = true;
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    standUp();
  }
  keysPressed[e.code] = false;
});

// Mouse tracking for aiming
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

// Click to shoot (only in shooting mode during gameplay)
canvas.addEventListener('click', (e) => {
  if (gameMode === 'shooting' && gameStarted && !gameOver) {
    createBullet();
  }
});

// Touch events for mobile
let touchStartY = 0;
let touchStartX = 0;
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;

  // Update mouse position for shooting mode aiming
  const rect = canvas.getBoundingClientRect();
  mouseX = e.touches[0].clientX - rect.left;
  mouseY = e.touches[0].clientY - rect.top;
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touchY = e.touches[0].clientY;
  const touchX = e.touches[0].clientX;
  const diffY = touchStartY - touchY;

  // Update mouse position for shooting mode aiming
  const rect = canvas.getBoundingClientRect();
  mouseX = touchX - rect.left;
  mouseY = touchY - rect.top;

  if (gameStarted && !gameOver) {
    if (diffY > 30) {
      jump();
    } else if (diffY < -30) {
      duck();
    }
  }
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  standUp();

  // Tap to shoot in shooting mode
  if (gameMode === 'shooting' && gameStarted && !gameOver) {
    createBullet();
  }
});

// Make canvas focusable
canvas.tabIndex = 0;

// Start game loop with requestAnimationFrame timestamp
requestAnimationFrame(gameLoop);

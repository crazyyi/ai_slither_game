const canvas = document.getElementById("gameCanvas");
const WORLD_HEIGHT = canvas.height * 4;
const WORLD_WIDTH = canvas.width * 4;
const VIEWPORT_WIDTH = canvas.width;
const VIEWPORT_HEIGHT = canvas.height;

const ctx = canvas.getContext("2d");
const statsDiv = document.getElementById("stats");

const radarCanvas = document.getElementById("radarCanvas");
const radarCtx = radarCanvas.getContext("2d");

const CAUTIOUS_LEVEL = 0.7;
const MAX_TOTAL_FOODS = 1000;
const INITIAL_FOOD_COUNT = 360;
const NUM_OF_BOTS = 7;
const FOOD_SPAWN_DELAY = 1100; // Initial spawn delay (milliseconds)
const UPSCALE_LENGTHS = [80, 160, 240, 320, 400];

// Snake Spawn
const MIN_SPAWN_DISTANCE_FROM_BORDER = 350; // Minimum distance from border

let lastFoodSpawn = 0; // Track the last food spawn time

const basicFoodColors = [
  "#FF0000", // Red
  "#90EE90", // Lime Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FFA500", // Orange
  "#800080", // Purple
  "#00FFFF", // Cyan
  "#FF69B4", // Hot Pink
  "#FFD700", // Gold
  "#ADFF2F", // Green Yellow
  "#FF4500", // Orange Red
  "#1E90FF", // Dodger Blue
];

const botNames = [
  "Slither",
  "Coil",
  "Wiggle",
  "Zigzag",
  "Slink",
  "Curve",
  "Loop",
  "Spiral",
  "Twist",
  "Turn",
  "Wind",
  "Weave",
  "Dart",
  "Dash",
  "Streak",
  "Flash",
  "Glide",
  "Sweep",
  "Dive",
  "Soar",
  "Creep",
  "Crawl",
  "Skulk",
  "Prowl",
  "Lurk",
  "Sneak",
  "Slide",
  "Slip",
  "Shimmy",
  "Wobble",
  "Undulate",
  "Meander",
  "Serpent",
  "Viper",
  "Python",
  "Cobra",
  "Mamba",
  "Asp",
  "Krait",
  "Taipan",
];

const botColors = [
  "#FF69B4", // Hot Pink
  "#FFD700", // Gold
  "#00FF00", // Lime
  "#00FFFF", // Cyan
  "#FF00FF", // Magenta
  "#ADFF2F", // GreenYellow
  "#FFA500", // Orange
  "#FFB6C1", // LightPink
  "#FFFF00", // Yellow
  "#00CED1", // DarkTurquoise
  "#90EE90", // LightGreen
  "#FF7F50", // Coral
  "#FF6347", // Tomato
  "#7CFC00", // LawnGreen
  "#AFEEEE", // PaleTurquoise
  "#F0E68C", // Khaki
  "#FFFAFA", // Snow
  "#DA70D6", // Orchid
  "#DB7093", // PaleVioletRed
  "#FFC0CB", // Pink
  "#FFEFD5", // PapayaWhip
  "#FFA07A", // LightSalmon
  "#98FB98", // PaleGreen
  "#FFB347", // BurlyWood
  "#FFFFE0", // LightYellow
];

// Snake color config
const SNAKE_CONFIG = {
  USE_DUAL_COLORS: true, // Master toggle for dual color feature
  PLAYER_DUAL_COLOR_CHANCE: 1.0, // Chance for player snake to have dual colors (0.0 to 1.0)
  BOT_DUAL_COLOR_CHANCE: 0.5, // Chance for bot snakes to have dual colors (0.0 to 1.0)
};

// Parameter Tuning Object (at the top level of your code)
const snakeTuning = {
  turningSpeed: 0.15,
  turningSpeedMultiplier: 1, // 5
  directionSmoothing: 0.1, // 0.2
  minSegmentDistance: 2, // Multiplier for this.size Original 2
  maxSegmentDistance: 2.2, // Multiplier for this.size Original: 2.5
  smoothingStrength: 0.1, // Original 0.25
  damping: 0.8,
  turnTighteningFactor: 0.3,
  maxBendAngle: 45,
};

class Snake {
  // Configuration constants (class properties)
  static FOOD_DETECTION_RANGE = 200;
  static SNAKE_TARGET_RANGE = 300;
  static MIN_SNAKE_SIZE_TO_CHASE = 0.85;
  static AVOIDANCE_WEIGHT = 2;
  static RANDOM_EXPLORATION_WEIGHT = 0.2;

  static isNameTaken(name, allSnakes) {
    // Static method, takes allSnakes as argument
    return allSnakes.some(
      (snake) => snake.name === name && snake.isAlive && !snake.isDying
    );
  }

  constructor(x, y, color, isBot = false, name = "Player") {
    this.color = color;
    this.isBot = isBot;
    this.name = name;

    // Determine if this snake should use dual colors
    this.useDualColors =
      SNAKE_CONFIG.USE_DUAL_COLORS && this.shouldUseDualColors();
    this.secondaryColor = this.useDualColors
      ? this.generateSecondaryColor(color)
      : color;

    // Constants (tune these as needed)
    this.SAFE_SPAWN_DISTANCE = 80;
    this.RESPAWN_TIME = 180;
    this.MIN_SEGMENT_SIZE = 1.5;
    this.BASE_LENGTH = 30; // Initial length (segments)
    this.MAX_LENGTH = Math.floor(this.BASE_LENGTH * 14); // Maximum length (segments)
    this.GROWTH_RATE = 0.01; // Segments gained per food eaten
    this.SPEED_BOOST_COST = 2; // Segments lost per second of speed boost
    this.BASE_SPEED = 160;
    this.SPEED_BOOST = 1.5;

    this.x = x; // Initialize x and y *FIRST*
    this.y = y;

    this.segments = []; // Initialize segments *AFTER* x and y are set

    if (isBot) {
      this.reset(x, y);
    }

    this.size = 6;
    this.lives = 1; // Each snake starts with 2 lives
    this.isAlive = true;
    this.respawnTimer = 0;
    this.targetPoint = null;
    this.opacity = 1;
    this.isDying = false;
    this.deathProgress = 0;
    this.foodEaten = 0;
    this.MAX_FOOD_EATEN_FOR_SEGMENT = 30; // Your maximum food eaten threshold
    this.growthProgress = 0; // Initialize growth progress

    this.baseSpeed = this.BASE_SPEED;
    this.speed = this.baseSpeed;
    this.speedBoost = 1.5;
    this.isSpeedingUp = false;
    this.speedBoostCost = 2; // Value cost per second of speed boost (equivalent to 2 food)
    this.lastSpeedBoostTime = 0; // Time of last speed boost cost
    this.lastLengthChangeTime = 0;

    this.cursorX = 0;
    this.cursorY = 0;

    // Speed effects
    this.trail = []; // Array to store the trail segments

    this.targetDirection = { ...this.direction };

    // Dynamic movement parameters
    this.turningSpeed = snakeTuning.turningSpeed;
    this.turningSpeedMultiplier = snakeTuning.turningSpeedMultiplier;
    this.directionSmoothing = snakeTuning.directionSmoothing;
    this.minSegmentDistance = snakeTuning.minSegmentDistance;
    this.maxSegmentDistance = snakeTuning.maxSegmentDistance;
    this.smoothingStrength = snakeTuning.smoothingStrength;
    this.damping = snakeTuning.damping;
    this.turnTighteningFactor = snakeTuning.turnTighteningFactor;
    this.maxBendAngle = snakeTuning.maxBendAngle;
  }

  reset(x, y) {
    this.x = x; // Now, these assignments are correct
    this.y = y;
    this.segments = [];
    // Create head
    this.segments.push({ x, y });
    // Create body segments with proper spacing
    // for (let i = 1; i < this.BASE_LENGTH; i++) {
    //   this.segments.push({
    //     x: x - i * this.size * 2, // Multiply by size*2 for proper spacing
    //     y: y,
    //   });
    // }

    // Generate random direction vector
    const angle = Math.random() * 2 * Math.PI; // Random angle in radians
    this.direction = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    // Initially target the same direction
    this.targetDirection = { ...this.direction }; // Copy the direction
    this.isAlive = true;
    this.opacity = 1;
    this.isDying = false;
    this.deathProgress = 0;
  }

  shouldUseDualColors() {
    const chance = this.isBot
      ? SNAKE_CONFIG.BOT_DUAL_COLOR_CHANCE
      : SNAKE_CONFIG.PLAYER_DUAL_COLOR_CHANCE;
    return Math.random() < chance;
  }

  getCurrentMaxLength() {
    const potentialGrowth = this.MAX_LENGTH - this.BASE_LENGTH;
    const currentGrowth = Math.min(
      potentialGrowth * this.foodEaten * this.GROWTH_RATE,
      potentialGrowth
    );
    return Math.floor(this.BASE_LENGTH + currentGrowth);
  }

  grow(foodValue) {
    const currentLength = this.segments.length;

    let requiredFood = 1 + currentLength / 11; // Adjust 20 for tuning
    requiredFood = Math.min(requiredFood, this.MAX_FOOD_EATEN_FOR_SEGMENT);

    const effectiveFoodValue = foodValue / requiredFood;

    this.growthProgress += effectiveFoodValue;

    if (this.growthProgress >= 1) {
      this.growthProgress -= 1;
      this.segments.push({ ...this.segments[this.segments.length - 1] });
    }

    // Update foodEaten: Increment, don't recalculate
    this.foodEaten += effectiveFoodValue;
  }

  update(foods, otherSnakes, deltaTime) {
    this.updatedScale = (() => {
      for (let i = UPSCALE_LENGTHS.length - 1; i >= 0; i--) {
        if (this.segments.length > UPSCALE_LENGTHS[i]) {
          return 1.6 + i * 0.4; // Scale increment for each level
        }
      }
      return 1.6; // Base scale (below level 1)
    })();

    let targetLength = this.getCurrentMaxLength();

    // First check if we can speed up
    if (this.isSpeedingUp) {
      // Prevent speed boost if at base length
      if (this.segments.length <= this.BASE_LENGTH) {
        this.isSpeedingUp = false;
        this.speed = this.baseSpeed;
        return;
      }

      const now = Date.now();

      // Shrink snake and spawn food every 200ms while speeding
      if (!this.lastShrinkTime) {
        this.lastShrinkTime = now;
      }

      const shrinkInterval = 200; // Milliseconds between shrinks
      if (now - this.lastShrinkTime >= shrinkInterval) {
        // Only shrink if we're above base length
        if (this.segments.length > this.BASE_LENGTH) {
          // Remove only 1 segment at a time for balanced food production
          const removedSegment = this.segments.pop();

          // Spawn exactly 1 food for 1 segment removed
          if (removedSegment) {
            // Add slight random spread for visual appeal
            const spread = 10;
            const foodX = removedSegment.x + (Math.random() - 0.5) * spread;
            const foodY = removedSegment.y + (Math.random() - 0.5) * spread;

            const newFood = new Food();
            newFood.position = { x: foodX, y: foodY };
            foods.push(newFood);

            // Reduce food eaten count by exactly the amount needed to create one segment
            this.foodEaten = Math.max(0, this.foodEaten - 0.2); // Since each food gives 0.2 growth
          }
        } else {
          // If we've reached base length, stop speed boost
          this.isSpeedingUp = false;
        }

        this.lastShrinkTime = now;
      }

      // Apply speed boost only if we're above base length
      this.speed = this.baseSpeed * this.SPEED_BOOST;
    } else {
      // Reset shrink timer when not speeding
      this.lastShrinkTime = null;
      this.speed = this.baseSpeed;
    }

    if (this.isDying) {
      this.deathProgress += 0.02;
      this.opacity = Math.max(0, 1 - this.deathProgress);
      if (this.deathProgress >= 1) {
        this.isDying = false;
        this.isAlive = false;
        if (this.lives > 0) {
          this.respawnTimer = this.RESPAWN_TIME;
        }
      }
      return;
    }

    if (!this.isAlive) {
      if (this.lives <= 0) return;
      this.respawnTimer--;
      if (this.respawnTimer <= 0) {
        this.respawn();
      }
      return;
    }

    if (this.isBot) {
      this.updateAI(foods, otherSnakes);
    }

    // Convert directions to degrees for angle calculations
    const currentAngle =
      (Math.atan2(this.direction.y, this.direction.x) * 180) / Math.PI;
    const targetAngle =
      (Math.atan2(this.targetDirection.y, this.targetDirection.x) * 180) /
      Math.PI;

    // Use lerpAngle to interpolate between angles
    const newAngle = lerpAngle(
      currentAngle,
      targetAngle,
      this.turningSpeed * deltaTime * this.turningSpeedMultiplier
    );

    // Convert the new angle back to a direction vector
    this.direction.x = Math.cos((newAngle * Math.PI) / 180);
    this.direction.y = Math.sin((newAngle * Math.PI) / 180);

    // *** CRUCIAL: Normalize the direction vector ***
    const length = Math.sqrt(
      this.direction.x * this.direction.x + this.direction.y * this.direction.y
    );

    if (length === 0) {
      this.direction = { x: 1, y: 0 }; // Or some default
    } else {
      this.direction.x /= length;
      this.direction.y /= length;
    }

    // Add direction smoothing
    if (this.targetDirection) {
      const smoothingFactor = this.directionSmoothing;
      const currentAngle = Math.atan2(this.direction.y, this.direction.x);
      const targetAngle = Math.atan2(
        this.targetDirection.y,
        this.targetDirection.x
      );

      // Calculate the smallest angle difference
      let angleDiff = targetAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Apply smooth rotation
      const newAngle = currentAngle + angleDiff * smoothingFactor;

      // Update direction with smoothed angle
      this.direction.x = Math.cos(newAngle);
      this.direction.y = Math.sin(newAngle);
    }

    const head = this.segments[0];

    const moveAmount = this.speed * deltaTime;

    const newHead = {
      x: head.x + this.direction.x * moveAmount, // Use deltaTime
      y: head.y + this.direction.y * moveAmount, // Use deltaTime
    };

    this.segments.unshift(newHead);

    this.applySegmentSmoothing(deltaTime);

    if (this.isSpeedingUp) {
      this.trail.push({ x: newHead.x, y: newHead.y }); // Use the *new* head position
    } else {
      this.trail = [];
    }

    // Maintain segment spacing
    for (let i = 1; i < this.segments.length; i++) {
      const prev = this.segments[i - 1];
      const curr = this.segments[i];
      const dx = prev.x - curr.x;
      const dy = prev.y - curr.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Dynamic spacing based on turn intensity
      const turnIntensity =
        Math.abs(this.targetDirection.x - this.direction.x) +
        Math.abs(this.targetDirection.y - this.direction.y);
      const maxSpacing =
        this.size * (3 - this.turnTighteningFactor * turnIntensity);

      if (distance > maxSpacing) {
        const ratio = (this.size * (1.5 + turnIntensity)) / distance;
        curr.x = prev.x - dx * ratio;
        curr.y = prev.y - dy * ratio;
      }
    }

    // Maintain correct length
    while (this.segments.length > targetLength) {
      this.segments.pop();
    }
  }

  applySegmentSmoothing(deltaTime) {
    // Tighter following parameters
    const MIN_SEGMENT_DISTANCE = this.size * this.minSegmentDistance; // Minimum distance between segments
    const MAX_SEGMENT_DISTANCE = this.size * this.maxSegmentDistance; // Maximum allowed distance
    const SMOOTHING_STRENGTH = this.smoothingStrength; // Increased for more responsive following

    for (let i = 1; i < this.segments.length; i++) {
      const prevSegment = this.segments[i - 1];
      const currentSegment = this.segments[i];

      // Calculate current distance between segments
      const dx = prevSegment.x - currentSegment.x;
      const dy = prevSegment.y - currentSegment.y;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);

      // Skip if segments are already close enough
      if (currentDistance < MIN_SEGMENT_DISTANCE) continue;

      // Calculate direction vector
      const dirX = dx / currentDistance;
      const dirY = dy / currentDistance;

      // Calculate target position
      let targetDistance = MIN_SEGMENT_DISTANCE;

      // If turning, reduce segment spacing slightly
      const turnIntensity = Math.abs(
        this.targetDirection.x -
          this.direction.x +
          this.targetDirection.y -
          this.direction.y
      );
      targetDistance -= turnIntensity * this.size * 0.3; // Reduce spacing during turns

      // Calculate target position
      const targetX = prevSegment.x - dirX * targetDistance;
      const targetY = prevSegment.y - dirY * targetDistance;

      // Apply velocity-based movement with increased responsiveness
      if (!currentSegment.vx) currentSegment.vx = 0;
      if (!currentSegment.vy) currentSegment.vy = 0;

      // Stronger correction when segments are too far apart
      const distanceRatio = Math.min(currentDistance / MAX_SEGMENT_DISTANCE, 1);
      const correctionStrength = SMOOTHING_STRENGTH * (1 + distanceRatio);

      // Update velocities with stronger correction
      currentSegment.vx += (targetX - currentSegment.x) * correctionStrength;
      currentSegment.vy += (targetY - currentSegment.y) * correctionStrength;

      // Apply damping to prevent oscillation
      const DAMPING = this.damping;
      currentSegment.vx *= DAMPING;
      currentSegment.vy *= DAMPING;

      // Update position
      currentSegment.x += currentSegment.vx * deltaTime;
      currentSegment.y += currentSegment.vy * deltaTime;

      // Force correction if segment is too far
      if (currentDistance > MAX_SEGMENT_DISTANCE) {
        currentSegment.x = prevSegment.x - dirX * MAX_SEGMENT_DISTANCE;
        currentSegment.y = prevSegment.y - dirY * MAX_SEGMENT_DISTANCE;
        currentSegment.vx = 0;
        currentSegment.vy = 0;
      }
    }
  }

  calculateBendAngle(segmentIndex) {
    const prev = this.segments[segmentIndex - 1];
    const current = this.segments[segmentIndex];
    const dx = current.x - prev.x;
    const dy = current.y - prev.y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  applyBend(segment, angle) {
    // Limit maximum bend for natural look
    const bend = Math.min(
      Math.max(angle, -this.maxBendAngle),
      this.maxBendAngle
    );

    segment.x += Math.cos((bend * Math.PI) / 180) * this.size * 0.05;
    segment.y += Math.sin((bend * Math.PI) / 180) * this.size * 0.05;
  }

  canSpeedBoost() {
    return this.segments.length > this.BASE_LENGTH;
  }

  updateAI(foods, otherSnakes) {
    const head = this.segments[0];

    const avoidanceForce = this.calculateAvoidanceForce(head, otherSnakes);
    const targetDirection = this.determineTargetDirection(
      head,
      foods,
      otherSnakes,
      avoidanceForce
    );

    this.applyMovement(targetDirection);
  }

  calculateAvoidanceForce(head, otherSnakes) {
    let avoidanceForce = { x: 0, y: 0 };

    otherSnakes.forEach((otherSnake) => {
      if (otherSnake !== this && otherSnake.isAlive && !otherSnake.isDying) {
        const otherHead = otherSnake.segments[0];
        const dx = otherHead.x - head.x;
        const dy = otherHead.y - head.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const DANGER_DISTANCE = this.size * 3;

        if (distance < DANGER_DISTANCE) {
          const repulsionForce =
            (1 - distance / DANGER_DISTANCE) * Snake.AVOIDANCE_WEIGHT;
          avoidanceForce.x -= (dx / distance) * repulsionForce;
          avoidanceForce.y -= (dy / distance) * repulsionForce;
        }
      }
    });

    const avoidanceMagnitude = Math.sqrt(
      avoidanceForce.x * avoidanceForce.x + avoidanceForce.y * avoidanceForce.y
    );
    if (avoidanceMagnitude > 0) {
      avoidanceForce.x /= avoidanceMagnitude;
      avoidanceForce.y /= avoidanceMagnitude;
    }

    return avoidanceForce;
  }

  determineTargetDirection(head, foods, otherSnakes, avoidanceForce) {
    // Track potential targets and threats
    let nearestFood = null;
    let minFoodDistance = Infinity;
    let targetSnake = null;
    let minTargetDistance = Infinity;
    let nearestThreat = null;
    let minThreatDistance = Infinity;

    // Find nearest food
    foods.forEach((food) => {
      const dx = food.position.x - head.x;
      const dy = food.position.y - head.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minFoodDistance) {
        minFoodDistance = distance;
        nearestFood = food;
      }
    });

    // Target snake and threat detection (Corrected)
    otherSnakes.forEach((otherSnake) => {
      if (otherSnake !== this && otherSnake.isAlive && !otherSnake.isDying) {
        const otherHead = otherSnake.segments[0];
        const dx = otherHead.x - head.x;
        const dy = otherHead.y - head.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const sizeRatio = otherSnake.segments.length / this.segments.length;

        if (sizeRatio > 1.2 && distance < Snake.SNAKE_TARGET_RANGE * 1.5) {
          // Increased range for threats
          if (distance < minThreatDistance) {
            minThreatDistance = distance;
            nearestThreat = otherSnake;
          }
        } else if (
          sizeRatio < Snake.MIN_SNAKE_SIZE_TO_CHASE &&
          distance < Snake.SNAKE_TARGET_RANGE
        ) {
          if (distance < minTargetDistance) {
            minTargetDistance = distance;
            targetSnake = otherSnake;
          }
        }
      }
    });

    let moveX = this.direction.x;
    let moveY = this.direction.y;

    // Decision making priority
    if (nearestThreat) {
      // Escape from threat
      const dx = head.x - nearestThreat.segments[0].x;
      const dy = head.y - nearestThreat.segments[0].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      moveX = dx / distance + avoidanceForce.x;
      moveY = dy / distance + avoidanceForce.y;
    } else if (targetSnake && Math.random() < 0.7) {
      // Chase prey
      moveX =
        (targetSnake.segments[0].x - head.x) / minTargetDistance +
        avoidanceForce.x;
      moveY =
        (targetSnake.segments[0].y - head.y) / minTargetDistance +
        avoidanceForce.y;
    } else if (nearestFood) {
      // Move toward food
      moveX =
        (nearestFood.position.x - head.x) / minFoodDistance + avoidanceForce.x;
      moveY =
        (nearestFood.position.y - head.y) / minFoodDistance + avoidanceForce.y;
    } else {
      // Explore
      const time = Date.now() * 0.001;
      moveX =
        Math.cos(time * 0.5) * (1 - Snake.RANDOM_EXPLORATION_WEIGHT) +
        avoidanceForce.x * Snake.RANDOM_EXPLORATION_WEIGHT;
      moveY =
        Math.sin(time * 0.7) * (1 - Snake.RANDOM_EXPLORATION_WEIGHT) +
        avoidanceForce.y * Snake.RANDOM_EXPLORATION_WEIGHT;
    }

    // Normalize movement vector
    const length = Math.sqrt(moveX * moveX + moveY * moveY);
    if (length > 0) {
      return { x: moveX / length, y: moveY / length };
    } else {
      return { x: 0, y: 0 }; // Or a default direction
    }
  }

  applyMovement(targetDirection) {
    const smoothingFactor = 0.1;
    this.direction.x =
      this.direction.x * (1 - smoothingFactor) +
      targetDirection.x * smoothingFactor;
    this.direction.y =
      this.direction.y * (1 - smoothingFactor) +
      targetDirection.y * smoothingFactor;

    const smoothedLength = Math.sqrt(
      this.direction.x * this.direction.x + this.direction.y * this.direction.y
    );
    this.direction.x /= smoothedLength;
    this.direction.y /= smoothedLength;
  }

  getDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  respawn() {
    if (this.lives > 0) {
      const safePosition = this.findSafeSpawnPosition();
      this.reset(safePosition.x, safePosition.y);
      this.targetPoint = null;
    }
  }

  findSafeSpawnPosition() {
    const MAX_RESPAWN_ATTEMPTS = 20;
    const SAFE_SPAWN_DISTANCE_SQUARED =
      this.SAFE_SPAWN_DISTANCE * this.SAFE_SPAWN_DISTANCE;

    for (let attempts = 0; attempts < MAX_RESPAWN_ATTEMPTS; attempts++) {
      let x =
        Math.floor(
          Math.random() * (WORLD_WIDTH - 2 * MIN_SPAWN_DISTANCE_FROM_BORDER)
        ) + MIN_SPAWN_DISTANCE_FROM_BORDER;
      let y =
        Math.floor(
          Math.random() * (WORLD_HEIGHT - 2 * MIN_SPAWN_DISTANCE_FROM_BORDER)
        ) + MIN_SPAWN_DISTANCE_FROM_BORDER;

      if (!this.isPositionNearSnakes(x, y, SAFE_SPAWN_DISTANCE_SQUARED)) {
        return { x, y };
      }
    }

    return { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 }; // Default to center
  }

  isPositionNearSnakes(x, y, SAFE_SPAWN_DISTANCE_SQUARED) {
    if (allSnakes.length === 0) {
      // Important check!
      return false;
    }

    for (const snake of allSnakes) {
      if (snake === this || !snake.isAlive || snake.isDying) continue;

      const dx = x - snake.segments[0].x;
      const dy = y - snake.segments[0].y;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared < SAFE_SPAWN_DISTANCE_SQUARED) {
        return true;
      }
    }
    return false;
  }

  // Generate a complementary color
  generateSecondaryColor(primaryColor) {
    if (Math.random() < 0.5) {
      let r, g, b;
      if (primaryColor.startsWith("#")) {
        const hex = primaryColor.substring(1);
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      } else if (primaryColor.startsWith("rgb")) {
        const rgb = primaryColor.match(/\d+/g);
        [r, g, b] = rgb.map(Number);
      } else {
        return getRandomBotColor(); // Use your existing random color function
      }

      // Generate complementary color
      const newR = 255 - r;
      const newG = 255 - g;
      const newB = 255 - b;

      return `rgb(${newR}, ${newG}, ${newB})`;
    }
    // Option 2: Generate completely random secondary color
    else {
      return getRandomBotColor();
    }
  }

  draw() {
    if (!this.isAlive && !this.isDying) return;

    const scale = 1.6;
    let trailScale = 1; // Initialize trail scale

    // Determine trail scale based on snake length (5 levels)
    for (let i = UPSCALE_LENGTHS.length - 1; i >= 0; i--) {
      if (this.segments.length > UPSCALE_LENGTHS[i]) {
        trailScale = (1.6 + i * 0.4) / 1.6; // Scale up to match level
        break; // Stop once the appropriate level is found
      }
    }

    ctx.globalAlpha = this.opacity;

    if (this.isSpeedingUp) {
      for (let i = 0; i < this.segments.length; i++) {
        // Iterate through the trail array
        const segment = this.segments[i];
        const screenX = segment.x - camera.x;
        const screenY = segment.y - camera.y;

        if (
          screenX >= -10 &&
          screenX <= VIEWPORT_WIDTH + 10 &&
          screenY >= -10 &&
          screenY <= VIEWPORT_HEIGHT + 10
        ) {
          const alpha = ((i + 1) / this.trail.length) * 0.7; // Increased alpha for more visibility

          // Subtle Glow (drawn first) - More prominent glow
          const glowAlpha = alpha * 0.5; // Increased glow alpha
          ctx.fillStyle = `rgba(255, 215, 0, ${glowAlpha})`; // Brighter yellow-gold
          ctx.shadowColor = "yellow"; // Yellow shadow
          ctx.shadowBlur = 10 * trailScale; // Larger, scaled blur
          ctx.beginPath();
          const glowRadius =
            Math.max(0, this.size * (1.6 - i / this.trail.length / 3)) *
            scale *
            trailScale; // Larger glow radius
          ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowColor = "transparent"; // Reset shadow
          ctx.shadowBlur = 0;

          // Trail - More intense trail
          ctx.fillStyle = `rgba(255, 170, 0, ${alpha})`; // More intense orange
          ctx.beginPath();
          const trailRadius =
            Math.max(0, this.size * (1.4 - i / this.trail.length / 3)) *
            scale *
            trailScale; // Larger trail radius
          ctx.arc(screenX, screenY, trailRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.fillStyle = this.color;

    // Transform all coordinates relative to camera - draw from tail to head
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const segment = this.segments[i];
      const screenX = segment.x - camera.x;
      const screenY = segment.y - camera.y;

      // Only draw segments that are within the viewport
      if (
        screenX >= -10 &&
        screenX <= VIEWPORT_WIDTH + 10 &&
        screenY >= -10 &&
        screenY <= VIEWPORT_HEIGHT + 10
      ) {
        const originalSize = this.size; // Keep consistent size for all segments
        let size = originalSize * this.updatedScale;

        if (i === 0) {
          // Head segment
          const dot =
            this.direction.x * this.targetDirection.x +
            this.direction.y * this.targetDirection.y;
          const turnFactor = Math.max(0.3, dot);
          size *= turnFactor;
        }

        // Determine segment color based on dual color settings
        ctx.fillStyle =
          this.useDualColors && Math.floor(i / 10) % 2 === 0
            ? this.color
            : this.secondaryColor;

        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const head = this.segments[0];
    const screenHeadX = head.x - camera.x;
    const screenHeadY = head.y - camera.y;

    // Only draw head details if it's within viewport
    if (
      screenHeadX >= -10 &&
      screenHeadX <= VIEWPORT_WIDTH + 10 &&
      screenHeadY >= -10 &&
      screenHeadY <= VIEWPORT_HEIGHT + 10
    ) {
      const eyeScale = this.updatedScale / scale; // Use updatedScale for eye scaling
      const irisScale = this.updatedScale / scale; // Use updatedScale for iris scaling

      ctx.fillStyle = "white";
      const eyeOffset = 2 * scale * eyeScale; // Scale eye offset
      const eyeSize = 1.5 * scale * eyeScale; // Scale eye size

      const eyeX = this.direction.x * eyeOffset;
      const eyeY = this.direction.y * eyeOffset;

      ctx.beginPath();
      ctx.arc(
        screenHeadX + eyeX - eyeY,
        screenHeadY + eyeY + eyeX,
        eyeSize,
        0,
        Math.PI * 2
      );
      ctx.arc(
        screenHeadX + eyeX + eyeY,
        screenHeadY + eyeY - eyeX,
        eyeSize,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // *** Iris Tracking (Simpler - Based on targetDirection) - Corrected ***
      const irisOffset = 0.9 * irisScale; // Scale iris offset
      const irisSize = eyeSize * 0.8; // Iris size relative to eye size (important!)

      // Calculate iris positions *relative to the eye centers*
      const irisXLeft = this.targetDirection.x * irisOffset;
      const irisYLeft = this.targetDirection.y * irisOffset;

      const irisXRight = this.targetDirection.x * irisOffset;
      const irisYRight = this.targetDirection.y * irisOffset;

      ctx.fillStyle = "black"; // Iris color
      ctx.beginPath();
      ctx.arc(
        screenHeadX + eyeX - eyeY + irisXLeft,
        screenHeadY + eyeY + eyeX + irisYLeft,
        irisSize,
        0,
        Math.PI * 2
      ); // Left eye iris
      ctx.arc(
        screenHeadX + eyeX + eyeY + irisXRight,
        screenHeadY + eyeY - eyeX + irisYRight,
        irisSize,
        0,
        Math.PI * 2
      ); // Right eye iris
      ctx.fill();

      // Draw name
      ctx.fillStyle = "rgba(250, 250, 250, 0.6)";
      ctx.font = `bold ${12 * scale}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      const nameOffsetY =
        this.size *
          Math.max(1 - 0 / this.segments.length, this.MIN_SEGMENT_SIZE) *
          scale +
        5;
      ctx.fillText(this.name, screenHeadX, screenHeadY - nameOffsetY);
    }

    ctx.globalAlpha = 1;
  }
}

class Food {
  constructor(isFlying = false) {
    this.size = isFlying ? 8 : 4;
    this.value = isFlying ? 3 : 1;
    this.isFlying = isFlying;
    this.resetPosition();

    this.color = this.isFlying ? "gold" : "lightgreen"; // Gold for flying, light green for regular
    this.shadowColor = this.isFlying
      ? "rgba(255, 215, 0, 0.3)"
      : "rgba(144, 238, 144, 0.3)"; // Gold shadow, lightgreen shadow

    this.floatingSpeed = 0.01; // Adjust floating speed
    this.floatingAmplitude = 0.8; // Adjust floating amplitude (how high/low it goes)

    if (this.isFlying) {
      this.blinkInterval = 500; // Adjust blink interval (milliseconds)
      this.lastBlink = 0;
      this.isFlickering = false; // Add a flag to track flickering state
      this.fleeingBlinkInterval = 300; // Fleeing blink interval (faster)
      this.fleeingLastBlink = 0;

      this.setRandomDirection();
      this.baseSpeed = 1; // Store base speed
      this.speed = this.baseSpeed * 1.3; // 30% faster
      this.wobbleInterval = 150; // Slightly more frequent wobble
      this.lastWobble = Date.now();
      this.maxWanderDistance = 150; // How far it can wander from its starting point
      this.initialPosition = { ...this.position }; // Store initial position
    }
  }

  setRandomDirection() {
    this.direction = {
      x: Math.random() - 0.5,
      y: Math.random() - 0.5,
    };
    const length = Math.sqrt(
      this.direction.x * this.direction.x + this.direction.y * this.direction.y
    );
    this.direction.x /= length;
    this.direction.y /= length;
  }

  resetPosition() {
    this.position = {
      x: Math.random() * (WORLD_WIDTH - 100) + 50,
      y: Math.random() * (WORLD_HEIGHT - 100) + 50,
    };
  }

  update() {
    if (this.isFlying) {
      if (!this.fleeing) {
        // Only wander if NOT fleeing
        const now = Date.now();
        if (now - this.lastWobble > this.wobbleInterval) {
          this.setRandomDirection();
          this.lastWobble = now;
        }
      }

      this.position.x += this.direction.x * this.speed;
      this.position.y += this.direction.y * this.speed;

      // Wrap around edges
      if (this.position.x < 0) this.position.x = WORLD_WIDTH;
      if (this.position.x > WORLD_WIDTH) this.position.x = 0;
      if (this.position.y < 0) this.position.y = WORLD_HEIGHT;
      if (this.position.y > WORLD_HEIGHT) this.position.y = 0;

      // Limit wandering distance (no changes)
      const distanceTravelled = this.getDistance(
        this.initialPosition,
        this.position
      );
      if (distanceTravelled > this.maxWanderDistance) {
        const dx = this.initialPosition.x - this.position.x;
        const dy = this.initialPosition.y - this.position.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        this.direction.x = dx / length;
        this.direction.y = dy / length;

        this.speed = this.baseSpeed;
      } else {
        this.speed = this.baseSpeed * 1.3;
      }
    }
  }

  getDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  flee(snakeHead, snakeDirection) {
    if (this.isFlying && !this.fleeing) {
      const dx = this.position.x - snakeHead.x;
      const dy = this.position.y - snakeHead.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 70) {
        // Adjust this range as needed
        const fleeDirection = { x: dx / distance, y: dy / distance };
        this.direction = fleeDirection;
        this.speed = this.baseSpeed * 8; // Increased speed!
        this.fleeing = true;

        // Visual cue: Change color or size during flee
        this.fleeingColor = "yellow"; // Or any other color you like
        this.size = 12; // Make it bigger during flee (optional)

        setTimeout(() => {
          this.speed = this.baseSpeed * 1.3; // Back to regular flying speed
          this.fleeing = false;
          this.fleeingColor = "red"; // Back to flying color
          this.size = 9; // Back to regular size
        }, Math.random() * 1500 + 500); // Random delay
      }
    }
  }

  draw() {
    let floatingOffset = 0;

    if (!this.isFlying) {
      // *** KEY CHANGE: Apply floating only if NOT flying ***
      const time = Date.now() * this.floatingSpeed;
      floatingOffset =
        Math.sin(time + this.position.y) * this.floatingAmplitude;
    }

    // Transform coordinates relative to camera
    const screenX = this.position.x - camera.x;
    const screenY = this.position.y - camera.y + floatingOffset; // Apply floating effect to y-coordinate

    // Only draw if within viewport
    if (
      screenX >= -10 &&
      screenX <= VIEWPORT_WIDTH + 10 &&
      screenY >= -10 &&
      screenY <= VIEWPORT_HEIGHT + 10
    ) {
      if (!this.isFlying) {
        // "Light Bulb" Glow Effect

        // 1. Very Bright, Smaller Inner Glow
        ctx.shadowColor = "white"; // Pure white for the "bulb"
        ctx.shadowBlur = 32; // Strong blur
        ctx.fillStyle = "white"; // White center
        ctx.globalAlpha = 0.8; // Almost opaque
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size * 0.8, 0, Math.PI * 2); // Smaller "bulb"
        ctx.fill();
        ctx.globalAlpha = 1; // Reset alpha
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // 2. Outer Glow (Colored)
        ctx.shadowColor = this.shadowColor; // Food's shadow color
        ctx.shadowBlur = 64; // Very large blur
        ctx.globalAlpha = 0.5; // Semi-transparent
        ctx.fillStyle = this.color; // Food's color
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size * 1.2, 0, Math.PI * 2); // Larger glow
        ctx.fill();
        ctx.globalAlpha = 1; // Reset alpha
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // 3. Food Item (Slightly Darker) - Optional
        ctx.fillStyle = this.color; // Food color
        ctx.globalAlpha = 0.9; // Slightly less opaque
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2); // Original size
        ctx.fill();
        ctx.globalAlpha = 1; // Reset alpha
      }

      if (this.isFlying) {
        const currentBlinkInterval = this.fleeing
          ? this.fleeingBlinkInterval
          : this.blinkInterval;
        const lastBlinkTime = this.fleeingLastBlink || this.lastBlink;

        const glowSizeMultiplier = this.fleeing ? 6.0 : 5.0;
        const foodSize = this.size * 1.1; // Slightly larger food

        const currentTime = Date.now();
        if (currentTime - lastBlinkTime >= currentBlinkInterval) {
          if (this.fleeing) {
            this.fleeingLastBlink = currentTime;
          } else {
            this.lastBlink = currentTime;
          }
        }

        // 1. Brightest White Core (Light Source)
        ctx.fillStyle = "white"; // Pure white for the "light source"
        ctx.globalAlpha = 0.95; // Almost completely opaque
        ctx.beginPath();
        ctx.arc(screenX, screenY, foodSize * 0.3, 0, Math.PI * 2); // Tiny, bright core
        ctx.fill();
        ctx.globalAlpha = 1;

        // 2. Inner Glow (Food Color)
        ctx.shadowColor = this.shadowColor;
        ctx.shadowBlur = foodSize * glowSizeMultiplier * 0.8; // Large blur
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.7; // Semi-transparent
        ctx.beginPath();
        ctx.arc(screenX, screenY, foodSize * 0.6, 0, Math.PI * 2); // Slightly larger radius
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // 3. Outer Glow (Food Color, Larger)
        ctx.shadowColor = this.shadowColor;
        ctx.shadowBlur = foodSize * glowSizeMultiplier * 1.2; // Even larger blur
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.5; // More transparent
        ctx.beginPath();
        ctx.arc(screenX, screenY, foodSize * 0.9, 0, Math.PI * 2); // Almost food size
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(screenX, screenY, foodSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }
}

function getRandomBotColor() {
  return botColors[Math.floor(Math.random() * botColors.length)];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// lerpAngle function (outside the class) - Handles angle wrapping
function lerpAngle(a, b, t) {
  let diff = (b - a + 360) % 360;
  if (diff > 180) diff -= 360; // Alternative wrap-around
  return a + diff * t;
}

const camera = {
  x: 0,
  y: 0,
  update: function (playerX, playerY) {
    const smoothing = 0.1;
    const targetX = playerX - VIEWPORT_WIDTH / 2;
    const targetY = playerY - VIEWPORT_HEIGHT / 2;

    this.x += (targetX - this.x) * smoothing;
    this.y += (targetY - this.y) * smoothing;
  },
};

function createBot(x, y, color, allSnakes) {
  let newName;
  do {
    newName = botNames[Math.floor(Math.random() * botNames.length)];
  } while (Snake.isNameTaken(newName, allSnakes));

  const spawnX = Math.random() * WORLD_WIDTH;
  const spawnY = Math.random() * WORLD_HEIGHT;

  return new Snake(spawnX, spawnY, color, true, newName);
}

// Inialize values, arrays and starting the game

const bots = []; //Initialize an empty array first

const allSnakes = [];

const player = new Snake(
  canvas.width / 2,
  canvas.height / 2,
  "#4444ff",
  false,
  "Player"
);
allSnakes.push(player);

const safePosition = player.findSafeSpawnPosition(); // Find safe position *after* adding to allSnakes
player.reset(safePosition.x, safePosition.y);

for (let i = 0; i < NUM_OF_BOTS; i++) {
  const newBot = createBot(
    Math.random() * canvas.width,
    Math.random() * canvas.height,
    getRandomBotColor(),
    allSnakes
  );
  bots.push(newBot);
  allSnakes.push(newBot); // Add the new bot to allSnakes *immediately*
}

const foods = Array(INITIAL_FOOD_COUNT)
  .fill(null)
  .map(() => new Food());

const flyingFoodInterval = 9000;

setInterval(() => {
  const isFlying = Math.random() < 0.4; // 20% chance of flying food (adjust if needed)
  if (isFlying) {
    foods.push(new Food(true)); // Create a flying food
  }
}, flyingFoodInterval); // 5000 milliseconds = 5 seconds

document.addEventListener("mousemove", (e) => {
  if (!player.isAlive || player.isDying) return;

  // Calculate mouse position relative to camera and world coordinates
  const mouseX = e.clientX - canvas.offsetLeft + camera.x;
  const mouseY = e.clientY - canvas.offsetTop + camera.y;

  // Calculate direction relative to snake head
  const head = player.segments[0];
  const dx = mouseX - head.x;
  const dy = mouseY - head.y;

  let newDirection = { x: dx, y: dy };

  const length = Math.sqrt(
    newDirection.x * newDirection.x + newDirection.y * newDirection.y
  );
  if (length > 0) {
    newDirection.x /= length;
    newDirection.y /= length;
  } else {
    newDirection = { x: 1, y: 0 };
  }

  const targetSmoothing = 0.5; // Slightly increased for more responsive movement
  player.targetDirection.x = lerp(
    player.targetDirection.x,
    newDirection.x,
    targetSmoothing
  );
  player.targetDirection.y = lerp(
    player.targetDirection.y,
    newDirection.y,
    targetSmoothing
  );
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && player.isAlive && player.canSpeedBoost()) {
    player.isSpeedingUp = true;
    player.lastSpeedBoostTime = Date.now();
  }
});

document.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    player.isSpeedingUp = false;
  }
});

document.addEventListener("mousedown", (event) => {
  if (event.button === 0 && player.isAlive && player.canSpeedBoost()) {
    // Check for left mouse button click (button 0)
    player.isSpeedingUp = true;
  }
});

document.addEventListener("mouseup", (event) => {
  if (event.button === 0) {
    player.isSpeedingUp = false;
  }
});

function getClosestFoodColor(snakeColor) {
  let closestColor = null;
  let minDistance = Infinity;

  const snakeRGB = hexToRgb(snakeColor); // Helper function (see below)

  basicFoodColors.forEach((foodColor) => {
    const foodRGB = hexToRgb(foodColor);
    const distance = colorDistance(snakeRGB, foodRGB); // Helper function (see below)

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = foodColor;
    }
  });

  return closestColor;
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// Helper function to calculate color distance (Euclidean distance)
function colorDistance(rgb1, rgb2) {
  const rWeight = 0.3; // Adjust these weights as needed
  const gWeight = 0.59;
  const bWeight = 0.11;

  return Math.sqrt(
    rWeight * Math.pow(rgb1.r - rgb2.r, 2) +
      gWeight * Math.pow(rgb1.g - rgb2.g, 2) +
      bWeight * Math.pow(rgb1.b - rgb2.b, 2)
  );
}

function getRandomSafePosition() {
  const SAFE_DISTANCE_FROM_BORDER = 400;

  let x, y;
  do {
    x = Math.random() * WORLD_WIDTH;
    y = Math.random() * WORLD_HEIGHT;
  } while (
    x < SAFE_DISTANCE_FROM_BORDER ||
    x > WORLD_WIDTH - SAFE_DISTANCE_FROM_BORDER ||
    y < SAFE_DISTANCE_FROM_BORDER ||
    y > WORLD_HEIGHT - SAFE_DISTANCE_FROM_BORDER
  );
  return { x, y };
}

function checkCollisions() {
  allSnakes.forEach((snake) => {
    if (!snake.isAlive || snake.isDying) return;

    const head = snake.segments[0];

    // Check border collisions
    if (
      head.x <= 0 ||
      head.x >= WORLD_WIDTH ||
      head.y <= 0 ||
      head.y >= WORLD_HEIGHT
    ) {
      handleSnakeDeath(snake); // Use a function to handle death logic
      return;
    }

    const snakeDirection = snake.direction;

    for (let i = foods.length - 1; i >= 0; i--) {
      const food = foods[i];

      if (food.isFlying && !food.fleeing) {
        food.flee(head, snakeDirection);
      }

      const dx = head.x - food.position.x;
      const dy = head.y - food.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < snake.size + food.size) {
        foods.splice(i, 1);

        // *** KEY CHANGE: Reduced flying food probability ***
        const isFlying = Math.random() < 0.1; // 10% chance (adjust as needed)

        // Controlled food spawning
        const currentTime = Date.now();
        if (
          foods.length < MAX_TOTAL_FOODS &&
          currentTime - lastFoodSpawn >= FOOD_SPAWN_DELAY
        ) {
          const isFlying = Math.random() < 0.1;
          const safePosition = getRandomSafePosition(); // Get a safe position
          const newFood = new Food(isFlying);
          newFood.position = safePosition; // Set the food's position to the safe one
          foods.push(newFood);
          lastFoodSpawn = currentTime;
        }

        if (snake.segments.length < snake.MAX_LENGTH) {
          snake.grow(food.value);
        }

        snake.foodEaten += food.value * 0.2;
        break;
      }
    }
  });

  for (let i = 0; i < allSnakes.length; i++) {
    const snake1 = allSnakes[i];
    if (!snake1.isAlive || snake1.isDying) continue;

    const head1 = snake1.segments[0];

    for (let j = 0; j < allSnakes.length; j++) {
      const snake2 = allSnakes[j];
      if (snake1 === snake2 || !snake2.isAlive || snake2.isDying) continue;

      for (let k = 0; k < snake2.segments.length; k++) {
        const segment = snake2.segments[k];
        const dx = head1.x - segment.x;
        const dy = head1.y - segment.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const collisionSize = k === 0 ? snake2.size : snake2.size * 0.8;
        if (distance < snake1.size + collisionSize * 0.7) {
          handleSnakeDeath(snake1); // Use the same function for snake-snake collisions
          return; // Exit after collision
        }
      }
    }
  }
}

function handleSnakeDeath(snake) {
  snake.lives = Math.max(0, snake.lives - 1);
  snake.isDying = true;
  snake.deathProgress = 0;

  if (snake.lives <= 0) {
    const dyingSegments = [...snake.segments];
    const spreadFactor = 2.5;
    const closestFoodColor = getClosestFoodColor(snake.color);

    dyingSegments.forEach((segment) => {
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * snake.size * spreadFactor;

      const foodX = segment.x + radius * Math.cos(angle);
      const foodY = segment.y + radius * Math.sin(angle);

      const newFood = new Food();
      newFood.color = closestFoodColor;
      newFood.position = { x: foodX, y: foodY };
      foods.push(newFood);
    });

    const botIndex = bots.indexOf(snake);
    if (botIndex !== -1) {
      bots.splice(botIndex, 1);
    }

    const snakeIndex = allSnakes.indexOf(snake);
    if (snakeIndex !== -1) {
      allSnakes.splice(snakeIndex, 1);
    }

    // Create new bot (if the snake was a bot)
    if (snake.isBot) {
      const newBot = createBot(0, 0, getRandomColor(), allSnakes); // Initial position is irrelevant

      // Use the Snake class's findSafeSpawnPosition method
      const safePosition = newBot.findSafeSpawnPosition(); // Call it on the new bot instance

      newBot.reset(safePosition.x, safePosition.y); // *RESET* the bot at the safe position

      // Give the new bot a random direction away from other snakes
      let bestDirection = { x: 0, y: 0 };
      let maxSeparation = -1;

      for (const otherSnake of allSnakes) {
        if (otherSnake.isAlive && otherSnake !== newBot) {
          const dx = newBot.segments[0].x - otherSnake.segments[0].x;
          const dy = newBot.segments[0].y - otherSnake.segments[0].y;
          const separation = Math.sqrt(dx * dx + dy * dy);

          if (separation > maxSeparation) {
            maxSeparation = separation;
            bestDirection = { x: -dx, y: -dy };
          }
        }
      }

      // Normalize the direction vector
      const length = Math.sqrt(
        bestDirection.x * bestDirection.x + bestDirection.y * bestDirection.y
      );
      if (length > 0) {
        bestDirection.x /= length;
        bestDirection.y /= length;
      } else {
        // Default direction if no other snakes are found
        bestDirection = { x: Math.random() - 0.5, y: Math.random() - 0.5 };
        const length = Math.sqrt(
          bestDirection.x * bestDirection.x + bestDirection.y * bestDirection.y
        );
        bestDirection.x /= length;
        bestDirection.y /= length;
      }

      if (
        bestDirection.x !== newBot.direction.x ||
        bestDirection.y !== newBot.direction.y
      ) {
        newBot.targetDirection = bestDirection;
      } else {
        // Choose a slightly different target direction (e.g., rotate by a small angle)
        const angle = Math.random() * 0.1 - 0.05; // Small random angle
        const newTargetX =
          bestDirection.x * Math.cos(angle) - bestDirection.y * Math.sin(angle);
        const newTargetY =
          bestDirection.x * Math.sin(angle) + bestDirection.y * Math.cos(angle);
        newBot.targetDirection = { x: newTargetX, y: newTargetY };
      }

      // Add a small random offset to targetDirection
      const offsetMagnitude = 0.05; // Adjust this value (0.01 - 0.1 are good ranges)
      newBot.targetDirection.x += (Math.random() - 0.5) * offsetMagnitude;
      newBot.targetDirection.y += (Math.random() - 0.5) * offsetMagnitude;

      // Normalize targetDirection again after applying the offset (important!)
      const targetLength = Math.sqrt(
        newBot.targetDirection.x * newBot.targetDirection.x +
          newBot.targetDirection.y * newBot.targetDirection.y
      );
      newBot.targetDirection.x /= targetLength;
      newBot.targetDirection.y /= targetLength;

      newBot.direction = bestDirection; // Keep direction the same as before

      allSnakes.push(newBot);
      bots.push(newBot);
    }
  }
}

// Helper function to generate random colors for new bots
function getRandomColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r}, ${g}, ${b})`;
}

function updateStats() {
  statsDiv.innerHTML = allSnakes
    .map((snake) => {
      let statusIndicator = ""; // Initialize status indicator

      if (snake.isAlive && !snake.isDying) {
        statusIndicator = '<span class="active-indicator"></span>'; // Green circle
      } else if (snake.lives > 0) {
        statusIndicator = '<span class="respawning-indicator">|</span>'; // Spinning |
      }

      return `
                <div class="player-stats">
                    <strong>${snake.name}</strong>: 
                    ${snake.lives} ${snake.lives === 1 ? "life" : "lives"} | 
                    ${snake.segments.length}/${snake.getCurrentMaxLength()} |
                    ${statusIndicator} 
                </div>
            `;
    })
    .join("");

  const respawningIndicators = document.querySelectorAll(
    ".respawning-indicator"
  );

  respawningIndicators.forEach((indicator) => {
    let rotation = 0;
    const animationInterval = setInterval(() => {
      rotation += 5; // Adjust rotation speed
      indicator.style.transform = `rotate(${rotation}deg)`;

      if (rotation >= 360) {
        rotation = 0; // Reset rotation
      }
    }, 20); // Adjust interval for smoothness
  });

  // Position stats div *inside* the canvas:
  statsDiv.style.position = "absolute";
  statsDiv.style.top = "56px"; // Adjust as needed
  statsDiv.style.left = "1058px"; // Adjust as needed
  statsDiv.style.color = "white"; // White text
  statsDiv.style.fontSize = "12px";
  statsDiv.style.fontFamily = "sans-serif"; // Use a standard font
  statsDiv.style.pointerEvents = "none"; // Allow clicks to pass through
  statsDiv.style.zIndex = "100";
  statsDiv.style.opacity = "10";
}

function drawRadar() {
  radarCtx.clearRect(0, 0, radarCanvas.width, radarCanvas.height);

  const radarScale = Math.min(
    radarCanvas.width / WORLD_WIDTH,
    radarCanvas.height / WORLD_HEIGHT
  );

  // Draw foods on the radar (much smaller)
  foods.forEach((food) => {
    const radarX = food.position.x * radarScale;
    const radarY = food.position.y * radarScale;

    radarCtx.fillStyle = food.isFlying ? "gold" : "lightgreen";
    radarCtx.beginPath();
    radarCtx.arc(radarX, radarY, 1, 0, Math.PI * 2); // Even smaller food dots
    radarCtx.fill();
  });

  // Draw player on the radar (slightly larger)
  const playerRadarX = player.segments[0].x * radarScale;
  const playerRadarY = player.segments[0].y * radarScale;

  radarCtx.fillStyle = player.color;
  radarCtx.beginPath();
  radarCtx.arc(playerRadarX, playerRadarY, 2, 0, Math.PI * 2); // Smaller player dot
  radarCtx.fill();

  // Draw the camera viewport on the radar
  const cameraX = camera.x * radarScale;
  const cameraY = camera.y * radarScale;
  const cameraWidth = VIEWPORT_WIDTH * radarScale;
  const cameraHeight = VIEWPORT_HEIGHT * radarScale;

  radarCtx.strokeStyle = "white";
  radarCtx.lineWidth = 1;
  radarCtx.strokeRect(cameraX, cameraY, cameraWidth, cameraHeight);
}

function update(deltaTime) {
  updateStats();

  const allSnakesCopy = [...allSnakes]; // Create a copy to avoid concurrent modification issues.

  // Update camera position based on player position
  if (player.isAlive) {
    camera.update(player.segments[0].x, player.segments[0].y);
  }

  // Clear the entire viewport
  ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  // Draw world border
  ctx.strokeStyle = "#FF4444";
  ctx.lineWidth = 4;
  ctx.strokeRect(-camera.x, -camera.y, WORLD_WIDTH, WORLD_HEIGHT);

  // Draw background grid (optional, for better spatial awareness)
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1;
  const gridSize = 100;
  const startX = Math.floor(camera.x / gridSize) * gridSize;
  const startY = Math.floor(camera.y / gridSize) * gridSize;

  for (
    let x = startX;
    x < camera.x + VIEWPORT_WIDTH + gridSize;
    x += gridSize
  ) {
    if (x >= 0 && x <= WORLD_WIDTH) {
      ctx.beginPath();
      ctx.moveTo(x - camera.x, 0);
      ctx.lineTo(x - camera.x, VIEWPORT_HEIGHT);
      ctx.stroke();
    }
  }

  for (
    let y = startY;
    y < camera.y + VIEWPORT_HEIGHT + gridSize;
    y += gridSize
  ) {
    if (y >= 0 && y <= WORLD_HEIGHT) {
      ctx.beginPath();
      ctx.moveTo(0, y - camera.y);
      ctx.lineTo(VIEWPORT_WIDTH, y - camera.y);
      ctx.stroke();
    }
  }

  foods.forEach((food) => {
    food.update(); // Update food position (for flying food)
    food.draw();
  });

  allSnakesCopy.forEach((snake) => {
    snake.update(foods, allSnakesCopy, deltaTime);
    snake.draw();
  });

  checkCollisions();
}

let lastTime = performance.now();

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawRadar();

  const currentTime = performance.now();
  let deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds

  // Clamp deltaTime to prevent huge jumps
  deltaTime = Math.min(deltaTime, 1 / 30); // Cap at 1/30th of a second

  update(deltaTime);

  const gameOver = player.lives <= 0;

  if (!gameOver) {
    lastTime = currentTime;
    requestAnimationFrame(gameLoop);
  } else {
    // Game Over Overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Grayed mask
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle"; // Vertically center text
    ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2);

    // Stop the game loop (optional, but good practice)
    cancelAnimationFrame(gameLoop); // Stop the animation frame
  }
}

gameLoop();

const canvas = document.getElementById("gameCanvas");
const WORLD_HEIGHT = canvas.height * 3;
const WORLD_WIDTH = canvas.width * 3;
const VIEWPORT_WIDTH = canvas.width;
const VIEWPORT_HEIGHT = canvas.height;

const ctx = canvas.getContext("2d");
const statsDiv = document.getElementById("stats");

const radarCanvas = document.getElementById("radarCanvas");
const radarCtx = radarCanvas.getContext("2d");

const CAUTIOUS_LEVEL = 0.7;
const MAX_TOTAL_FOODS = 200;
const INITIAL_FOOD_COUNT = 60;
const NUM_OF_BOTS = 5;
const FOOD_SPAWN_DELAY = 2000; // Initial spawn delay (milliseconds)
let lastFoodSpawn = 0; // Track the last food spawn time

const botNames = [
  "Slitherin",
  "Viper",
  "Cobra",
  "Python",
  "Anaconda",
  "Mamba",
  "Asp",
  "Rattler",
  "Boa",
  "Serpent",
  "Sidewinder",
  "Boomslang",
  "Racer",
  "Kingsnake",
  "Coral",
  "Cottonmouth",
  "Copperhead",
  "Harlequin",
  "Gaboon",
  "Moccasin",
];

const botColors = [
  "#0056b3", // Dark Blue
  "#006400", // Dark Green
  "#8B4513", // Saddle Brown
  "#800000", // Maroon
  "#4B0082", // Indigo
  "#2F4F4F", // Dark Slate Gray
  "#A0522D", // Sienna
  "#8B0000", // Dark Red
  "#228B22", // Forest Green
  "#B8860B", // Dark Goldenrod
  "#A52A2A", // Brown
  "#DC143C", // Crimson
  "#00008B", // Dark Blue
  "#008B8B", // Dark Cyan
  "#B22222", // Firebrick
  "#FF4500", // Orange Red
  "#9932CC", // Dark Orchid
  "#8FBC8F", // Dark Sea Green
  "#282c34", // Darker Gray/Near Black
  "#003f5c", // Dark Blue
  "#58508d", // Dark Purple
  "#bc5090", // Dark Pink/Magenta
  "#ff6361", // Dark Coral/Red
  "#ffa60a", // Dark Orange/Gold
  "#ffd700", // Darker Yellow/Gold
  "#008000", // Dark Green
  "#006400", // Forest Green
  "#228B22", // Medium Sea Green
  "#008080", // Teal
  "#4682B4", // Steel Blue
  "#2F4F4F", // Dark Slate Gray
  "#708090", // Slate Gray
  "#8B0000", // Dark Red
  "#A0522D", // Sienna Brown
  "#8B4513", // Saddle Brown
  "#4B0082", // Indigo
  "#9400D3", // Dark Violet
  "#00008B", // Dark Blue
];

class Snake {
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

    // Constants (tune these as needed)
    this.SAFE_SPAWN_DISTANCE = 70;
    this.RESPAWN_TIME = 180;
    this.MIN_SEGMENT_SIZE = 1.5;
    this.BASE_LENGTH = 50; // Initial length (segments)
    this.MAX_LENGTH = Math.floor(this.BASE_LENGTH * 2.5); // Maximum length (segments)
    this.GROWTH_RATE = 0.2; // Segments gained per food eaten
    this.SPEED_BOOST_COST = 2; // Segments lost per second of speed boost
    this.BASE_SPEED = 1.6;
    this.SPEED_BOOST = 1.5;

    // Variables (updated during game)
    this.reset(x, y);
    this.size = 6;
    this.lives = 3; // Each snake starts with 3 lives
    this.isAlive = true;
    this.respawnTimer = 0;
    this.targetPoint = null;
    this.opacity = 1;
    this.isDying = false;
    this.deathProgress = 0;
    this.foodEaten = 0;

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
    this.trailMaxLength = 25; // Adjust trail length
  }

  reset(x, y) {
    this.segments = [{ x, y }];
    this.direction = { x: 1, y: 0 };
    this.isAlive = true;
    this.opacity = 1;
    this.isDying = false;
    this.deathProgress = 0;
  }

  getCurrentMaxLength() {
    const potentialGrowth = this.MAX_LENGTH - this.BASE_LENGTH;
    const currentGrowth = Math.min(
      potentialGrowth * this.foodEaten * this.GROWTH_RATE,
      potentialGrowth
    );
    return Math.floor(this.BASE_LENGTH + currentGrowth);
  }

  grow() {
    this.foodEaten += 0.2; // This is for length growth only

    const newSegment = { ...this.segments[this.segments.length - 1] }; // Duplicate the last segment
    this.segments.push(newSegment); // Add a new segment at the tail
  }

  update(foods, otherSnakes) {
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

    const head = this.segments[0];
    const newHead = {
      x: head.x + this.direction.x * this.speed,
      y: head.y + this.direction.y * this.speed,
    };

    // Wrap around screen edges
    if (newHead.x < 0) newHead.x = WORLD_WIDTH;
    if (newHead.x > WORLD_WIDTH) newHead.x = 0;
    if (newHead.y < 0) newHead.y = WORLD_HEIGHT;
    if (newHead.y > WORLD_HEIGHT) newHead.y = 0;

    this.segments.unshift(newHead);

    if (this.isSpeedingUp) {
      this.trail.push({ x: newHead.x, y: newHead.y }); // Use the *new* head position

      if (this.trail.length > this.trailMaxLength) {
        this.trail.shift();
      }
    } else {
      this.trail = [];
    }

    // Maintain correct length
    while (this.segments.length > targetLength) {
      this.segments.pop();
    }
  }

  canSpeedBoost() {
    return this.segments.length > this.BASE_LENGTH;
  }

  updateAI(foods, otherSnakes) {
    const head = this.segments[0];

    let nearestFood = null;
    let minFoodDistance = Infinity;

    foods.forEach((food) => {
      if (food.isFlying) {
        // Prioritize flying food
        const distance = this.getDistance(head, food.position);
        if (distance < minFoodDistance) {
          minFoodDistance = distance;
          nearestFood = food;
        }
      } else if (!this.isChasingFlyingFood) {
        // If no flying food and not already chasing one, consider regular food
        const distance = this.getDistance(head, food.position);
        if (distance < minFoodDistance) {
          minFoodDistance = distance;
          nearestFood = food;
        }
      }
    });

    let bestTarget = nearestFood ? nearestFood.position : null; // Default to food
    let minThreatDistance = Infinity;
    let threatLevel = 0;
    let avoidanceVector = { x: 0, y: 0 };

    otherSnakes.forEach((otherSnake) => {
      if (otherSnake !== this && otherSnake.isAlive && !otherSnake.isDying) {
        const otherHead = otherSnake.segments[0];

        // 1. Predict other snake's future positions (more advanced prediction)
        let futureHead = { ...otherHead }; // Start with current head
        for (let i = 0; i < 10; i++) {
          // Predict 10 steps into the future (adjust as needed)
          futureHead.x += otherSnake.direction.x * 20; // Adjust 20 for prediction distance
          futureHead.y += otherSnake.direction.y * 20;

          // 2. Calculate the "threat" distance to each future position
          const threatDistance = this.getDistance(head, futureHead);

          if (threatDistance < minThreatDistance) {
            minThreatDistance = threatDistance;

            // 3. Target a point *beyond* the *furthest predicted* head position
            const dx = futureHead.x - head.x;
            const dy = futureHead.y - head.y;

            // *** INCREASED APPROACH DISTANCE (MORE CAUTIOUS) ***
            const approachDistance = otherSnake.size * 3; // Adjust for cautiousness (3 is a good starting point)

            bestTarget = {
              x: futureHead.x + (dx * approachDistance) / threatDistance,
              y: futureHead.y + (dy * approachDistance) / threatDistance,
            };
          }

          // *** INCREASED THREAT RANGE ***
          threatLevel += Math.max(0, 100 - threatDistance); // Increased threat range (adjust 100 as needed)
        }

        for (const segment of otherSnake.segments) {
          const segmentDistance = this.getDistance(head, segment);

          // 1. Immediate Avoidance (High Priority)
          if (segmentDistance < this.size * 2) {
            // Very close!
            const dx = head.x - segment.x;
            const dy = head.y - segment.y;
            const avoidanceDirection = {
              x: dx / segmentDistance,
              y: dy / segmentDistance,
            };
            avoidanceVector.x += avoidanceDirection.x * 10; // Stronger force
            avoidanceVector.y += avoidanceDirection.y * 10;
          }

          // 2. Predictive Avoidance (Lower Priority)
          const predictedSegmentX = segment.x + otherSnake.direction.x * 10;
          const predictedSegmentY = segment.y + otherSnake.direction.y * 10;
          const predictedSegmentDistance = this.getDistance(head, {
            x: predictedSegmentX,
            y: predictedSegmentY,
          });
          if (predictedSegmentDistance < this.size * 4) {
            // Larger range
            const dx = head.x - predictedSegmentX;
            const dy = head.y - predictedSegmentY;
            const avoidanceDirection = {
              x: dx / predictedSegmentDistance,
              y: dy / predictedSegmentDistance,
            };

            avoidanceVector.x += avoidanceDirection.x * 5; // Weaker force
            avoidanceVector.y += avoidanceDirection.y * 5;
          }
        }
      }
    });

    // *** APPLY AVOIDANCE VECTOR ***
    if (bestTarget) {
      bestTarget.x += avoidanceVector.x;
      bestTarget.y += avoidanceVector.y;

      // Add wandering behavior here
      const wanderRadius = 50;
      const wanderOffset = Math.random() * Math.PI * 2;
      bestTarget.x += Math.cos(wanderOffset) * wanderRadius;
      bestTarget.y += Math.sin(wanderOffset) * wanderRadius;

      // Add some randomness to movement
      const jitter = 0.3;
      bestTarget.x += (Math.random() - 0.5) * jitter;
      bestTarget.y += (Math.random() - 0.5) * jitter;

      // Then normalize the vector from head to bestTarget
      const dx = bestTarget.x - head.x;
      const dy = bestTarget.y - head.y;
      const targetDistance = Math.sqrt(dx * dx + dy * dy);

      if (targetDistance > 0) {
        bestTarget.x = head.x + (dx / targetDistance) * 100; // Limit target distance
        bestTarget.y = head.y + (dy / targetDistance) * 100; // Limit target distance
      }
    } else {
      this.direction.x += avoidanceVector.x * 0.1;
      this.direction.y += avoidanceVector.y * 0.1;

      const length = Math.sqrt(
        this.direction.x * this.direction.x +
          this.direction.y * this.direction.y
      );
      this.direction.x /= length;
      this.direction.y /= length;

      this.speed = this.baseSpeed;
      return;
    }

    if (nearestFood && nearestFood.isFlying) {
      this.isChasingFlyingFood = true; // Set flag
    } else {
      this.isChasingFlyingFood = false; // Reset flag when not chasing flying food
    }

    const dx = bestTarget.x - head.x;
    const dy = bestTarget.y - head.y;
    const desiredDirection = { x: dx, y: dy };
    const length = Math.sqrt(
      desiredDirection.x * desiredDirection.x +
        desiredDirection.y * desiredDirection.y
    );

    if (length > 0) {
      desiredDirection.x /= length;
      desiredDirection.y /= length;

      const smoothingFactor = 0.1; // Adjust this value (0.0 - 1.0)
      this.direction.x =
        this.direction.x * (1 - smoothingFactor) +
        desiredDirection.x * smoothingFactor;
      this.direction.y =
        this.direction.y * (1 - smoothingFactor) +
        desiredDirection.y * smoothingFactor;

      const smoothedLength = Math.sqrt(
        this.direction.x * this.direction.x +
          this.direction.y * this.direction.y
      );
      this.direction.x /= smoothedLength;
      this.direction.y /= smoothedLength;
    }
  }

  getDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  respawn() {
    if (this.lives > 0) {
      let safePosition = this.findSafeSpawnPosition();
      this.reset(safePosition.x, safePosition.y);
      this.targetPoint = null;
    }
  }

  findSafeSpawnPosition() {
    let attempts = 0;
    let position;

    do {
      position = {
        x: Math.random() * (WORLD_WIDTH - 100) + 50,
        y: Math.random() * (WORLD_HEIGHT - 100) + 50,
      };
      attempts++;
    } while (this.isPositionNearSnakes(position) && attempts < 10);

    return position;
  }

  isPositionNearSnakes(position) {
    return allSnakes.some((snake) => {
      if (snake === this || !snake.isAlive || snake.isDying) return false;
      const distance = this.getDistance(position, snake.segments[0]);
      return distance < this.SAFE_SPAWN_DISTANCE;
    });
  }

  draw() {
    if (!this.isAlive && !this.isDying) return;

    const scale = 1.6;
    ctx.globalAlpha = this.opacity;

    if (this.isSpeedingUp) {
      this.trail.forEach((segment, index) => {
        const screenX = segment.x - camera.x;
        const screenY = segment.y - camera.y;

        // Only draw trail segments within the viewport
        if (
          screenX >= -10 &&
          screenX <= VIEWPORT_WIDTH + 10 &&
          screenY >= -10 &&
          screenY <= VIEWPORT_HEIGHT + 10
        ) {
          const alpha = ((index + 1) / this.trail.length) * 0.5;

          // Subtle Glow (drawn first)
          const glowAlpha = alpha * 0.3; // Even more transparent
          ctx.fillStyle = `rgba(255, 190, 0, ${glowAlpha})`; // Same orange, more transparent
          ctx.beginPath();
          ctx.arc(
            screenX,
            screenY,
            this.size * (1.4 - index / this.trail.length / 3) * scale,
            0,
            Math.PI * 2
          ); // Slightly larger
          ctx.fill();

          ctx.fillStyle = `rgba(255, 153, 0, ${alpha})`;
          ctx.beginPath();
          ctx.arc(
            screenX,
            screenY,
            this.size * (1.2 - index / this.trail.length / 3) * scale,
            0,
            Math.PI * 2
          ); // Apply scale to trail size
          ctx.fill();
        }
      });
    }

    ctx.fillStyle = this.color;

    // Transform all coordinates relative to camera
    this.segments.forEach((segment, index) => {
      const screenX = segment.x - camera.x;
      const screenY = segment.y - camera.y;

      // Only draw segments that are within the viewport
      if (
        screenX >= -10 &&
        screenX <= VIEWPORT_WIDTH + 10 &&
        screenY >= -10 &&
        screenY <= VIEWPORT_HEIGHT + 10
      ) {
        const originalSize = Math.max(
          this.size * (1 - index / this.segments.length),
          this.MIN_SEGMENT_SIZE
        );
        const size = originalSize * scale;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
      }
    });

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
      ctx.fillStyle = "white";
      const eyeOffset = 2 * scale;
      const eyeSize = 1.5 * scale;

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

      // Draw iris
      const irisSize = eyeSize * 0.8;
      const dxLeft = this.cursorX - (screenHeadX + eyeX - eyeY);
      const dyLeft = this.cursorY - (screenHeadY + eyeY + eyeX);
      const distanceLeft = Math.sqrt(dxLeft * dxLeft + dyLeft * dyLeft);
      const irisXLeft = (dxLeft / distanceLeft) * (eyeSize - irisSize);
      const irisYLeft = (dyLeft / distanceLeft) * (eyeSize - irisSize);

      const dxRight = this.cursorX - (screenHeadX + eyeX + eyeY);
      const dyRight = this.cursorY - (screenHeadY + eyeY - eyeX);
      const distanceRight = Math.sqrt(dxRight * dxRight + dyRight * dyRight);
      const irisXRight = (dxRight / distanceRight) * (eyeSize - irisSize);
      const irisYRight = (dyRight / distanceRight) * (eyeSize - irisSize);

      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(
        screenHeadX + eyeX - eyeY + irisXLeft,
        screenHeadY + eyeY + eyeX + irisYLeft,
        irisSize,
        0,
        Math.PI * 2
      );
      ctx.arc(
        screenHeadX + eyeX + eyeY + irisXRight,
        screenHeadY + eyeY - eyeX + irisYRight,
        irisSize,
        0,
        Math.PI * 2
      );
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

    if (this.isFlying) {
      this.blinkInterval = 500; // Adjust blink interval (milliseconds)
      this.lastBlink = 0;
      this.isFlickering = false; // Add a flag to track flickering state
      this.fleeingBlinkInterval = 300; // Fleeing blink interval (faster)
      this.fleeingLastBlink = 0;
      this.isFleeingFlickering = false; // Add a flag to track fleeing flickering state

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
    // Transform coordinates relative to camera
    const screenX = this.position.x - camera.x;
    const screenY = this.position.y - camera.y;

    // Only draw if within viewport
    if (
      screenX >= -10 &&
      screenX <= VIEWPORT_WIDTH + 10 &&
      screenY >= -10 &&
      screenY <= VIEWPORT_HEIGHT + 10
    ) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
      ctx.fill();

      if (this.isFlying) {
        let currentBlinkInterval = this.blinkInterval;
        let isCurrentlyFlickering = this.isFleeingFlickering
          ? this.isFleeingFlickering
          : this.isFlickering;
        let lastBlinkTime = this.fleeingLastBlink || this.lastBlink;
        let shadowSizeMultiplier = this.fleeing ? 1.4 : 1.2;

        const currentTime = Date.now();
        if (currentTime - lastBlinkTime >= currentBlinkInterval) {
          if (this.fleeing) {
            this.isFleeingFlickering = !this.isFleeingFlickering;
            this.fleeingLastBlink = currentTime;
          } else {
            this.isFlickering = !this.isFlickering;
            this.lastBlink = currentTime;
          }
        }

        if (isCurrentlyFlickering) {
          ctx.fillStyle = this.shadowColor;
          ctx.beginPath();
          ctx.arc(
            screenX,
            screenY,
            this.size * shadowSizeMultiplier,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }
  }
}

function getRandomBotColor() {
  return botColors[Math.floor(Math.random() * botColors.length)];
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

const player = new Snake(
  canvas.width / 2,
  canvas.height / 2,
  "#4444ff",
  false,
  "Player"
);
const bots = []; //Initialize an empty array first

const allSnakes = [player];

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

function createBot(x, y, color, allSnakes) {
  //allSnakes parameter is added
  let newName;
  do {
    newName = botNames[Math.floor(Math.random() * botNames.length)];
  } while (Snake.isNameTaken(newName, allSnakes));

  // Use WORLD_WIDTH and WORLD_HEIGHT instead of canvas dimensions
  const spawnX = Math.random() * WORLD_WIDTH;
  const spawnY = Math.random() * WORLD_HEIGHT;

  return new Snake(spawnX, spawnY, color, true, newName);
}

const foods = Array(INITIAL_FOOD_COUNT)
  .fill(null)
  .map(() => new Food());

const flyingFoodInterval = 9000;

setInterval(() => {
  const isFlying = Math.random() < 0.2; // 20% chance of flying food (adjust if needed)
  if (isFlying) {
    foods.push(new Food(true)); // Create a flying food
  }
}, flyingFoodInterval); // 5000 milliseconds = 5 seconds

document.addEventListener("mousemove", (e) => {
  if (!player.isAlive || player.isDying) return;

  const rect = canvas.getBoundingClientRect();

  // Add camera offset to get world coordinates
  const mouseX = e.clientX - rect.left + camera.x;
  const mouseY = e.clientY - rect.top + camera.y;

  const head = player.segments[0];
  const dx = mouseX - head.x;
  const dy = mouseY - head.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length > 0) {
    player.direction.x = dx / length;
    player.direction.y = dy / length;
  }

  // Update cursor position for eye movement
  player.cursorX = e.clientX - rect.left;
  player.cursorY = e.clientY - rect.top;
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

function checkCollisions() {
  allSnakes.forEach((snake) => {
    if (!snake.isAlive || snake.isDying) return;

    const head = snake.segments[0];
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

        // *** KEY CHANGE: Controlled food spawning ***
        const currentTime = Date.now();
        if (
          foods.length < MAX_TOTAL_FOODS &&
          currentTime - lastFoodSpawn >= FOOD_SPAWN_DELAY
        ) {
          foods.push(new Food(isFlying));
          lastFoodSpawn = currentTime;
        }

        if (snake.segments.length < snake.MAX_LENGTH) {
          snake.grow();
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
          // *** KEY CHANGES: Handling death and food conversion ***
          snake1.lives = Math.max(0, snake1.lives - 1);
          snake1.isDying = true;
          snake1.deathProgress = 0;

          if (snake1.lives <= 0) {
            console.log(`${snake1.name} is out of lives!`);

            const dyingSegments = [...snake1.segments];
            const spreadFactor = 2.5;

            // Convert segments to food before removing the snake:
            dyingSegments.forEach((segment) => {
              const angle = Math.random() * 2 * Math.PI;
              const radius = Math.random() * snake1.size * spreadFactor; // Use spreadFactor here

              const foodX = segment.x + radius * Math.cos(angle);
              const foodY = segment.y + radius * Math.sin(angle);

              const newFood = new Food();
              newFood.position = { x: foodX, y: foodY };
              foods.push(newFood);
            });

            const botIndex = bots.indexOf(snake1);
            if (botIndex !== -1) {
              bots.splice(botIndex, 1);
            }

            const snakeIndex = allSnakes.indexOf(snake1);
            if (snakeIndex !== -1) {
              allSnakes.splice(snakeIndex, 1);
            }

            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const newBot = createBot(x, y, getRandomColor(), allSnakes);

            allSnakes.push(newBot);
            bots.push(newBot);
          } else {
            console.log(
              `${snake1.name} lost a life! Remaining lives: ${snake1.lives}`
            );
          }
          return; // Exit after collision (only one snake should be affected)
        }
      }
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
      const statusClass = snake.isAlive && !snake.isDying ? "alive" : "dead";
      let status = "Dead";
      if (snake.isAlive) status = "Active";
      else if (snake.isDying) status = "Dying...";
      else if (snake.lives > 0) status = "Respawning...";

      return `
          <div class="player-stats ${statusClass}">
            <strong>${snake.name}</strong>: 
            ${snake.lives} ${snake.lives === 1 ? "life" : "lives"} | 
            Length: ${snake.segments.length}/${snake.getCurrentMaxLength()} |
            Status: ${status}
          </div>
        `;
    })
    .join("");

  // Position stats div inside the canvas:
  statsDiv.style.position = "absolute";
  statsDiv.style.top = "10px"; // Adjust as needed
  statsDiv.style.left = "10px"; // Adjust as needed
  statsDiv.style.backgroundColor = "rgba(255, 255, 255, 0.7)"; // Transparent background
  statsDiv.style.fontSize = "14px"; // Smaller font
  statsDiv.style.padding = "5px"; // Smaller padding
}

function drawRadar() {
  radarCtx.clearRect(0, 0, radarCanvas.width, radarCanvas.height); // Clear radar canvas

  // Calculate radar scale (important!)
  const radarScale = Math.min(
    radarCanvas.width / WORLD_WIDTH,
    radarCanvas.height / WORLD_HEIGHT
  );

  // Draw foods on the radar
  foods.forEach((food) => {
    const radarX = food.position.x * radarScale;
    const radarY = food.position.y * radarScale;

    radarCtx.fillStyle = food.isFlying ? "gold" : "lightgreen";
    radarCtx.beginPath();
    radarCtx.arc(radarX, radarY, 2, 0, Math.PI * 2); // Smaller food dots on radar
    radarCtx.fill();
  });

  // Draw player on the radar
  const playerRadarX = player.segments[0].x * radarScale;
  const playerRadarY = player.segments[0].y * radarScale;

  radarCtx.fillStyle = player.color;
  radarCtx.beginPath();
  radarCtx.arc(playerRadarX, playerRadarY, 4, 0, Math.PI * 2); // Slightly larger player dot
  radarCtx.fill();

  //Draw the camera viewport on the radar
  const cameraX = camera.x * radarScale;
  const cameraY = camera.y * radarScale;
  const cameraWidth = VIEWPORT_WIDTH * radarScale;
  const cameraHeight = VIEWPORT_HEIGHT * radarScale;

  radarCtx.strokeStyle = "white";
  radarCtx.lineWidth = 1;
  radarCtx.strokeRect(cameraX, cameraY, cameraWidth, cameraHeight);
}

function update() {
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
    snake.update(foods, allSnakesCopy);
    snake.draw();
  });

  checkCollisions();
  updateStats();
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawRadar();
  update();

  const gameOver = player.lives <= 0;

  if (!gameOver) {
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

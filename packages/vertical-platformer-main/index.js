const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

// Set canvas to the background image size
canvas.width = 576;
canvas.height = 432;


const floorCollisions2D = [];
for (let i = 0; i < floorCollisions.length; i += 36) {
  floorCollisions2D.push(floorCollisions.slice(i, i + 36));
}

const collisionBlocks = [];
floorCollisions2D.forEach((row, y) => {
  row.forEach((symbol, x) => {
    if (symbol === 202) {
      collisionBlocks.push(
        new CollisionBlock({
          position: {
            x: x * 16,
            y: y * 16,
          },
        })
      );
    }
  });
});

const platformCollisions2D = [];
for (let i = 0; i < platformCollisions.length; i += 36) {
  platformCollisions2D.push(platformCollisions.slice(i, i + 36));
}

// Remove the platform at y: 352 (row 22, columns 3-5)
for (let i = 0; i < platformCollisions.length; i++) {
  const row = Math.floor(i / 36);
  const col = i % 36;
  if (row === 22 && col >= 3 && col <= 5) {
    platformCollisions[i] = 0; // Remove the platform block
  }
}

// Add platforms at y: 32 (row 2, columns 12-14 and 24-26)
for (let i = 0; i < platformCollisions.length; i++) {
  const row = Math.floor(i / 36);
  const col = i % 36;
  if (row === 2 && ((col >= 12 && col <= 14) || (col >= 24 && col <= 26))) {
    platformCollisions[i] = 202; // Add platform blocks
  }
}

// Collect all platforms
const platforms = [];
let currentPlatform = null;

platformCollisions2D.forEach((row, y) => {
  row.forEach((symbol, x) => {
    if (symbol === 202) {
      if (currentPlatform && currentPlatform.y === y && currentPlatform.x + currentPlatform.blocks.length * 16 === x * 16) {
        currentPlatform.blocks.push({
          position: { x: x * 16, y: y * 16 },
          height: 4,
        });
      } else {
        if (currentPlatform) {
          platforms.push(currentPlatform);
        }
        currentPlatform = {
          x: x * 16,
          y: y * 16,
          blocks: [{ position: { x: x * 16, y: y * 16 }, height: 4 }],
        };
      }
    }
  });
});

if (currentPlatform) {
  platforms.push(currentPlatform);
}

// Group platforms by y position
const platformGroups = {};
platforms.forEach(platform => {
  const y = platform.y;
  if (!platformGroups[y]) {
    platformGroups[y] = [];
  }
  platformGroups[y].push(platform);
});

// Define URLs for each level
const levelUrls = {
  1: 'http://localhost:3000/lesson/1', // Level 1 (Lesson 1)
  2: 'http://localhost:3000/lesson/2',
  3: 'http://localhost:3000/lesson/3',
  4: 'http://localhost:3000/lesson/4',
  5: 'http://localhost:3000/lesson/5',
  6: 'https://www.example.com/lesson6',
  7: 'https://www.example.com/lesson7',
  8: 'https://www.example.com/lesson8',
  9: 'https://www.example.com/lesson9',
  10: 'https://www.example.com/lesson10',
  11: 'https://www.example.com/lesson11',
  12: 'https://www.example.com/lesson12',
  13: 'https://www.example.com/lesson13',
  14: 'https://www.example.com/lesson14',
  15: 'https://www.example.com/lesson15',
  16: 'https://www.example.com/lesson16',
  17: 'https://www.example.com/lesson17',
  18: 'https://www.example.com/lesson18',
  19: 'https://www.example.com/lesson19',
};

// Sort y positions (lowest to highest) and assign level numbers
const sortedYPositions = Object.keys(platformGroups).map(Number).sort((a, b) => b - a);
const platformCollisionBlocks = [];
let levelCounter = 1;

sortedYPositions.forEach(y => {
  const platformGroup = platformGroups[y].sort((a, b) => a.x - b.x); // Sort by x position
  let level = levelCounter;
  let lastX = null;

  platformGroup.forEach(platform => {
    // If there is a gap in x positions, increment the level
    if (lastX !== null && platform.x - lastX > 16) {
      level++;
    }

    const platformId = level; 
    platformCollisionBlocks.push(...platform.blocks.map(block => {
      const collisionBlock = new CollisionBlock({
        position: block.position,
        height: block.height,
        level: level,
        platformId: platformId,
        lesson: `lesson${level}`, 
        url: levelUrls[level]// Assign lesson correctly
      });
      console.log(`Tagged Lesson ${level} platform at x: ${block.position.x}, y: ${block.position.y} with URL: ${collisionBlock.url}`);
      return collisionBlock;
    }));

    lastX = platform.x + platform.blocks.length * 16; // Update lastX
  });

  levelCounter = level + 1; // Ensure the next y-level gets a new lesson number
});



const gravity = 0.1;

const player = new Player({
  position: {
    x: 50,
    y: 300, // Start near the bottom-left platform (y: 400)
  },
  collisionBlocks,
  platformCollisionBlocks,
  imageSrc: './img/warrior/Idle.png',
  frameRate: 8,
  animations: {
    Idle: {
      imageSrc: './img/warrior/Idle.png',
      frameRate: 8,
      frameBuffer: 3,
    },
    Run: {
      imageSrc: './img/warrior/Run.png',
      frameRate: 8,
      frameBuffer: 5,
    },
    Jump: {
      imageSrc: './img/warrior/Jump.png',
      frameRate: 2,
      frameBuffer: 3,
    },
    Fall: {
      imageSrc: './img/warrior/Fall.png',
      frameRate: 2,
      frameBuffer: 3,
    },
    FallLeft: {
      imageSrc: './img/warrior/FallLeft.png',
      frameRate: 2,
      frameBuffer: 3,
    },
    RunLeft: {
      imageSrc: './img/warrior/RunLeft.png',
      frameRate: 8,
      frameBuffer: 5,
    },
    IdleLeft: {
      imageSrc: './img/warrior/IdleLeft.png',
      frameRate: 8,
      frameBuffer: 3,
    },
    JumpLeft: {
      imageSrc: './img/warrior/JumpLeft.png',
      frameRate: 2,
      frameBuffer: 3,
    },
  },
});

const keys = {
  d: {
    pressed: false,
  },
  a: {
    pressed: false,
  },
};

const background = new Sprite({
  position: {
    x: 0,
    y: 0,
  },
  imageSrc: './img/background.png',
});

const backgroundImageHeight = 432;

// No camera panning since we're showing the entire image
const camera = {
  position: {
    x: 0,
    y: 0,
  },
};

function animate() {
  window.requestAnimationFrame(animate);
  c.fillStyle = 'white';
  c.fillRect(0, 0, canvas.width, canvas.height);

  c.save();
  // No scaling, display at 1:1
  c.translate(camera.position.x, camera.position.y);
  background.update();
  collisionBlocks.forEach((collisionBlock) => {
    collisionBlock.update();
  });

  platformCollisionBlocks.forEach((block) => {
    block.update();
  });

  player.checkForHorizontalCanvasCollision();
  player.update();

  player.velocity.x = 0;
  if (keys.d.pressed) {
    player.switchSprite('Run');
    player.velocity.x = 2;
    player.lastDirection = 'right';
    // No panning needed
  } else if (keys.a.pressed) {
    player.switchSprite('RunLeft');
    player.velocity.x = -2;
    player.lastDirection = 'left';
    // No panning needed
  } else if (player.velocity.y === 0) {
    if (player.lastDirection === 'right') player.switchSprite('Idle');
    else player.switchSprite('IdleLeft');
  }

  if (player.velocity.y < 0) {
    if (player.lastDirection === 'right') player.switchSprite('Jump');
    else player.switchSprite('JumpLeft');
  } else if (player.velocity.y > 0) {
    if (player.lastDirection === 'right') player.switchSprite('Fall');
    else player.switchSprite('FallLeft');
  }

  c.restore();
}

animate();

window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'd':
      keys.d.pressed = true;
      break;
    case 'a':
      keys.a.pressed = true;
      break;
    case 'w':
      player.velocity.y = -5; // Increased jump height for easier testing
      break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'd':
      keys.d.pressed = false;
      break;
    case 'a':
      keys.a.pressed = false;
      break;
  }
});
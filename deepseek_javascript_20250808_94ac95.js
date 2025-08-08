// Game elements
const welcomePage = document.getElementById('welcomePage');
const gameContainer = document.getElementById('gameContainer');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const gameOverDisplay = document.getElementById('gameOver');
const readyButton = document.getElementById('readyButton');
const madeByPopup = document.getElementById('madeByPopup');

// Game variables
let score = 0;
let gameRunning = false;
let gameStarted = false;
let animationFrameId = null;

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    radius: 20,
    color: '#FF5252',
    speed: 5
};

// Obstacles
let obstacles = [];
let obstacleSpeed = 2;
let obstacleFrequency = 100;

// Colors
const colors = ['#FF5252', '#FFEB3B', '#4CAF50', '#2196F3'];

// Frame counter
let frameCount = 0;

// Keyboard controls
const keys = {
    ArrowLeft: false,
    ArrowRight: false
};

// Initialize game
function init() {
    readyButton.addEventListener('click', showGameScreen);
    canvas.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Mobile controls
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Popup click handler
    madeByPopup.addEventListener('click', hideMadeByPopup);
}

function showGameScreen() {
    welcomePage.style.display = 'none';
    gameContainer.style.display = 'block';
    showMadeByPopup();
}

function showMadeByPopup() {
    madeByPopup.style.display = 'flex';
    setTimeout(hideMadeByPopup, 2000);
}

function hideMadeByPopup() {
    madeByPopup.style.display = 'none';
    if (!gameRunning) {
        startGame();
    }
}

function startGame() {
    // Cancel any existing animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    gameRunning = true;
    gameStarted = true;
    score = 0;
    obstacles = [];
    obstacleSpeed = 2;
    frameCount = 0;
    player.color = getRandomColor();
    player.x = canvas.width / 2;
    scoreDisplay.textContent = `Score: ${score}`;
    gameOverDisplay.style.display = 'none';
    animate();
}

function handleClick() {
    if (!gameRunning && gameStarted) {
        hideMadeByPopup();
        startGame();
    } else if (gameRunning) {
        player.color = getRandomColor(player.color);
    }
}

function getRandomColor(currentColor = null) {
    let availableColors = colors.filter(color => color !== currentColor);
    return availableColors[Math.floor(Math.random() * availableColors.length)];
}

function createObstacle() {
    const gapPosition = Math.random() * (canvas.width - 100) + 50;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    obstacles.push({
        x: 0,
        y: -50,
        width: canvas.width,
        height: 30,
        gap: 100,
        gapPosition: gapPosition,
        color: color,
        passed: false
    });
}

function update() {
    // Move player
    if (keys.ArrowLeft && player.x - player.radius > 0) {
        player.x -= player.speed;
    }
    if (keys.ArrowRight && player.x + player.radius < canvas.width) {
        player.x += player.speed;
    }
    
    // Create obstacles
    frameCount++;
    if (frameCount % obstacleFrequency === 0) {
        createObstacle();
        
        // Increase difficulty
        if (frameCount % 500 === 0) {
            obstacleSpeed += 0.5;
            obstacleFrequency = Math.max(50, obstacleFrequency - 10);
        }
    }
    
    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].y += obstacleSpeed;
        
        // Check collision
        if (obstacles[i].y + obstacles[i].height > player.y - player.radius &&
            obstacles[i].y < player.y + player.radius) {
            if (player.x < obstacles[i].gapPosition ||
                player.x > obstacles[i].gapPosition + obstacles[i].gap) {
                if (player.color !== obstacles[i].color) {
                    gameOver();
                    return;
                }
            }
        }
        
        // Increase score
        if (!obstacles[i].passed && obstacles[i].y > player.y + player.radius) {
            obstacles[i].passed = true;
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
        }
        
        // Remove off-screen obstacles
        if (obstacles[i].y > canvas.height) {
            obstacles.splice(i, 1);
        }
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
    
    // Draw obstacles
    obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.gapPosition, obstacle.height);
        ctx.fillRect(
            obstacle.gapPosition + obstacle.gap, 
            obstacle.y, 
            obstacle.width - obstacle.gapPosition - obstacle.gap, 
            obstacle.height
        );
    });
}

function gameOver() {
    gameRunning = false;
    gameOverDisplay.style.display = 'block';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    setTimeout(showMadeByPopup, 1000);
}

function animate() {
    if (gameRunning) {
        update();
        draw();
        animationFrameId = requestAnimationFrame(animate);
    }
}

// Input handlers
function handleKeyDown(e) {
    if (e.key in keys) {
        keys[e.key] = true;
    }
}

function handleKeyUp(e) {
    if (e.key in keys) {
        keys[e.key] = false;
    }
}

let touchStartX = 0;

function handleTouchStart(e) {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    handleClick();
}

function handleTouchMove(e) {
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    if (touchX < touchStartX - 10) {
        keys.ArrowLeft = true;
        keys.ArrowRight = false;
    } else if (touchX > touchStartX + 10) {
        keys.ArrowRight = true;
        keys.ArrowLeft = false;
    }
}

function handleTouchEnd() {
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
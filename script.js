// --- Global Variables ---
let welcomePage, gameContainer, canvas, ctx, scoreDisplay, gameOverDisplay, readyButton, madeByPopup;

// Game State
let score = 0;
let gameRunning = false;
let gameStarted = false;
let animationFrameId = null;
let frameCount = 0;

// Player
const player = {
    x: 0,
    y: 0,
    radius: 20,
    color: '#FF5252',
    speed: 5
};

// Obstacles
let obstacles = [];
let obstacleSpeed = 2;
let obstacleFrequency = 100;

// Inputs
const keys = {
    ArrowLeft: false,
    ArrowRight: false
};
let touchStartX = 0;

// Constants
const colors = ['#FF5252', '#FFEB3B', '#4CAF50', '#2196F3'];

// --- Initialization ---
function init() {
    // Select Elements
    welcomePage = document.getElementById('welcomePage');
    gameContainer = document.getElementById('gameContainer');
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreDisplay = document.getElementById('scoreDisplay');
    gameOverDisplay = document.getElementById('gameOver');
    readyButton = document.getElementById('readyButton');
    madeByPopup = document.getElementById('madeByPopup');

    // Set initial player position
    player.x = canvas.width / 2;
    player.y = canvas.height - 50;

    // Add Event Listeners
    readyButton.addEventListener('click', showGameScreen);
    
    // Keyboard controls
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Touch/Click controls
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Restart on game over click
    gameOverDisplay.addEventListener('click', () => {
        if(!gameRunning) startGame();
    });

    // Popup click handler
    madeByPopup.addEventListener('click', hideMadeByPopup);
}

// --- Game Logic ---

function showGameScreen() {
    welcomePage.style.display = 'none';
    gameContainer.style.display = 'block';
    showMadeByPopup();
}

let popupTimeout;
function showMadeByPopup() {
    madeByPopup.style.display = 'flex';
    // Auto hide after 2 seconds
    popupTimeout = setTimeout(hideMadeByPopup, 2000);
}

function hideMadeByPopup() {
    clearTimeout(popupTimeout);
    madeByPopup.style.display = 'none';
    if (!gameRunning) {
        startGame();
    }
}

function startGame() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    gameRunning = true;
    gameStarted = true;
    score = 0;
    obstacles = [];
    obstacleSpeed = 2;
    obstacleFrequency = 100;
    frameCount = 0;
    
    player.color = getRandomColor();
    player.x = canvas.width / 2;
    
    scoreDisplay.textContent = `Score: ${score}`;
    gameOverDisplay.style.display = 'none';
    
    animate();
}

function handleClick(e) {
    e.preventDefault();
    
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
            
            // Player is vertically inside the obstacle area
            if (player.x < obstacles[i].gapPosition ||
                player.x > obstacles[i].gapPosition + obstacles[i].gap) {
                
                // Player hit the wall part (not the gap)
                // Color matching logic could go here if walls had colors,
                // but usually walls kill you unless you hit the specific colored gate.
                // In this logic: Walls kill you.
                // If you want "Color Match" through the wall, logic changes.
                // CURRENT LOGIC: You must pass through the gap.
                // If you hit the color part (the wall), you die.
                
                // Wait, looking at original request "Match the gate color to pass through".
                // The drawing code draws the obstacle as a solid bar with a gap.
                // It draws the obstacle color on the Left and Right rects.
                // So if you hit the wall, you hit the color.
                
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
    gameStarted = false;
    gameOverDisplay.style.display = 'block';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function animate() {
    if (gameRunning) {
        update();
        draw();
        animationFrameId = requestAnimationFrame(animate);
    }
}

// --- Input Handlers ---

function handleKeyDown(e) {
    if (e.key in keys) keys[e.key] = true;
}

function handleKeyUp(e) {
    if (e.key in keys) keys[e.key] = false;
}

function handleTouchStart(e) {
    if(e.target === canvas) e.preventDefault();
    touchStartX = e.touches[0].clientX;
    handleClick(e);
}

function handleTouchMove(e) {
    if(e.target === canvas) e.preventDefault();
    const touchX = e.touches[0].clientX;
    
    if (touchX < touchStartX - 5) {
        keys.ArrowLeft = true;
        keys.ArrowRight = false;
        touchStartX = touchX;
    } else if (touchX > touchStartX + 5) {
        keys.ArrowRight = true;
        keys.ArrowLeft = false;
        touchStartX = touchX;
    }
}

function handleTouchEnd() {
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
}

// Start Init when DOM is ready
document.addEventListener('DOMContentLoaded', init);

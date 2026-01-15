// --- Global Variables ---
let welcomePage, gameContainer, canvas, ctx, scoreDisplay, gameOverDisplay, readyButton, madeByPopup;

// Game State
let score = 0;
let gameRunning = false;
let gameStarted = false;
let animationFrameId = null;
let frameCount = 0;

// Player Settings
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
const keys = { ArrowLeft: false, ArrowRight: false };
let touchStartX = 0;

// Colors
const colors = ['#FF5252', '#FFEB3B', '#4CAF50', '#2196F3'];

// --- Initialization ---

// This function runs when the page is fully loaded
function init() {
    // 1. Grab all elements
    welcomePage = document.getElementById('welcomePage');
    gameContainer = document.getElementById('gameContainer');
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreDisplay = document.getElementById('scoreDisplay');
    gameOverDisplay = document.getElementById('gameOver');
    readyButton = document.getElementById('readyButton');
    madeByPopup = document.getElementById('madeByPopup');

    // 2. Setup Player
    player.x = canvas.width / 2;
    player.y = canvas.height - 50;

    // 3. Add Event Listeners
    if (readyButton) {
        readyButton.addEventListener('click', showGameScreen);
    } else {
        console.error("Start Button not found!");
    }
    
    // Keyboard
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Mouse/Touch
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Restart Listener
    gameOverDisplay.addEventListener('click', () => {
        if(!gameRunning) startGame();
    });

    // Popup Listener
    madeByPopup.addEventListener('click', hideMadeByPopup);
}

// --- Game Logic ---

function showGameScreen() {
    if (welcomePage) welcomePage.style.display = 'none';
    if (gameContainer) gameContainer.style.display = 'block';
    
    // Show the "Created By" popup, then start
    showMadeByPopup();
}

let popupTimeout;
function showMadeByPopup() {
    if (madeByPopup) {
        madeByPopup.style.display = 'flex';
        // Hide automatically after 1.5 seconds if not clicked
        popupTimeout = setTimeout(hideMadeByPopup, 1500);
    } else {
        startGame();
    }
}

function hideMadeByPopup() {
    clearTimeout(popupTimeout);
    if (madeByPopup) madeByPopup.style.display = 'none';
    
    // Start the game if it hasn't started yet
    if (!gameRunning) {
        startGame();
    }
}

function startGame() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
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
    // Stop default behavior to prevent double-firing on some devices
    if(e) e.preventDefault();
    
    if (!gameRunning && gameStarted) {
        startGame(); // Restart
    } else if (gameRunning) {
        player.color = getRandomColor(player.color); // Change Color
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
    // Move Player
    if (keys.ArrowLeft && player.x - player.radius > 0) {
        player.x -= player.speed;
    }
    if (keys.ArrowRight && player.x + player.radius < canvas.width) {
        player.x += player.speed;
    }
    
    // Create Obstacles
    frameCount++;
    if (frameCount % obstacleFrequency === 0) {
        createObstacle();
        if (frameCount % 500 === 0) {
            obstacleSpeed += 0.5;
            obstacleFrequency = Math.max(50, obstacleFrequency - 10);
        }
    }
    
    // Update Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].y += obstacleSpeed;
        
        // Collision Detection
        if (obstacles[i].y + obstacles[i].height > player.y - player.radius &&
            obstacles[i].y < player.y + player.radius) {
            
            // Check if player is NOT in the gap (Hit the wall)
            if (player.x < obstacles[i].gapPosition ||
                player.x > obstacles[i].gapPosition + obstacles[i].gap) {
                
                // If hit wall, color must match
                if (player.color !== obstacles[i].color) {
                    gameOver();
                    return;
                }
            }
        }
        
        // Scoring
        if (!obstacles[i].passed && obstacles[i].y > player.y + player.radius) {
            obstacles[i].passed = true;
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
        }
        
        // Cleanup
        if (obstacles[i].y > canvas.height) {
            obstacles.splice(i, 1);
        }
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
    
    // Obstacles
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

// --- Input Handling ---

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

// --- SAFE LOAD CHECK ---
// This ensures the code runs even if the browser loads scripts weirdly
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

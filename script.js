let currentLevel = 0;
let lives = 3;
let score = 0;
let playerPos = {x: 0, y: 0};
let gameTimer;
let isPlaying = false;
let currentMazeData = {};

// --- 1. NAVIGASI PAGE ---
function showPage(pageId) {
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if(targetPage) targetPage.classList.add('active');
}

// --- 2. SETUP GAME ---
function saveAndStart() {
    const nameInput = document.getElementById('teamNameInput').value;
    if(nameInput.trim() === "") return alert("Jangan lupa isi Nama Tim dulu ya! 🐈");
    
    localStorage.setItem('teamName', nameInput);
    currentLevel = 0;
    score = 0;
    lives = 3;
    startLevel();
}

// --- 3. AI GENERATOR LABIRIN (RUTE DIPAKSA MUTER) ---
function generateRandomMaze(level) {
    const start = {x: 0, y: 0};
    const goal = {x: 4, y: 4};
    let bestMaze = { walls: [], pathLength: 0 };

    let targetPathLength = Math.min(8 + (level * 2), 16); 
    let wallCount = Math.min(7 + Math.floor(level * 1.5), 14); 

    let attempts = 0;
    let maxAttempts = 2000; 

    while (attempts < maxAttempts) {
        let walls = [];
        while (walls.length < wallCount) {
            let rx = Math.floor(Math.random() * 5);
            let ry = Math.floor(Math.random() * 5);
            let coord = `${rx},${ry}`;

            if (coord !== "0,0" && coord !== "4,4" && !walls.includes(coord)) {
                walls.push(coord);
            }
        }

        let pathLen = getShortestPathLength(start, goal, walls);

        if (pathLen >= targetPathLength) {
            console.log(`Level ${level+1} dapet pola susah! (Langkah minimum: ${pathLen})`);
            return { walls, start, goal }; 
        }

        if (pathLen > bestMaze.pathLength) {
            bestMaze = { walls, start, goal, pathLength: pathLen };
        }
        attempts++;
    }
    
    console.log(`Pake pola cadangan buat Level ${level+1} (Langkah: ${bestMaze.pathLength})`);
    return { walls: bestMaze.walls, start, goal };
}

function getShortestPathLength(start, goal, walls) {
    let queue = [{x: start.x, y: start.y, steps: 0}];
    let visited = new Set([`${start.x},${start.y}`]);
    let dirs = [[0,1], [1,0], [0,-1], [-1,0]]; 

    while (queue.length > 0) {
        let curr = queue.shift();
        if (curr.x === goal.x && curr.y === goal.y) return curr.steps;

        for (let d of dirs) {
            let nx = curr.x + d[0];
            let ny = curr.y + d[1];
            let posStr = `${nx},${ny}`;

            if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5 && !walls.includes(posStr) && !visited.has(posStr)) {
                visited.add(posStr);
                queue.push({x: nx, y: ny, steps: curr.steps + 1});
            }
        }
    }
    return 0; // Buntu
}

// --- 4. GAMEPLAY LOGIC ---
function startLevel() {
    isPlaying = false;
    currentMazeData = generateRandomMaze(currentLevel);
    playerPos = { ...currentMazeData.start };
    
    document.getElementById('lvlDisplay').innerText = currentLevel + 1;
    document.getElementById('hearts').innerText = "❤️".repeat(lives);
    document.getElementById('scoreDisplay').innerText = score;
    
    const grid = document.getElementById('maze-grid');
    grid.classList.remove('maze-invisible', 'maze-win');
    document.getElementById('skipBtn').style.display = 'inline-block';
    document.getElementById('nextBtn').style.display = 'none';
    
    renderMaze();
    showPage('page4');
    runTimer(60, true); 
}

function renderMaze() {
    const grid = document.getElementById('maze-grid');
    grid.innerHTML = '';

    for(let y=0; y<5; y++) {
        for(let x=0; x<5; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if(currentMazeData.walls.includes(`${x},${y}`)) {
                cell.classList.add('wall');
            }
            cell.id = `cell-${x}-${y}`;
            grid.appendChild(cell);
        }
    }

    const goalEl = document.createElement('div');
    goalEl.className = 'goal';
    goalEl.innerText = '🏁';
    goalEl.style.left = (currentMazeData.goal.x * 60 + 15) + 'px';
    goalEl.style.top = (currentMazeData.goal.y * 60 + 10) + 'px';
    grid.appendChild(goalEl);

    updatePlayerUI();
}

function updatePlayerUI() {
    let p = document.getElementById('player');
    if(!p) {
        p = document.createElement('div');
        p.id = 'player';
        p.className = 'player';
        document.getElementById('maze-grid').appendChild(p);
    }
    p.style.left = (playerPos.x * 60 + 18) + 'px';
    p.style.top = (playerPos.y * 60 + 18) + 'px';
}

function runTimer(seconds, isMemo) {
    clearInterval(gameTimer);
    let time = seconds;
    const display = document.getElementById('timerDisplay');
    
    display.innerText = formatTime(time);
    
    gameTimer = setInterval(() => {
        time--;
        display.innerText = formatTime(time);
        
        if(time <= 0) {
            clearInterval(gameTimer);
            if(isMemo) startPlayPhase();
            else finishGame(); 
        }
    }, 1000);
}

function formatTime(totalSeconds) {
    let m = Math.floor(totalSeconds/60);
    let s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0'+s : s}`;
}

function startPlayPhase() {
    isPlaying = true;
    document.getElementById('maze-grid').classList.add('maze-invisible');
    document.getElementById('skipBtn').style.display = 'none';
    runTimer(90, false); 
}

function movePlayer(dx, dy) {
    if(!isPlaying) return;

    let nx = playerPos.x + dx;
    let ny = playerPos.y + dy;

    if(nx < 0 || nx > 4 || ny < 0 || ny > 4) return; 

    if(currentMazeData.walls.includes(`${nx},${ny}`)) {
        lives--;
        document.getElementById('hearts').innerText = "❤️".repeat(lives > 0 ? lives : 0);
        document.getElementById(`cell-${nx}-${ny}`).classList.add('hit');
        
        if(lives <= 0) setTimeout(finishGame, 500); 
    } else {
        playerPos.x = nx;
        playerPos.y = ny;
        updatePlayerUI();
        
        if(playerPos.x === currentMazeData.goal.x && playerPos.y === currentMazeData.goal.y) {
            handleWin();
        }
    }
}

function handleWin() {
    isPlaying = false;
    clearInterval(gameTimer);
    
    score += 1224 + (currentLevel * 100); 
    document.getElementById('scoreDisplay').innerText = score;
    
    document.getElementById('maze-grid').classList.add('maze-win');
    document.getElementById('nextBtn').style.display = 'block';
}

function nextLevel() {
    currentLevel++;
    startLevel();
}

// --- 5. END GAME ---
function finishGame() {
    isPlaying = false;
    clearInterval(gameTimer);
    
    const teamName = localStorage.getItem('teamName') || "Tim Misterius";
    document.getElementById('finalName').innerText = teamName;
    document.getElementById('finalScore').innerText = score;
    
    showPage('page7');
}

// --- 6. KEYBOARD LISTENER ---
window.addEventListener('keydown', (e) => {
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        e.preventDefault(); 
    }
    if(e.key === "ArrowUp") movePlayer(0, -1);
    if(e.key === "ArrowDown") movePlayer(0, 1);
    if(e.key === "ArrowLeft") movePlayer(-1, 0);
    if(e.key === "ArrowRight") movePlayer(1, 0);
});
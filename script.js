let currentLevel = 0;
let lives = 3;
let score = 0;
let playerPos = {x: 0, y: 0};
let gameTimer; // Timer per level (ngafal/main)
let globalTimerInterval; // Timer 10 menit
let totalTime = 600; // 10 menit (dalam detik)
let isPlaying = false;
let currentMazeData = {};
let cols = 5, rows = 5; 

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
    totalTime = 600; // Reset ke 10 menit
    
    startGlobalTimer(); // Mulai hitung mundur 10 menit
    startLevel();
}

// --- 3. GLOBAL TIMER (10 Menit) ---
function startGlobalTimer() {
    clearInterval(globalTimerInterval);
    const display = document.getElementById('globalTimerDisplay');
    
    display.innerText = formatTime(totalTime);
    
    globalTimerInterval = setInterval(() => {
        totalTime--;
        display.innerText = formatTime(totalTime);
        
        if(totalTime <= 0) {
            clearInterval(globalTimerInterval);
            finishGame("Waktu Sesi Habis (10 Menit)"); 
        }
    }, 1000);
}

// --- 4. AI GENERATOR LABIRIN (DFS) ---
function generateDFSMaze(c, r) {
    let walls = new Set();
    for(let y=0; y<r; y++) {
        for(let x=0; x<c; x++) {
            if(x < c-1) walls.add(`${x},${y}-${x+1},${y}`);
            if(y < r-1) walls.add(`${x},${y}-${x},${y+1}`);
        }
    }
    let visited = new Set(['0,0']);
    let stack = [{x:0, y:0}];
    while(stack.length > 0) {
        let curr = stack[stack.length - 1];
        let neighbors = [];
        let dirs = [[0,-1], [1,0], [0,1], [-1,0]]; 
        for(let d of dirs) {
            let nx = curr.x + d[0], ny = curr.y + d[1];
            if(nx >= 0 && nx < c && ny >= 0 && ny < r && !visited.has(`${nx},${ny}`)) {
                neighbors.push({x: nx, y: ny});
            }
        }
        if(neighbors.length === 0) stack.pop(); 
        else {
            let next = neighbors[Math.floor(Math.random() * neighbors.length)];
            visited.add(`${next.x},${next.y}`);
            let edgeStr = (curr.x < next.x || curr.y < next.y)
                ? `${curr.x},${curr.y}-${next.x},${next.y}`
                : `${next.x},${next.y}-${curr.x},${curr.y}`;
            walls.delete(edgeStr); 
            stack.push(next);
        }
    }
    let wallsArray = Array.from(walls);
    let removeCount = Math.floor(wallsArray.length * 0.2); 
    for(let i=0; i<removeCount; i++) {
        let idx = Math.floor(Math.random() * wallsArray.length);
        wallsArray.splice(idx, 1);
    }
    return wallsArray; 
}

// --- 5. GAMEPLAY LOGIC ---
function startLevel() {
    isPlaying = false;
    // Ukuran labirin makin susah tiap 3 level
    cols = 5 + Math.floor(currentLevel / 3);
    rows = cols; 

    currentMazeData = {
        start: {x: 0, y: 0},
        goal: {x: cols-1, y: rows-1}, 
        walls: generateDFSMaze(cols, rows)
    };
    
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
    runTimer(15, true); // Waktu menghafal 15 detik (bisa disesuaikan)
}

function renderMaze() {
    const grid = document.getElementById('maze-grid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${cols}, 55px)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 55px)`;

    for(let y=0; y<rows; y++) {
        for(let x=0; x<cols; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${x}-${y}`;
            if(currentMazeData.walls.includes(`${x},${y}-${x+1},${y}`)) cell.classList.add('wall-right');
            if(currentMazeData.walls.includes(`${x},${y}-${x},${y+1}`)) cell.classList.add('wall-bottom');
            grid.appendChild(cell);
        }
    }
    const goalEl = document.createElement('div');
    goalEl.className = 'goal';
    goalEl.innerText = '🏁';
    goalEl.style.left = (currentMazeData.goal.x * 55 + 10) + 'px';
    goalEl.style.top = (currentMazeData.goal.y * 55 + 5) + 'px';
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
    p.style.left = (playerPos.x * 55 + 12.5) + 'px';
    p.style.top = (playerPos.y * 55 + 12.5) + 'px';
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
            else finishGame("Waktu Level Habis"); 
        }
    }, 1000);
}

function formatTime(secs) {
    let m = Math.floor(secs/60); let s = secs % 60;
    return `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
}

function startPlayPhase() {
    isPlaying = true;
    document.getElementById('maze-grid').classList.add('maze-invisible');
    document.getElementById('skipBtn').style.display = 'none';
    runTimer(90, false); // Waktu pengerjaan 90 detik
}

function movePlayer(dx, dy) {
    if(!isPlaying) return;
    let nx = playerPos.x + dx;
    let ny = playerPos.y + dy;

    if(nx < 0 || nx >= cols || ny < 0 || ny >= rows) {
        lives--;
        updateHearts();
        showHitFeedbackOuter();
        if(lives <= 0) finishGame("Kehabisan Nyawa (Nabrak Pinggiran)"); 
        return; 
    }

    let edgeStr = (playerPos.x < nx || playerPos.y < ny)
        ? `${playerPos.x},${playerPos.y}-${nx},${ny}`
        : `${nx},${ny}-${playerPos.x},${playerPos.y}`;

    if(currentMazeData.walls.includes(edgeStr)) {
        lives--;
        updateHearts();
        showHitFeedbackInner(playerPos.x, playerPos.y, nx, ny);
        if(lives <= 0) finishGame("Kehabisan Nyawa (Nabrak Tembok)"); 
    } else {
        playerPos.x = nx;
        playerPos.y = ny;
        updatePlayerUI();
        if(playerPos.x === currentMazeData.goal.x && playerPos.y === currentMazeData.goal.y) handleWin();
    }
}

function updateHearts() {
    document.getElementById('hearts').innerText = "❤️".repeat(lives > 0 ? lives : 0);
}

function showHitFeedbackInner(cx, cy, nx, ny) {
    let cellId, hitClass;
    if(nx > cx) { cellId = `cell-${cx}-${cy}`; hitClass = 'hit-right'; }
    else if(nx < cx) { cellId = `cell-${nx}-${ny}`; hitClass = 'hit-right'; }
    else if(ny > cy) { cellId = `cell-${cx}-${cy}`; hitClass = 'hit-bottom'; }
    else if(ny < cy) { cellId = `cell-${nx}-${ny}`; hitClass = 'hit-bottom'; }
    let cell = document.getElementById(cellId);
    if(cell) {
        cell.classList.add(hitClass);
        setTimeout(() => cell.classList.remove(hitClass), 500);
    }
}

function showHitFeedbackOuter() {
    const grid = document.getElementById('maze-grid');
    grid.classList.add('grid-hit');
    setTimeout(() => grid.classList.remove('grid-hit'), 500);
}

function handleWin() {
    isPlaying = false;
    clearInterval(gameTimer);
    score += 1000 + (currentLevel * 200) + (lives * 100); 
    document.getElementById('scoreDisplay').innerText = score;
    document.getElementById('maze-grid').classList.add('maze-win');
    document.getElementById('nextBtn').style.display = 'block';
}

function nextLevel() {
    currentLevel++;
    startLevel();
}

function finishGame(reason) {
    isPlaying = false;
    clearInterval(gameTimer);
    clearInterval(globalTimerInterval); // Stop timer 10 menit
    
    const teamName = localStorage.getItem('teamName') || "Tim Misterius";
    document.getElementById('finalName').innerText = teamName;
    document.getElementById('final-level').innerText = currentLevel + 1; 
    document.getElementById('finalScore').innerText = score;
    document.getElementById('gameover-reason').innerText = reason;
    showPage('page7');
}

window.addEventListener('keydown', (e) => {
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault(); 
    if(e.key === "ArrowUp") movePlayer(0, -1);
    if(e.key === "ArrowDown") movePlayer(0, 1);
    if(e.key === "ArrowLeft") movePlayer(-1, 0);
    if(e.key === "ArrowRight") movePlayer(1, 0);
});

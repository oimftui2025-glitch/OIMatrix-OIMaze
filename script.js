let currentLevel = 0;
let lives = 3;
let score = 0;
let playerPos = {x: 0, y: 0};
let gameTimer;
let isPlaying = false;
let currentMazeData = {};
let cols = 5, rows = 5; // Ukuran awal grid

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

// --- 3. AI GENERATOR LABIRIN (DFS MAZE ALGORITHM) ---
// Bikin labirin asli dengan tembok pembatas yang ruwet
function generateDFSMaze(c, r) {
    let walls = new Set();
    
    // 1. Pasang SEMUA tembok di antara kotak
    for(let y=0; y<r; y++) {
        for(let x=0; x<c; x++) {
            if(x < c-1) walls.add(`${x},${y}-${x+1},${y}`); // Tembok Kanan
            if(y < r-1) walls.add(`${x},${y}-${x},${y+1}`); // Tembok Bawah
        }
    }

    // 2. Bobok temboknya pake Depth First Search (DFS)
    let visited = new Set(['0,0']);
    let stack = [{x:0, y:0}];

    while(stack.length > 0) {
        let curr = stack[stack.length - 1];
        let neighbors = [];
        let dirs = [[0,-1], [1,0], [0,1], [-1,0]]; // Atas, Kanan, Bawah, Kiri
        
        for(let d of dirs) {
            let nx = curr.x + d[0], ny = curr.y + d[1];
            if(nx >= 0 && nx < c && ny >= 0 && ny < r && !visited.has(`${nx},${ny}`)) {
                neighbors.push({x: nx, y: ny});
            }
        }

        if(neighbors.length === 0) {
            stack.pop(); // Jalan buntu, mundur
        } else {
            let next = neighbors[Math.floor(Math.random() * neighbors.length)];
            visited.add(`${next.x},${next.y}`);

            // Cari nama temboknya (selalu x,y yang kecil duluan)
            let edgeStr = (curr.x < next.x || curr.y < next.y)
                ? `${curr.x},${curr.y}-${next.x},${next.y}`
                : `${next.x},${next.y}-${curr.x},${curr.y}`;

            walls.delete(edgeStr); // Hancurkan tembok biar ada jalan
            stack.push(next);
        }
    }

    // 3. Tambahin kelonggaran (Bongkar bbrp tembok biar ga cuma ada 1 jalan)
    let wallsArray = Array.from(walls);
    let removeCount = Math.floor(wallsArray.length * 0.2); // Buang 20% tembok sisa
    for(let i=0; i<removeCount; i++) {
        let idx = Math.floor(Math.random() * wallsArray.length);
        wallsArray.splice(idx, 1);
    }

    return wallsArray; // Array tembok yang masih berdiri
}

// --- 4. GAMEPLAY LOGIC ---
function startLevel() {
    isPlaying = false;
    
    // Makin tinggi level, ukuran grid makin melar! (Maksimal 7x7 biar muat di HP)
    cols = Math.min(5 + Math.floor(currentLevel / 3), 7);
    rows = cols; 

    currentMazeData = {
        start: {x: 0, y: 0}, // Start selalu Kiri Atas
        goal: {x: cols-1, y: rows-1}, // Goal selalu Kanan Bawah
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
    runTimer(60, true); // 60 detik ngapalin
}

function renderMaze() {
    const grid = document.getElementById('maze-grid');
    grid.innerHTML = '';
    
    // Set ukuran grid dinamis di CSS
    grid.style.gridTemplateColumns = `repeat(${cols}, 55px)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 55px)`;

    for(let y=0; y<rows; y++) {
        for(let x=0; x<cols; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${x}-${y}`;

            // Cek apakah ada tembok di kanan/bawah kotak ini
            if(currentMazeData.walls.includes(`${x},${y}-${x+1},${y}`)) cell.classList.add('wall-right');
            if(currentMazeData.walls.includes(`${x},${y}-${x},${y+1}`)) cell.classList.add('wall-bottom');

            grid.appendChild(cell);
        }
    }

    // Spawn Goal
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
            else finishGame("Waktu Habis (Time's Up!)"); 
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
    runTimer(90, false); // 90 Detik Waktu Main
}

function movePlayer(dx, dy) {
    if(!isPlaying) return;

    let nx = playerPos.x + dx;
    let ny = playerPos.y + dy;

    if(nx < 0 || nx >= cols || ny < 0 || ny >= rows) return; 

    // Bikin string tembok yang mau dilewatin
    let edgeStr = (playerPos.x < nx || playerPos.y < ny)
        ? `${playerPos.x},${playerPos.y}-${nx},${ny}`
        : `${nx},${ny}-${playerPos.x},${playerPos.y}`;

    // Cek Nabrak
    if(currentMazeData.walls.includes(edgeStr)) {
        lives--;
        document.getElementById('hearts').innerText = "❤️".repeat(lives > 0 ? lives : 0);
        
        // Tunjukin tembok yang ditabrak (Flash Merah)
        showHitFeedback(playerPos.x, playerPos.y, nx, ny);
        
        if(lives <= 0) setTimeout(() => finishGame("Kehabisan Nyawa (Nabrak Mulu)"), 500); 
    } else {
        // Jalan Aman
        playerPos.x = nx;
        playerPos.y = ny;
        updatePlayerUI();
        
        if(playerPos.x === currentMazeData.goal.x && playerPos.y === currentMazeData.goal.y) {
            handleWin();
        }
    }
}

// Fitur Highlight Tembok yang Ditabrak
function showHitFeedback(cx, cy, nx, ny) {
    let cellId, hitClass;
    
    // Cari kotak mana yang punya border tersebut
    if(nx > cx) { cellId = `cell-${cx}-${cy}`; hitClass = 'hit-right'; }
    else if(nx < cx) { cellId = `cell-${nx}-${ny}`; hitClass = 'hit-right'; }
    else if(ny > cy) { cellId = `cell-${cx}-${cy}`; hitClass = 'hit-bottom'; }
    else if(ny < cy) { cellId = `cell-${nx}-${ny}`; hitClass = 'hit-bottom'; }

    let cell = document.getElementById(cellId);
    if(cell) cell.classList.add(hitClass); // Tembok merah permanen sbg penanda mati
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
function finishGame(reason) {
    isPlaying = false;
    clearInterval(gameTimer);
    
    const teamName = localStorage.getItem('teamName') || "Tim Misterius";
    document.getElementById('finalName').innerText = teamName;
    document.getElementById('final-level').innerText = currentLevel + 1; 
    document.getElementById('finalScore').innerText = score;
    document.getElementById('gameover-reason').innerText = reason;
    
    showPage('page7');
}

// --- 6. KEYBOARD LISTENER ---
window.addEventListener('keydown', (e) => {
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault(); 
    if(e.key === "ArrowUp") movePlayer(0, -1);
    if(e.key === "ArrowDown") movePlayer(0, 1);
    if(e.key === "ArrowLeft") movePlayer(-1, 0);
    if(e.key === "ArrowRight") movePlayer(1, 0);
});

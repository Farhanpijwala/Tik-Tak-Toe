// Game State
const state = {
    board: Array(9).fill(null),
    currentPlayer: 'X',
    gameActive: true,
    scores: { X: 0, O: 0, draws: 0 },
    soundEnabled: true
};

// DOM Elements
const boardElement = document.getElementById('game-board');
const playerXIndicator = document.getElementById('player-x');
const playerOIndicator = document.getElementById('player-o');
const scoreXElement = document.getElementById('score-x');
const scoreOElement = document.getElementById('score-o');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalIcon = document.getElementById('modal-icon');
const playAgainBtn = document.getElementById('play-again-btn');
const resetBtn = document.getElementById('reset-btn');
const resetScoreBtn = document.getElementById('reset-score-btn');
const soundToggle = document.getElementById('sound-toggle');

// Winning Combinations
const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// Audio Context for Sound Effects
let audioContext = null;

// Initialize Audio Context
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Play Sound Effect
function playSound(type) {
    if (!state.soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
        case 'place':
            oscillator.frequency.value = 600;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'win':
            oscillator.frequency.value = 800;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'draw':
            oscillator.frequency.value = 300;
            oscillator.type = 'triangle';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
    }
}

// Initialize Board
function initBoard() {
    boardElement.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(i));
        boardElement.appendChild(cell);
    }
}

// Handle Cell Click
function handleCellClick(index) {
    initAudio(); // Ensure audio context is initialized on first interaction
    
    if (!state.gameActive || state.board[index]) return;
    
    // Place mark
    state.board[index] = state.currentPlayer;
    const cell = boardElement.children[index];
    cell.classList.add('taken', state.currentPlayer.toLowerCase());
    
    // Add SVG icon
    const icon = document.createElement('div');
    icon.innerHTML = state.currentPlayer === 'X' 
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>';
    cell.appendChild(icon.firstChild);
    
    playSound('place');
    
    // Check win or draw
    if (checkWin()) {
        handleWin();
    } else if (checkDraw()) {
        handleDraw();
    } else {
        switchPlayer();
    }
}

// Check Win
function checkWin() {
    for (let combo of winningCombos) {
        const [a, b, c] = combo;
        if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
            highlightWinningCells(combo);
            return true;
        }
    }
    return false;
}

// Highlight Winning Cells
function highlightWinningCells(combo) {
    combo.forEach(index => {
        boardElement.children[index].classList.add('winning');
    });
    
    // Draw connecting line
    drawWinLine(combo);
}

// Draw Win Line (SVG)
function drawWinLine(combo) {
    const svg = document.getElementById('win-line');
    const line = svg.querySelector('line');
    const cells = Array.from(boardElement.children);
    
    const firstCell = cells[combo[0]];
    const lastCell = cells[combo[2]];
    
    const boardRect = boardElement.getBoundingClientRect();
    const firstRect = firstCell.getBoundingClientRect();
    const lastRect = lastCell.getBoundingClientRect();
    
    const x1 = firstRect.left - boardRect.left + firstRect.width / 2;
    const y1 = firstRect.top - boardRect.top + firstRect.height / 2;
    const x2 = lastRect.left - boardRect.left + lastRect.width / 2;
    const y2 = lastRect.top - boardRect.top + lastRect.height / 2;
    
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    
    svg.style.opacity = '1';
    
    // Animate line drawing
    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    line.style.strokeDasharray = length;
    line.style.strokeDashoffset = length;
    line.style.animation = 'draw-line 0.5s ease-out forwards';
    
    // Add CSS animation dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes draw-line {
            to { stroke-dashoffset: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Check Draw
function checkDraw() {
    return state.board.every(cell => cell !== null);
}

// Handle Win
function handleWin() {
    state.gameActive = false;
    state.scores[state.currentPlayer]++;
    updateScores();
    playSound('win');
    createParticles();
    
    setTimeout(() => {
        showModal('Victory!', `Player ${state.currentPlayer} dominates the arena!`, 'win');
    }, 800);
}

// Handle Draw
function handleDraw() {
    state.gameActive = false;
    state.scores.draws++;
    updateScores();
    playSound('draw');
    
    setTimeout(() => {
        showModal('Stalemate!', 'The arena remains undecided.', 'draw');
    }, 500);
}

// Switch Player
function switchPlayer() {
    state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
    updateTurnIndicators();
}

// Update Turn Indicators
function updateTurnIndicators() {
    if (state.currentPlayer === 'X') {
        playerXIndicator.classList.remove('opacity-60', 'border-slate-700');
        playerXIndicator.classList.add('border-neon-cyan', 'shadow-[0_0_15px_rgba(0,243,255,0.3)]');
        playerOIndicator.classList.add('opacity-60', 'border-slate-700');
        playerOIndicator.classList.remove('border-neon-violet', 'shadow-[0_0_15px_rgba(188,19,254,0.3)]');
    } else {
        playerOIndicator.classList.remove('opacity-60', 'border-slate-700');
        playerOIndicator.classList.add('border-neon-violet', 'shadow-[0_0_15px_rgba(188,19,254,0.3)]');
        playerXIndicator.classList.add('opacity-60', 'border-slate-700');
        playerXIndicator.classList.remove('border-neon-cyan', 'shadow-[0_0_15px_rgba(0,243,255,0.3)]');
    }
}

// Update Score Display
function updateScores() {
    scoreXElement.textContent = state.scores.X;
    scoreOElement.textContent = state.scores.O;
    
    // Animate score change
    const activeScore = state.currentPlayer === 'X' ? scoreXElement : scoreOElement;
    activeScore.style.transform = 'scale(1.3)';
    setTimeout(() => {
        activeScore.style.transform = 'scale(1)';
    }, 300);
}

// Show Modal
function showModal(title, message, type) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    if (type === 'win') {
        modalIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#39ff14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-pulse"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>';
        modalTitle.className = 'text-3xl font-bold mb-2 text-neon-green';
    } else {
        modalIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
        modalTitle.className = 'text-3xl font-bold mb-2 text-slate-400';
    }
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.add('modal-enter');
    }, 10);
}

// Hide Modal
function hideModal() {
    modal.classList.remove('modal-enter');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Reset Game
function resetGame() {
    state.board.fill(null);
    state.currentPlayer = 'X';
    state.gameActive = true;
    
    // Clear UI
    initBoard();
    updateTurnIndicators();
    
    // Hide win line
    document.getElementById('win-line').style.opacity = '0';
    
    hideModal();
}

// Reset Scores
function resetScores() {
    state.scores = { X: 0, O: 0, draws: 0 };
    updateScores();
}

// Create Particle Effects
function createParticles() {
    const colors = ['#00f3ff', '#bc13fe', '#39ff14', '#ff006e'];
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            const tx = (Math.random() - 0.5) * 200;
            const ty = (Math.random() - 0.5) * 200;
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');
            
            boardElement.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }, i * 50);
    }
}

// Toggle Sound
function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    const icon = soundToggle.querySelector('i');
    if (state.soundEnabled) {
        icon.setAttribute('data-feather', 'volume-2');
        initAudio();
    } else {
        icon.setAttribute('data-feather', 'volume-x');
    }
    feather.replace();
}

// Event Listeners
playAgainBtn.addEventListener('click', resetGame);
resetBtn.addEventListener('click', resetGame);
resetScoreBtn.addEventListener('click', resetScores);
soundToggle.addEventListener('click', toggleSound);

// Keyboard Support
document.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        handleCellClick(index);
    }
    if (e.key === 'r' || e.key === 'R') {
        resetGame();
    }
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        hideModal();
    }
});

// Initialize
initBoard();
updateTurnIndicators();

// Add touch support for mobile
let touchStartY = 0;
document.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    if (touchStartY - touchEndY > 50) { // Swipe up
        // Could add special gesture here
    }
});
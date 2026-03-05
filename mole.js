'use strict';

// ── Config ──────────────────────────────────────────────────────────────────
const CONFIG = {
  TILE_COUNT:     9,
  MOLE_INTERVAL:  1000,  // ms
  PLANT_INTERVAL: 1500,  // ms — offset so they don't fire simultaneously
  MOLE_SRC:  './Assets/cat.png',
  PLANT_SRC: './Assets/ghost.png',
};

// ── State ────────────────────────────────────────────────────────────────────
let state = {
  score:         0,
  gameOver:      false,
  running:       false,
  currMoleTile:  null,
  currPlantTile: null,
};

let moleTimer  = null;
let plantTimer = null;

// ── DOM refs ─────────────────────────────────────────────────────────────────
const boardEl    = document.getElementById('board');
const scoreEl    = document.getElementById('score-display');
const overlay    = document.getElementById('overlay');
const btnStart   = document.getElementById('btn-start');
const btnReset   = document.getElementById('btn-reset');
const btnOverlay = document.getElementById('btn-overlay-start');

// ── Build tiles once ──────────────────────────────────────────────────────────
const tiles = Array.from({ length: CONFIG.TILE_COUNT }, (_, i) => {
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.dataset.id = i;
  tile.addEventListener('click', onTileClick);
  boardEl.appendChild(tile);
  return tile;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a random tile index, guaranteed to differ from `exclude`.
 * @param {number|null} exclude
 * @returns {number}
 */
function randomTileIndex(exclude = null) {
  let idx;
  do {
    idx = Math.floor(Math.random() * CONFIG.TILE_COUNT);
  } while (idx === exclude);
  return idx;
}

/** Removes content and state classes from a tile. */
function clearTile(tile) {
  if (!tile) return;
  tile.classList.remove('has-mole', 'has-plant', 'whacked');
  tile.innerHTML = '';
}

/**
 * Places a mole or plant image in a tile with the correct CSS class.
 * @param {HTMLElement} tile
 * @param {string} src   - image path
 * @param {string} cssClass - 'has-mole' | 'has-plant'
 */
function placePiece(tile, src, cssClass) {
  clearTile(tile);
  const img = document.createElement('img');
  img.src = src;
  img.alt = cssClass === 'has-mole' ? 'mole' : 'plant';
  img.draggable = false;
  tile.appendChild(img);
  tile.classList.add(cssClass);
}

/** Updates the score text in the DOM. */
function updateScore() {
  scoreEl.textContent = `SCORE: ${state.score}`;
}

/**
 * Spawns a floating "+10" label on a tile, then removes it.
 * @param {HTMLElement} tile
 * @param {string} text
 */
function showScorePop(tile, text) {
  const pop = document.createElement('span');
  pop.className = 'score-pop';
  pop.textContent = text;
  tile.appendChild(pop);
  pop.addEventListener('animationend', () => pop.remove(), { once: true });
}

// ── Spawn logic ───────────────────────────────────────────────────────────────

function setMole() {
  if (state.gameOver) return;

  clearTile(state.currMoleTile);

  const excludeId = state.currPlantTile ? +state.currPlantTile.dataset.id : null;
  const idx = randomTileIndex(excludeId);
  state.currMoleTile = tiles[idx];
  placePiece(state.currMoleTile, CONFIG.MOLE_SRC, 'has-mole');
}

function setPlant() {
  if (state.gameOver) return;

  clearTile(state.currPlantTile);

  const excludeId = state.currMoleTile ? +state.currMoleTile.dataset.id : null;
  const idx = randomTileIndex(excludeId);
  state.currPlantTile = tiles[idx];
  placePiece(state.currPlantTile, CONFIG.PLANT_SRC, 'has-plant');
}

// ── Click handler ─────────────────────────────────────────────────────────────

function onTileClick() {
  if (!state.running || state.gameOver) return;

  if (this === state.currMoleTile) {
    // Hit a mole ✔
    state.score += 10;
    updateScore();
    showScorePop(this, '+10');

    this.classList.add('whacked');
    this.addEventListener('animationend', () => {
      clearTile(this);
      state.currMoleTile = null;
    }, { once: true });

  } else if (this === state.currPlantTile) {
    // Hit a plant ✘
    endGame();
  }
}

// ── Game lifecycle ────────────────────────────────────────────────────────────

function startGame() {
  if (state.running) return;
  resetState();
  state.running = true;
  updateScore();
  overlay.classList.add('hidden');

  // Spawn immediately, then on interval
  setMole();
  setPlant();
  moleTimer  = setInterval(setMole,  CONFIG.MOLE_INTERVAL);
  plantTimer = setInterval(setPlant, CONFIG.PLANT_INTERVAL);
}

function endGame() {
  state.gameOver = true;
  state.running  = false;
  clearInterval(moleTimer);
  clearInterval(plantTimer);

  scoreEl.textContent = `GAME OVER — ${state.score} pts`;
  scoreEl.classList.add('game-over');
}

function resetState() {
  clearInterval(moleTimer);
  clearInterval(plantTimer);

  state.score         = 0;
  state.gameOver      = false;
  state.running       = false;
  state.currMoleTile  = null;
  state.currPlantTile = null;

  tiles.forEach(clearTile);
  scoreEl.textContent = 'SCORE: 0';
  scoreEl.classList.remove('game-over');
}

function resetGame() {
  resetState();
  overlay.classList.remove('hidden');
}

// ── Button bindings ───────────────────────────────────────────────────────────
btnStart.addEventListener('click', startGame);
btnReset.addEventListener('click', resetGame);
btnOverlay.addEventListener('click', startGame);
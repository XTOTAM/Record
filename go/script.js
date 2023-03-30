const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const gridSize = 19;
const cellSize = 30;
const radius = cellSize / 2 - 2;

let currentPlayer = 'black';
let boardState = createEmptyBoard(gridSize);

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const row = Math.round((x - cellSize / 2) / cellSize);
  const col = Math.round((y - cellSize / 2) / cellSize);

  if (isEmpty(row, col)) {
    boardState[row][col] = currentPlayer;
    drawStone(row, col, currentPlayer);
    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
  }
});

const resetButton = document.getElementById('reset');
resetButton.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  boardState = createEmptyBoard(gridSize);
  drawBoard();
  currentPlayer = 'black';
});

function createEmptyBoard(size) {
  const board = [];
  for (let i = 0; i < size; i++) {
    board[i] = new Array(size).fill(null);
  }
  return board;
}

function isEmpty(row, col) {
  return boardState[row] && boardState[row][col] === null;
}

function drawBoard() {
  ctx.strokeStyle = '#000';

  for (let i = 0; i < gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(cellSize / 2 + i * cellSize, cellSize / 2);
    ctx.lineTo(cellSize / 2 + i * cellSize, cellSize * (gridSize - 0.5));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cellSize / 2, cellSize / 2 + i * cellSize);
    ctx.lineTo(cellSize * (gridSize - 0.5), cellSize / 2 + i * cellSize);
    ctx.stroke();
  }
}

function drawStone(row, col, color) {
  ctx.beginPath();
  ctx.arc(
    cellSize / 2 + row * cellSize,
    cellSize / 2 + col * cellSize,
    radius,
    0,
    2 * Math.PI
  );
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();
}

drawBoard();

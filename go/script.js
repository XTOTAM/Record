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

    removeSurroundedClusters(boardState, currentPlayer);

    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';

    // Redraw the board and update the stone icon
    drawBoard();
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

  // Draw label for next turn
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#000";
  ctx.fillText("Next turn:", 285, 590);

  // Draw stone icon for current player's turn
  ctx.beginPath();
  ctx.arc(340, 585, 12, 0, 2 * Math.PI);
  ctx.fillStyle = currentPlayer;
  ctx.fill();
  ctx.stroke();
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

function removeSurroundedClusters(board, player) {
  const opponent = player === 'black' ? 'white' : 'black';
  const visited = createEmptyBoard(gridSize);
  let clustersToRemove = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (board[row][col] === opponent && !visited[row][col]) {
        const cluster = getCluster(board, row, col, opponent, visited);
        const liberties = countLiberties(board, cluster);

        if (liberties === 0) {
          clustersToRemove.push(cluster);
        }
      }
    }
  }

  if (clustersToRemove.length > 0) {
    clustersToRemove.forEach(cluster => removeCluster(board, cluster));
    drawBoard();
    drawStones(board);
  }
}

function removeCluster(board, cluster) {
  cluster.forEach(({ row, col }) => {
    board[row][col] = null;
    ctx.clearRect(col * cellSize, row * cellSize, cellSize, cellSize);
    drawGridIntersection(row, col);
  });
}

function drawGridIntersection(row, col) {
  ctx.beginPath();
  ctx.moveTo(col * cellSize, row * cellSize + cellSize / 2);
  ctx.lineTo(col * cellSize + cellSize, row * cellSize + cellSize / 2);
  ctx.moveTo(col * cellSize + cellSize / 2, row * cellSize);
  ctx.lineTo(col * cellSize + cellSize / 2, row * cellSize + cellSize);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function getCluster(board, row, col, color) {
  const cluster = [];
  const visited = createEmptyBoard(gridSize);

  function visit(r, c) {
    if (!isValid(r, c) || visited[r][c] || board[r][c] !== color) {
      return;
    }

    cluster.push({ row: r, col: c });
    visited[r][c] = true;

    visit(r - 1, c);
    visit(r + 1, c);
    visit(r, c - 1);
    visit(r, c + 1);
  }

  visit(row, col);

  // Mark visited cells for all connected clusters
  cluster.forEach(({ row, col }) => {
    visited[row][col] = true;
  });

  return cluster;
}


function countLiberties(board, cluster) {
  const liberties = new Set();

  cluster.forEach(({ row, col }) => {
    [
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 },
    ].forEach(({ row, col }) => {
      if (isValid(row, col) && isEmpty(row, col)) {
        liberties.add(`${row}-${col}`);
      }
    });
  });

  return liberties.size;
}

function isValid(row, col) {
  return row >= 0 && row < gridSize && col >= 0 && col < gridSize;
}

function drawStones(board) {
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (board[row][col] !== null) {
        drawStone(row, col, board[row][col]);
      }
    }
  }
}

drawBoard();
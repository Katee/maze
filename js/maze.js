class Rand {
	static randomInt(x) {
		return Math.floor(Math.random() * x);
	}
	static pickRand(al) {
		return al[this.randomInt(al.length)];
	}
}

class Cell {
	constructor(x, y) {
		this.visited = false;
		this.up = true;
		this.right = true;
		this.down = true;
		this.left = true;
		this.x = x;
		this.y = y;
	}
}

/* Generate the maze using recursive backtracking
*  https://en.wikipedia.org/wiki/Maze_generation_algorithm#Recursive_backtracker
*/
class MazeGenerator {
	constructor(width, height, start, end) {
		this.width = width;
		this.height = height;
		this.board = [];

		// generate cells with walls everywhere
		for (let x = 0; x < this.width; x++) {
			this.board.push([]);
			for (let y = 0; y < this.height; y++) {
				this.board[x].push(new Cell(x, y));
			}
		}

		let current_cell = this.randomCell();
		let next_cell = null;
		
		current_cell.visited = true;
		let visitedStack = [current_cell];
		
		while (visitedStack.length > 0) {
			if (this.isDeadEnd(current_cell.x, current_cell.y)) {
				current_cell = visitedStack.pop();
			} else {
				next_cell = this.randomNeighbor(current_cell.x, current_cell.y);
				next_cell.visited = true;
				this.breakWall(current_cell, next_cell);
				visitedStack.push(current_cell);
				current_cell = next_cell;
			}
		}
	}

	getNeighbors(x, y) {
		var n = [];

		if (y != 0) {
			n.push(this.board[x][y - 1]);
		}
		if (y != this.height - 1) {
			n.push(this.board[x][y + 1]);
		}
		if (x != 0) {
			n.push(this.board[x - 1][y]);
		}
		if (x != this.width - 1) {
			n.push(this.board[x + 1][y]);
		}

		return n;
	}

	availableNeighbors(x, y) {
		var list = [];
		var neighbors = this.getNeighbors(x, y);
		for (let i = 0; i < neighbors.length; i++) {
			if (!neighbors[i].visited) list.push(neighbors[i]);
		}
		return list;
	}

	randomNeighbor(x, y) {
		return Rand.pickRand(this.availableNeighbors(x, y));
	}

	randomCell() {
		return this.board[Rand.randomInt(this.width)][Rand.randomInt(this.height)];
	}

	breakWall(c1, c2) {
		if (c1.x == c2.x) {
			if (c1.y < c2.y) {
				c1.down = false;
				c2.up = false;
			}
			if (c1.y > c2.y) {
				c1.up = false;
				c2.down = false;
			}
		} else if (c1.y == c2.y) {
			if (c1.x < c2.x) {
				c1.right = false;
				c2.left = false;
			}
			if (c1.x > c2.x) {
				c1.left = false;
				c2.right = false;
			}
		}
	}

	isDeadEnd(x, y) {
		var neighbors = this.getNeighbors(x, y);
		for (let i = 0; i < neighbors.length; i++) {
			if (!neighbors[i].visited) return false;
		}
		return true;
	}
}

class MazeGameState {
	constructor(mazeDimensions, startPosition) {
		const [ width, height ] = mazeDimensions;

		this.width = width;
		this.height = height;
		this.currentPos = startPosition;
		this.path = [this.currentPos];
		this.gameInProgress = false;

		this.start = startPosition;
		this.end = {
			x: this.width - 1,
			y: this.height - 1
		};

		this.board = new MazeGenerator(this.width, this.height, this.start, this.end).board;
		console.log(this.board)
	}

	getCell(x, y) {
		return this.board[x][y];
	};

	isStartCell(cell) {
		if (this.start.x === cell.x && this.start.y === cell.y) return true;
		return false;
	}

	isEndCell(cell) {
		if (this.end.x === cell.x && this.end.y === cell.y) return true;
		return false;
	}

	isCellInBounds(x, y) {
		if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
			return true;
		}
		return false;
	}
}

class MazeGame {
	constructor(canvas, options) {
		let default_options = {
			ui: {},
			starting_position: { x: 0, y: 0 },
			level_size: [16, 10],
			onStart: function(){},
			onGameEnd: function(){},
			onMove: function(){}
		}

		this.offsets = {
			"left"	:	{ x: -1, y: 0 },
			"up"	:	{ x: 0, y:	-1 },
			"right"	:	{ x: 1, y: 0 },
			"down"	:	{ x: 0, y: 1 }
		};

		// TODO: don't use jQuery here
		this.options = $.extend({}, default_options, options);

		this.state = new MazeGameState(this.options.level_size, this.options.starting_position);
		this.ui = new MazeUi(this.state, options.ui, canvas);
		this.ui.center();
		this.start();
	}
	
	start() {
		this.state.gameInProgress = true;
		this.options.onStart();
	}
	
	move(direction) {
		var newPos = {
			x: this.state.currentPos.x + this.offsets[direction].x,
			y: this.state.currentPos.y + this.offsets[direction].y
		};
		if (this.state.gameInProgress && this.state.isCellInBounds(newPos.x, newPos.y)) {
			if (this.state.getCell(this.state.currentPos.x, this.state.currentPos.y)[direction] === false) {
				this.state.path.push(newPos);
				this.state.currentPos = newPos;
				this.ui.update()
				if (this.state.isEndCell(newPos)) {
					this.options.onGameEnd(true);
				}
			}
		}
	}
	
	getSteps() {
		// subtract one to account for the current positon being part of the path
		return this.state.path.length - 1;
	}
}

class MazeUi {
	constructor(state, options, canvas) {
		this.canvas = canvas;
		this.ctx = this.canvas.getContext("2d");
		this.state = state;

		let defaultOptions = {
			colors: {
				walls: "#ee4646",
				current_position: "#67b9e8",
				finish: "#65c644",
				visited_block: "#d7edff"
			},
			offset: {x: 0, y: 0}, // top left corner where the maze is actually drawn
			scale: 26,
			user_diameter: 4,
			user_path_width: 8,
		}

		// TODO: don't use jQuery here
		this.options = $.extend({}, defaultOptions, options);
	}

	update() {
		this.draw();
		showSteps() // TODO don't reference external function
	}

	center() {
		let $body = $('body');
		this.canvas.width = $body.width();
		this.canvas.height = $body.height();

		this.options.offset.x = Math.floor((this.canvas.width / 2) - (this.state.width * this.options.scale / 2));
		this.options.offset.y = Math.floor((this.canvas.height / 2) - (this.state.height * this.options.scale / 2));
		$("#a").width(this.state.width * this.options.scale + 3).css('padding-top', (this.canvas.height / 2) - (this.state.height * this.options.scale / 2) - $('h1').height());

		$("#time, #steps").css('margin-top', this.state.height * this.options.scale);
		this.draw();
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	draw() {
		this.clear();
		this.drawPath();
		this.drawMaze();
	}

	drawPath() {
		this.ctx.lineWidth = this.options.user_path_width;
		this.ctx.strokeStyle = this.options.colors.visited_block;
		this.ctx.beginPath();
		this.ctx.moveTo(this.options.offset.x + 0.5 * this.options.scale, 0);
		for (let i = 0; i < this.state.path.length - 1; i++) {
			let pathPosition = this.state.path[i];
			this.ctx.lineTo(this.options.offset.x + (pathPosition.x + 0.5) * this.options.scale, this.options.offset.y + (pathPosition.y + 0.5) * this.options.scale);
		}
		this.ctx.lineTo(this.options.offset.x + (this.state.currentPos.x + 0.5) * this.options.scale, this.options.offset.y + (this.state.currentPos.y + 0.5) * this.options.scale);
		this.ctx.stroke();
		this.circle(this.state.currentPos.x, this.state.currentPos.y, this.options.colors.current_position);
	}

	drawMaze() {
		this.circle(this.state.end.x, this.state.end.y, this.options.colors.finish);

		for (let x = 0; x < this.state.width; x++) {
			for (let y = 0; y < this.state.height; y++) {
				let cell = this.state.getCell(x, y);
				this.drawCell(cell);
			}
		}
	}

	drawCell(cell) {
		var originx = cell.x * this.options.scale;
		var originy = cell.y * this.options.scale;
		if (cell.up && !this.state.isStartCell(cell)) this.line(originx, originy, originx + this.options.scale, originy);
		if (cell.down && !this.state.isEndCell(cell)) this.line(originx, originy + this.options.scale, originx + this.options.scale, originy + this.options.scale);
		if (cell.right) this.line(originx + this.options.scale, originy, originx + this.options.scale, originy + this.options.scale);
		if (cell.left) this.line(originx, originy, originx, originy + this.options.scale);
	}

	line(x1, y1, x2, y2) {
		this.ctx.beginPath();
		this.ctx.strokeStyle = this.options.colors.walls;
		this.ctx.lineWidth = 2;
		this.ctx.moveTo(this.options.offset.x + x1 + 1, this.options.offset.y + y1 + 1);
		this.ctx.lineTo(this.options.offset.x + x2 + 1, this.options.offset.y + y2 + 1);
		this.ctx.stroke();
	}

	circle(x, y, color) {
		this.ctx.fillStyle = color;
		this.ctx.beginPath();
		this.ctx.arc(this.options.offset.x + (x + 0.5) * this.options.scale, this.options.offset.y + (y + 0.5) * this.options.scale, this.options.user_diameter, 0, Math.PI*2, true);
		this.ctx.closePath();
		this.ctx.fill();
	}
}

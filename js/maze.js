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
	
class Rand {
	randomInt(x) {
		return Math.floor(Math.random() * x);
	}
	pickRand(al) {
		return al[this.randomInt(al.length)];
	}
}
	
class Maze {
	constructor(width, height, start) {
		this.m = [];
		this.width = width;
		this.height = height;
		this.start = start;
		this.end = {
			x: this.width - 1,
			y: this.height - 1
		};
		this.rand = new Rand();
		this.initMaze();
		this.generateMaze();
	}
	initMaze() {
		for (let y = 0; y < this.height; y++) {
			this.m.push([]);
			for (let x = 0; x < this.width; x++) {
				this.m[y].push(new Cell(x, y));
			}
		}
	};
	getNeighbors(x, y) {
		var n = [];
		var c = this.getCell(x, y);
		if (y != 0) {
			n.push(this.getCell(x, y - 1));
		}
		if (y != this.height - 1) {
			n.push(this.getCell(x, y + 1));
		}
		if (x != 0) {
			n.push(this.getCell(x - 1, y));
		}
		if (x != this.width - 1) {
			n.push(this.getCell(x + 1, y));
		}
		return n;
	};
	availableNeighbors(x, y) {
		var list = [];
		var neighbors = this.getNeighbors(x, y);
		for (let i = 0; i < neighbors.length; i++) {
			if (!neighbors[i].visited) list.push(neighbors[i]);
		}
		return list;
	};
	randomNeighbor(x, y) {
		return this.rand.pickRand(this.availableNeighbors(x, y));
	};
	randomCell() {
		return this.getCell(this.rand.randomInt(this.width), this.rand.randomInt(this.height));
	};
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
	};
	getCell(x, y) {
		return this.m[y][x];
	};
	inBounds(x, y) {
		if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
			return true;
		}
		return false;
	};
	isDeadEnd(x, y) {
		var neighbors = this.getNeighbors(x, y);
		for (let i = 0; i < neighbors.length; i++) {
			if (!neighbors[i].visited) return false;
		}
		return true;
	};
	isStart(x, y) {
		if (this.start.x === x && this.start.y === y) return true;
		return false;
	};
	isEnd(x, y) {
		if (this.end.x === x && this.end.y === y) return true;
		return false;
	};
	/* Generate the maze using recursive backtracking
	*  https://en.wikipedia.org/wiki/Maze_generation_algorithm#Recursive_backtracker
	*/
	generateMaze() {
		var current_cell = this.randomCell();
		var next_cell = null;
		
		current_cell.visited = true;
		var visitedStack = [current_cell];
		
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
	};
}

class MazeGame {
	constructor(canvas, options) {
		this.canvas = canvas;

		let default_options = {
			colors: {
				walls: "#ee4646",
				current_position: "#67b9e8",
				finish: "#65c644",
				visited_block: "#d7edff"
			},
			starting_position: { x: 0, y: 0 },
			level_size: [16, 10],
			offset: {x: 0, y: 0},
			scale: 26,
			user_diameter: 4,
			user_path_width: 8,
			onStart: function(){},
			onGameEnd: function(){},
			onMove: function(){}
		}

		// todo: don't use jQuery here
		this.options = $.extend({}, default_options, options);

		// todo: don't use jQuery here
		$(window).on('resize', this.center);
		
		this.currentPos = null;
		this.ctx = null;
		this.maze = null;
		this.path = null;
		this.gameInProgress = false;

		this.offsets = {
			"left"	:	{ x: -1, y: 0 },
			"up"	:	{ x: 0, y:	-1 },
			"right"	:	{ x: 1, y: 0 },
			"down"	:	{ x: 0, y: 1 }
		};

		this.rand = new Rand();
	
		this.init();
	}
	
	init() {
		if (this.canvas.getContext) {
			this.ctx = this.canvas.getContext("2d");
			this.setup(this.options.level_size[0], this.options.level_size[1]);
			this.start();
		}
	}

	setup(height, width) {
		this.currentPos = this.options.starting_position;
		this.maze = new Maze(height, width, this.currentPos);
		this.path = [this.currentPos];
		this.center();
	}

	center() {
		this.canvas.width = this.maze.width * this.options.scale + 3;
		this.canvas.height = this.maze.height * this.options.scale + 3;
		this.canvas.width = $('body').width();
		this.canvas.height = $('body').height();
		this.options.offset.x = Math.floor((this.canvas.width / 2) - (this.maze.width * this.options.scale / 2));
		this.options.offset.y = Math.floor((this.canvas.height / 2) - (this.maze.height * this.options.scale / 2));
		$("#a").width(this.maze.width * this.options.scale + 3).css('padding-top', (this.canvas.height / 2) - (this.maze.height * this.options.scale / 2) - $('h1').height());
		$("#time, #steps").css('margin-top', this.maze.height * this.options.scale);
		this.draw();
	}
	
	start() {
		this.gameInProgress = true;
		this.options.onStart();
	}
	
	draw() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.drawPath();
		this.drawMaze();
	}
	
	move(direction) {
		var newPos = {
			x: this.currentPos.x + this.offsets[direction].x,
			y: this.currentPos.y + this.offsets[direction].y
		};
		if (this.gameInProgress && this.maze.inBounds(newPos.x, newPos.y)) {
			if (this.maze.getCell(this.currentPos.x, this.currentPos.y)[direction] === false) {
				this.path.push(newPos);
				this.currentPos = newPos;
				this.draw();
				showSteps()
				if (this.maze.isEnd(newPos.x, newPos.y)) {
					this.options.onGameEnd(true);
				}
			}
		}
	}
	
	drawPath() {
		this.ctx.lineWidth = this.options.user_path_width;
		this.ctx.strokeStyle = this.options.colors.visited_block;
		this.ctx.beginPath();
		this.ctx.moveTo(this.options.offset.x + 0.5 * this.options.scale, 0);
		for (let i = 0; i < this.path.length - 1; i++) {
			this.ctx.lineTo(this.options.offset.x + (this.path[i].x + 0.5) * this.options.scale, this.options.offset.y + (this.path[i].y + 0.5) * this.options.scale);
		}
		this.ctx.lineTo(this.options.offset.x + (this.currentPos.x + 0.5) * this.options.scale, this.options.offset.y + (this.currentPos.y + 0.5) * this.options.scale);
		this.ctx.stroke();
		this.circle(this.currentPos.x, this.currentPos.y, this.options.colors.current_position);
	}
	
	drawMaze() {
		this.circle(this.maze.end.x, this.maze.end.y, this.options.colors.finish);
		for (let y = 0; y < this.maze.height; y++) {
			for (let x = 0; x < this.maze.width; x++) {
				this.drawCell(x, y);
			}
		}
	}
	
	drawCell(x, y) {
		var curCell = this.maze.getCell(x, y);
		var originx = x * this.options.scale;
		var originy = y * this.options.scale;
		if (curCell.up && !this.maze.isStart(curCell.x, curCell.y)) this.line(originx, originy, originx + this.options.scale, originy);
		if (curCell.down && !this.maze.isEnd(curCell.x, curCell.y)) this.line(originx, originy + this.options.scale, originx + this.options.scale, originy + this.options.scale);
		if (curCell.right) this.line(originx + this.options.scale, originy, originx + this.options.scale, originy + this.options.scale);
		if (curCell.left) this.line(originx, originy, originx, originy + this.options.scale);
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
	
	getSteps() {
		// subtract one to account for the current positon being part of the path
		return this.path.length - 1;
	}
}

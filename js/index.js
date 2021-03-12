/// Matter-JS Setup
const { World, Bodies, Runner, Engine, Render, Body, Events } = Matter
const WALLS_WIDTH = 5
const WIDTH = window.innerWidth
const HEIGHT = window.innerHeight
const CELLS_HORIZONTAL = 25
const CELLS_VERTICAL = 25
const UNIT_LENGTH_X = WIDTH / CELLS_HORIZONTAL
const UNIT_LENGTH_Y = HEIGHT / CELLS_VERTICAL
const START_ROW = Math.floor(Math.random() * CELLS_VERTICAL)
const START_COLUMN = Math.floor(Math.random() * CELLS_HORIZONTAL)

const GRID = Array(CELLS_VERTICAL)
	.fill(null)
	.map(() => Array(CELLS_HORIZONTAL).fill(false))
const VERTICALS = Array(CELLS_VERTICAL)
	.fill(null)
	.map(() => Array(CELLS_HORIZONTAL - 1).fill(false))
const HORIZONTALS = Array(CELLS_VERTICAL - 1)
	.fill(null)
	.map(() => Array(CELLS_HORIZONTAL).fill(false))
const engine = Engine.create()
engine.world.gravity.y = 0
const runner = Runner.create()
const render = Render.create({
	element: document.body,
	engine,
	options: {
		wireframes: false,
		width: WIDTH,
		height: HEIGHT,
	},
})
Render.run(render)
Runner.run(runner, engine)
const { world } = engine

// Walls (Borders)
const WALLS_RECTANGLES = [
	[WIDTH / 2, 0, WIDTH, WALLS_WIDTH],
	[WIDTH / 2, HEIGHT, WIDTH, WALLS_WIDTH],
	[0, HEIGHT / 2, WALLS_WIDTH, HEIGHT],
	[WIDTH, HEIGHT / 2, WALLS_WIDTH, HEIGHT],
]
const walls = WALLS_RECTANGLES.map((rec) =>
	Bodies.rectangle(...rec, { isStatic: true })
)
World.add(world, walls)

// MAZE Generation
const stepThroughCell = (row, column) => {
	// If I have visited the cell at [row, column], then return
	if (GRID[row][column]) return
	// Mark this cell as being visited
	GRID[row][column] = true
	// Assemble randomly-ordered list of neighbors
	const neighbors = shuffle([
		[row - 1, column, 'up'],
		[row, column - 1, 'left'],
		[row + 1, column, 'down'],
		[row, column + 1, 'right'],
	])

	// For each neighbor....
	for (let neighbor of neighbors) {
		const [nextRow, nextColumn, direction] = neighbor
		// See if that neighbor is out of bounds
		if (
			nextRow < 0 ||
			nextRow >= CELLS_VERTICAL ||
			nextColumn < 0 ||
			nextColumn >= CELLS_HORIZONTAL
		) {
			continue
		}
		// If we have visited that neighbor, continue to next neighbor
		if (GRID[nextRow][nextColumn]) {
			continue
		}
		// Remove a wall from eigther horizontals or veticals
		if (direction === 'left') {
			VERTICALS[row][column - 1] = true
		} else if (direction === 'right') {
			VERTICALS[row][column] = true
		} else if (direction === 'up') {
			HORIZONTALS[row - 1][column] = true
		} else if (direction === 'down') {
			HORIZONTALS[row][column] = true
		}
		// Visit that next cell
		stepThroughCell(nextRow, nextColumn)
	}
}

stepThroughCell(START_ROW, START_COLUMN)

HORIZONTALS.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return
		}
		const wall = Bodies.rectangle(
			columnIndex * UNIT_LENGTH_X + UNIT_LENGTH_X / 2,
			rowIndex * UNIT_LENGTH_Y + UNIT_LENGTH_Y,
			UNIT_LENGTH_X,
			5,
			{
				isStatic: true,
				label: 'wall',
				render: { fillStyle: '#ecf0f1' },
			}
		)
		World.add(world, wall)
	})
})

VERTICALS.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return
		}
		const wall = Bodies.rectangle(
			columnIndex * UNIT_LENGTH_X + UNIT_LENGTH_X,
			rowIndex * UNIT_LENGTH_Y + UNIT_LENGTH_Y / 2,
			5,
			UNIT_LENGTH_Y,
			{ isStatic: true, label: 'wall', render: { fillStyle: '#ecf0f1' } }
		)
		World.add(world, wall)
	})
})

// GOAL
const GOAL = Bodies.rectangle(
	WIDTH - UNIT_LENGTH_X / 2,
	HEIGHT - UNIT_LENGTH_Y / 2,
	UNIT_LENGTH_X * 0.7,
	UNIT_LENGTH_Y * 0.7,
	{
		isStatic: true,
		label: 'goal',
		render: {
			fillStyle: '#2ecc71',
		},
	}
)
World.add(world, GOAL)

// BALL
const BALL_RADIUS = Math.min(UNIT_LENGTH_X, UNIT_LENGTH_Y) / 4
const BALL = Bodies.circle(UNIT_LENGTH_X / 2, UNIT_LENGTH_Y / 2, BALL_RADIUS, {
	label: 'ball',
})
World.add(world, BALL)
BALL.friction = 0
BALL.frictionAir = 0.1
BALL.restitution = 0
// KEY CONTROLS
const CONTROLS_KEYCODES = {
	w: 87,
	d: 68,
	a: 65,
	s: 83,
}
document.addEventListener('keyup', (event) => {
	event.preventDefault()
	const { x, y } = BALL.velocity
	if (event.keyCode === CONTROLS_KEYCODES.w) {
		Body.setVelocity(BALL, { x, y: y - 5 })
	}
	if (event.keyCode === CONTROLS_KEYCODES.s) {
		Body.setVelocity(BALL, { x, y: y + 5 })
	}
	if (event.keyCode === CONTROLS_KEYCODES.a) {
		Body.setVelocity(BALL, { x: x - 5, y })
	}
	if (event.keyCode === CONTROLS_KEYCODES.d) {
		Body.setVelocity(BALL, { x: x + 5, y })
	}
})

// WIN Condition
Events.on(engine, 'collisionStart', (event) => {
	event.pairs.forEach((collision) => {
		const labels = ['ball', 'goal']
		if (
			labels.includes(collision.bodyA.label) &&
			labels.includes(collision.bodyB.label)
		) {
			world.gravity.y = 1
			world.bodies.forEach((body) => {
				if (body.label === 'wall') {
					Body.setStatic(body, false)
					document.querySelector('.winner').classList.remove('hidden')
				}
			})
		}
	})
})

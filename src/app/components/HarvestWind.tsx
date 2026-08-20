import { memo, useEffect, useRef } from "react"
import styles from "./particles.module.scss"

const VARIANT_COUNT = 4
const DEPTH_COUNT = 3
const SPRITE_WIDTH = 256
const SPRITE_HEIGHT = 180
const TILE_STRIDE = 144
const MAX_GUSTS = 10
const FLOATER_LIFETIME = 9000
const BREATH_AMPL_MEAN = .02
const BREATH_AMPL_STDEV = .005
const BREATH_PERIOD_MEAN = 10
const BREATH_PERIOD_STDEV = .5
const TAU = Math.PI * 2

const PALETTES = [
	["#d89a37", "#fff1a6", "#ffe174"],
	["#c96d20", "#ffdc67", "#f5a62e"],
	["#753017", "#f7ad36", "#c85a1d"],
] as const

const FLOATER_COLORS = [
	["#d66b20", "#7a2815"],
	["#f2a629", "#9a3c18"],
	["#ffd96a", "#b45a1c"],
	["#fff0ad", "#a54a20"],
] as const

interface Tile {
	x: number
	y: number
	alpha: number
	phase: number
	speed: number
	breathPhase: number
	halfWidth: number
	height: number
	visibleWidth: number
	sourceX: number
	sourceY: number
	sourceWidth: number
}

interface Gust {
	y: number
	radiusX: number
	radiusY: number
	strength: number
	startedAt: number
	duration: number
	centerX: number
	centerY: number
	frameStrength: number
}

interface Floater {
	x: number
	y: number
	length: number
	width: number
	speed: number
	drift: number
	angle: number
	spin: number
	phase: number
	alpha: number
	fill: string
	stroke: string
	bornAt: number
}

function normal(rand_gen: ()=>number, mean: number, stdev: number) {
	const u = 1 - rand_gen(); // Converting [0,1) to (0,1]
	const v = rand_gen();
	const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
	// Transform to the desired mean and standard deviation:
	return z * stdev + mean;
}

class PRNG {
	private _value: number
	public nextNormal: (mean: number, stdev: number)=>number
	constructor(seed: number = (Date.now() % 1e9)/1e9) {
		this._value = seed
		this.nextNormal = normal.bind(undefined, this.next.bind(this))
	}
	setSeed(value: number) {
		this._value = value
	}
	getSeed() {
		return this._value
	}
	next() {
		const value = Math.sin(this._value * 12.9898) * 43758.5453
		this._value = value
		return value - Math.floor(value)
	}
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const atlasCache = new Map<number, HTMLCanvasElement>()

const createAtlas = (atlasScale: number) => {
	const cachedAtlas = atlasCache.get(atlasScale)
	if (cachedAtlas) return cachedAtlas

	const canvas = document.createElement("canvas")
	canvas.width = SPRITE_WIDTH * VARIANT_COUNT * atlasScale
	canvas.height = SPRITE_HEIGHT * DEPTH_COUNT * atlasScale

	const ctx = canvas.getContext("2d")!
	ctx.setTransform(atlasScale, 0, 0, atlasScale, 0, 0)
	ctx.lineCap = "round"
	ctx.lineJoin = "round"
	const prng = new PRNG()

	for (let depth = 0; depth < DEPTH_COUNT; depth++) {
		const palette = PALETTES[depth]

		for (let variant = 0; variant < VARIANT_COUNT; variant++) {
			const offsetX = variant * SPRITE_WIDTH
			const offsetY = depth * SPRITE_HEIGHT
			const bladeCount = 44 + variant * 4
			ctx.save()
			ctx.beginPath()
			ctx.rect(offsetX, offsetY, SPRITE_WIDTH, SPRITE_HEIGHT)
			ctx.clip()

			for (let blade = 0; blade < bladeCount; blade++) {
				const rootX = offsetX + (blade + prng.next() * .9) * TILE_STRIDE / bladeCount
				const rootY = offsetY + SPRITE_HEIGHT - 2 - prng.next() * SPRITE_HEIGHT/3
				const length = prng.nextNormal(120, 20)
				const lean = prng.nextNormal(.68, .05)
				const reach = length * lean
				const rise = length * prng.nextNormal(.4, .07)
				const tipX = rootX + reach
				const tipY = rootY - rise
				let colorValue = prng.next()
				const color = colorValue > 0.72 ? palette[1] : colorValue > 0.24 ? palette[2] : palette[0]

				ctx.globalAlpha = (.42 + prng.next() * .42) * (.72 + depth * .12)
				if (prng.next() > .62) {
					const ribbonWidth = .9 + prng.next() * 1.8
					ctx.fillStyle = color
					ctx.beginPath()
					ctx.moveTo(rootX - ribbonWidth / 2, rootY)
					ctx.bezierCurveTo(
						rootX + reach * .62,
						rootY - rise * .92,
						rootX + reach * .62,
						rootY - rise * .92,
						tipX,
						tipY,
					)
					ctx.bezierCurveTo(
						rootX + reach * .58,
						rootY - rise * .82,
						rootX + reach * .58,
						rootY - rise * .82,
						rootX + ribbonWidth / 2,
						rootY,
					)
					ctx.closePath()
					ctx.fill()
				} else {
					ctx.strokeStyle = color
					ctx.lineWidth = .45 + prng.next() * 1.15
					ctx.beginPath()
					ctx.moveTo(rootX, rootY)
					ctx.bezierCurveTo(
						rootX + reach * .62,
						rootY - rise * .92,
						rootX + reach * .62,
						rootY - rise * .92,
						tipX,
						tipY,
					)
					ctx.stroke()
				}
			}
			ctx.restore()
		}
	}

	ctx.globalAlpha = 1
	atlasCache.set(atlasScale, canvas)
	return canvas
}

interface Props {
	active: boolean
}

const HarvestWind = ({ active }: Props) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const setActiveRef = useRef<(active: boolean)=>void>(null)

	useEffect(() => {
		const container = containerRef.current
		const canvas = canvasRef.current
		const ctx = canvas?.getContext("2d", { alpha: true })
		if (!container || !canvas || !ctx) return

		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
		const mobile = window.matchMedia("(pointer: coarse)").matches
		const maxDpr = mobile ? 1.25 : 2
		const targetFps = mobile ? 24 : 60
		const atlasScale = mobile ? 2 : 4
		const floatersEnabled = !mobile
		const dimensions = { width: 0, height: 0, horizon: 0, mobile: false }
		const atlas = createAtlas(atlasScale)
		let fieldGradient: CanvasGradient
		let horizonGradient: CanvasGradient
		let tiles: Tile[] = []
		let gusts: Gust[] = []
		let floaters: Floater[] = []
		let raf = 0
		let lastFrame = 0
		let nextFrameAt = 0
		let nextGustAt = 0
		let nextFloaterAt = 0
		let dpr = 1
		let clearTop = 0
		let breath_period = normal(Math.random, BREATH_PERIOD_MEAN, BREATH_PERIOD_STDEV)*1000
		let breath_ampl = normal(Math.random, BREATH_AMPL_MEAN, BREATH_AMPL_STDEV)
		const prng = new PRNG()
		const seed = prng.getSeed()
		const frameDuration = 1000 / targetFps

		const createTiles = () => {
			const aspectRatio = dimensions.height / dimensions.width
			const rowCount = dimensions.height > dimensions.width
				? clamp(8 + Math.round((aspectRatio - 1) * 1.5), 8, 12)
				: dimensions.mobile ? 6 : 8
			const viewportScale = clamp(dimensions.width / 1280, .85, 1.75)
			tiles = []
			clearTop = dimensions.horizon - 12
			for (let row = 0; row < rowCount; row++) {
				prng.setSeed(seed + row)
				const depth = row / (rowCount - 1.3)
				const projectedDepth = Math.pow(depth, 1.22)
				const scale = (.34 + projectedDepth * 1.31) * viewportScale
				const width = SPRITE_WIDTH * scale
				const height = SPRITE_HEIGHT * scale
				const step = TILE_STRIDE * scale
				const y = dimensions.horizon + projectedDepth * (dimensions.height - dimensions.horizon + SPRITE_HEIGHT/4)
				const palette = projectedDepth < .25 ? 0 : projectedDepth < .68 ? 1 : 2
				const tileCount = Math.ceil(dimensions.width / step) + 1
				const startX = dimensions.width - tileCount * step
				clearTop = Math.min(clearTop, y - height - Math.abs(breath_ampl) * width - 2)

				for (let index = 0; index < tileCount; index++) {
					const x = startX + index * step
					const visibleWidth = Math.min(width, dimensions.width - x)
					const phase = prng.next() * TAU
					const speed = prng.nextNormal(1, .08)
					const variant = Math.floor(prng.next() * VARIANT_COUNT)
					tiles.push({
						x,
						y,
						alpha: .42 + projectedDepth * .5,
						phase,
						speed,
						breathPhase: (x + y) / 1000,
						halfWidth: width / 2,
						height,
						visibleWidth,
						sourceX: variant * SPRITE_WIDTH * atlasScale,
						sourceY: palette * SPRITE_HEIGHT * atlasScale,
						sourceWidth: visibleWidth / scale * atlasScale,
					})
				}
			}
			clearTop = Math.max(0, Math.floor(clearTop))
		}

		const spawnGust = (now: number) => {
			const fieldHeight = dimensions.height - dimensions.horizon
			gusts.push({
				y: dimensions.horizon + fieldHeight * (.16 + Math.random()),
				radiusX: dimensions.width * (.18 + Math.random() * .12),
				radiusY: fieldHeight * (.14 + Math.random() * .1),
				strength: .035 + Math.random() * .035,
				startedAt: now,
				duration: 3000 + Math.random() * 2200,
				centerX: 0,
				centerY: 0,
				frameStrength: 0,
			})
			nextGustAt = now + 2000 + Math.random() * 2200
		}

		const spawnFloater = (now: number) => {
			const length = 28 + Math.random() * 38
			const colors = FLOATER_COLORS[Math.floor(Math.random() * FLOATER_COLORS.length)]
			floaters.push({
				x: Math.random() * dimensions.width,
				y: Math.random() * dimensions.height,
				length,
				width: 2 + Math.random() * 3,
				speed: .25 + Math.random() * .45,
				drift: (Math.random() - .5) * .08,
				angle: -.35 + Math.random() * .7,
				spin: (Math.random() - .5) * .008,
				phase: Math.random() * TAU,
				alpha: .42 + Math.random() * .2,
				fill: colors[0],
				stroke: colors[1],
				bornAt: now,
			})
			nextFloaterAt = now + 2600 + Math.random() * 3000
		}

		const drawField = (now: number) => {
			ctx.globalAlpha = 1
			ctx.fillStyle = fieldGradient
			ctx.fillRect(0, dimensions.horizon, dimensions.width, dimensions.height - dimensions.horizon)
			ctx.fillStyle = horizonGradient
			ctx.fillRect(0, dimensions.horizon - 12, dimensions.width, dimensions.height * .18)

			for (let j = 0; j < gusts.length; j++) {
				const gust = gusts[j]
				const progress = (now - gust.startedAt) / gust.duration
				gust.centerX = -gust.radiusX + progress * (dimensions.width + gust.radiusX * 2)
				gust.centerY = gust.y - progress * dimensions.height * .035
				gust.frameStrength = Math.sin(progress * Math.PI) * gust.strength
			}

			const breathTime = ((now % breath_period) / breath_period) * TAU
			for (let i = 0; i < tiles.length; i++) {
				const tile = tiles[i]
				let bend = .025 + Math.sin(now * .00042 * tile.speed + tile.phase) * .014

				for (let j = 0; j < gusts.length; j++) {
					const gust = gusts[j]
					const dx = (tile.x + tile.halfWidth - gust.centerX) / gust.radiusX
					const dy = (tile.y - gust.centerY) / gust.radiusY
					const distance = dx * dx + dy * dy
					if (distance < 1) {
						bend += (1 - distance) * (1 - distance) * gust.frameStrength
					}
				}
				const breath = breath_ampl * Math.sin(breathTime + tile.breathPhase)

				ctx.setTransform(
					dpr,
					breath * dpr,
					(-bend - breath) * dpr,
					dpr,
					tile.x * dpr,
					tile.y * dpr,
				)
				ctx.globalAlpha = tile.alpha
				ctx.drawImage(
					atlas,
					tile.sourceX,
					tile.sourceY,
					tile.sourceWidth,
					SPRITE_HEIGHT * atlasScale,
					0,
					-tile.height,
					tile.visibleWidth,
					tile.height,
				)
			}
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
		}

		const drawFloaters = (now: number, delta: number) => {
			const step = delta / (1000 / 60)

			for (let i = floaters.length - 1; i >= 0; i--) {
				const floater = floaters[i]
				const progress = (now - floater.bornAt) / FLOATER_LIFETIME
				if (progress >= 1) {
					floaters.splice(i, 1)
					continue
				}
				floater.phase += .014 * step
				floater.angle += floater.spin * step
				floater.x += floater.speed * step
				floater.y -= (floater.drift + Math.sin(floater.phase) * .05) * step

				ctx.save()
				ctx.translate(floater.x, floater.y)
				ctx.rotate(floater.angle + Math.sin(floater.phase) * .16)
				ctx.globalAlpha = floater.alpha * Math.min(1, progress / .18, (1 - progress) / .25)
				ctx.fillStyle = floater.fill
				ctx.strokeStyle = floater.stroke
				ctx.lineWidth = .65
				ctx.beginPath()
				ctx.moveTo(-floater.length / 2, 0)
				ctx.quadraticCurveTo(0, -floater.width, floater.length / 2, 0)
				ctx.quadraticCurveTo(0, floater.width * .4, -floater.length / 2, 0)
				ctx.fill()
				ctx.stroke()
				ctx.restore()
			}
		}

		const draw = (now: number, delta = 0) => {
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
			const top = floatersEnabled ? 0 : clearTop
			ctx.clearRect(0, top, dimensions.width, dimensions.height - top)
			drawField(now)
			if (delta && floatersEnabled) drawFloaters(now, delta)
			ctx.globalAlpha = 1
		}

		const animate = (now: number) => {
			raf = 0
			if (!nextFrameAt || now >= nextFrameAt - .5) {
				const delta = lastFrame ? Math.min(now - lastFrame, 50) : frameDuration
				lastFrame = now
				nextFrameAt = nextFrameAt ? nextFrameAt + frameDuration : now + frameDuration
				if (nextFrameAt <= now) nextFrameAt = now + frameDuration

				for (let i = gusts.length - 1; i >= 0; i--) {
					if (now - gusts[i].startedAt >= gusts[i].duration) gusts.splice(i, 1)
				}
				if (now >= nextGustAt && gusts.length < MAX_GUSTS) spawnGust(now)

				if (floatersEnabled) {
					const floaterLimit = dimensions.mobile ? 1 : 3
					if (now >= nextFloaterAt && floaters.length < floaterLimit) spawnFloater(now)
				}

				draw(now, delta)
			}
			raf = requestAnimationFrame(animate)
		}

		const start = () => {
			if (reducedMotion || raf || !dimensions.width) return
			lastFrame = 0
			nextFrameAt = 0
			raf = requestAnimationFrame(animate)
		}

		const stop = () => {
			if (raf) cancelAnimationFrame(raf)
			raf = 0
		}

		const resize = () => {
			const rect = container.getBoundingClientRect()
			dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
			dimensions.width = rect.width
			dimensions.height = rect.height
			dimensions.horizon = rect.height * .55
			dimensions.mobile = rect.width < 600 || rect.height < 540
			canvas.width = Math.max(1, Math.floor(rect.width * dpr))
			canvas.height = Math.max(1, Math.floor(rect.height * dpr))
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
			ctx.imageSmoothingEnabled = true

			fieldGradient = ctx.createLinearGradient(0, dimensions.horizon, 0, dimensions.height)
			fieldGradient.addColorStop(0, "rgb(255 229 116 / 8%)")
			fieldGradient.addColorStop(.18, "rgb(242 166 41 / 15%)")
			fieldGradient.addColorStop(.62, "rgb(94 34 20 / 27%)")
			fieldGradient.addColorStop(1, "rgb(22 8 7 / 48%)")

			horizonGradient = ctx.createLinearGradient(0, dimensions.horizon - 12, 0, dimensions.horizon + dimensions.height * .16)
			horizonGradient.addColorStop(0, "rgb(255 243 208 / 0%)")
			horizonGradient.addColorStop(.2, "rgb(255 225 111 / 25%)")
			horizonGradient.addColorStop(.55, "rgb(242 166 41 / 9%)")
			horizonGradient.addColorStop(1, "rgb(242 166 41 / 0%)")

			createTiles()
			gusts = []
			floaters = []
			const now = performance.now()
			nextGustAt = now + 2000 + Math.random() * 2200
			nextFloaterAt = now + 2600 + Math.random() * 3000
			draw(reducedMotion ? 0 : now)
		}

		const setActive = (value: boolean) => value ? start() : stop()
		setActiveRef.current = setActive

		const resizeObserver = new ResizeObserver(resize)
		resizeObserver.observe(container)
		resize()

		return () => {
			stop()
			resizeObserver.disconnect()
			if (setActiveRef.current === setActive) setActiveRef.current = null
		}
	}, [])

	useEffect(() => {
		const syncActivity = () => setActiveRef.current?.(active && !document.hidden)
		syncActivity()
		document.addEventListener("visibilitychange", syncActivity)
		return () => document.removeEventListener("visibilitychange", syncActivity)
	}, [active])

	return (
		<div ref={containerRef} className={styles["harvest-wind"]} data-active={active} aria-hidden>
			<canvas ref={canvasRef} />
		</div>
	)
}

export default memo(HarvestWind)

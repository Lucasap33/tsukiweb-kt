import { memo, useEffect, useRef } from "react"
import styles from "./particles.module.scss"

const VARIANT_COUNT = 4
const DEPTH_COUNT = 4
const FOREGROUND_DEPTH = DEPTH_COUNT - 1
const SPRITE_WIDTH = 256
const SPRITE_HEIGHT = 180
const TILE_STRIDE = 144
const MAX_GUSTS = 10
const MOTE_COUNT = 28
const FOREGROUND_BLUR = 1.4
const MOBILE_ANIMATED_ROWS = 3
const MOBILE_PIXEL_BUDGET = 2_400_000
const BREATH_AMPL_MEAN = .02
const BREATH_AMPL_STDEV = .005
const BREATH_PERIOD_MEAN = 10
const BREATH_PERIOD_STDEV = .5
const SUN_X = .22
const HORIZON = .55
const TAU = Math.PI * 2

const PALETTES = [
	{ root: "#e9a742", tip: "#ffeaa4", ear: "#ffe9a8" },
	{ root: "#b55c1a", tip: "#ffd35f", ear: "#ffdc7c" },
	{ root: "#4d1c0d", tip: "#eb962f", ear: "#f2b04a" },
	{ root: "#260c07", tip: "#b4551c", ear: "#ffb648" },
] as const

const FLOATER_COLORS = ["#fff3b8", "#ffd76a", "#f6b244", "#e58a2a"] as const

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
	bornAt: number
	lifetime: number
}

interface Mote {
	x: number
	y: number
	radius: number
	speed: number
	phase: number
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

const createGlowSprite = () => {
	const canvas = document.createElement("canvas")
	canvas.width = canvas.height = 128
	const ctx = canvas.getContext("2d")!
	const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
	gradient.addColorStop(0, "rgb(255 236 160 / 100%)")
	gradient.addColorStop(.45, "rgb(255 214 110 / 38%)")
	gradient.addColorStop(1, "rgb(255 200 90 / 0%)")
	ctx.fillStyle = gradient
	ctx.fillRect(0, 0, 128, 128)
	return canvas
}

const createAtlas = (atlasScale: number) => {
	const cachedAtlas = atlasCache.get(atlasScale)
	if (cachedAtlas) return cachedAtlas

	const canvas = document.createElement("canvas")
	canvas.width = SPRITE_WIDTH * VARIANT_COUNT * atlasScale
	canvas.height = SPRITE_HEIGHT * DEPTH_COUNT * atlasScale

	const foregroundY = FOREGROUND_DEPTH * SPRITE_HEIGHT
	const foreground = document.createElement("canvas")
	foreground.width = canvas.width
	foreground.height = SPRITE_HEIGHT * atlasScale

	const sharpCtx = canvas.getContext("2d")!
	const softCtx = foreground.getContext("2d")!
	sharpCtx.setTransform(atlasScale, 0, 0, atlasScale, 0, 0)
	softCtx.setTransform(atlasScale, 0, 0, atlasScale, 0, -foregroundY * atlasScale)
	const prng = new PRNG()

	for (let depth = 0; depth < DEPTH_COUNT; depth++) {
		const palette = PALETTES[depth]
		const ctx = depth == FOREGROUND_DEPTH ? softCtx : sharpCtx
		ctx.lineCap = "round"
		ctx.lineJoin = "round"

		for (let variant = 0; variant < VARIANT_COUNT; variant++) {
			const offsetX = variant * SPRITE_WIDTH
			const offsetY = depth * SPRITE_HEIGHT
			const bladeCount = (depth == FOREGROUND_DEPTH ? 20 : 46) + variant * 4
			ctx.save()
			ctx.beginPath()
			ctx.rect(offsetX, offsetY, SPRITE_WIDTH, SPRITE_HEIGHT)
			ctx.clip()

			for (let blade = 0; blade < bladeCount; blade++) {
				const hasEar = depth > 0 && prng.next() > .8
				const rootX = offsetX + (blade + prng.next() * .9) * TILE_STRIDE / bladeCount
				const rootY = offsetY + SPRITE_HEIGHT - 2 - prng.next() * SPRITE_HEIGHT / 3
				const width = (depth == FOREGROUND_DEPTH ? 2.6 : 1.1) + prng.next() * 2.1
				let length, lean, ctrlXFactor, ctrlYFactor
				if (hasEar) {
					length = clamp(prng.nextNormal(94, 18), 48, 132);
					lean = clamp(prng.nextNormal(.1, .04), .012, .2);
					ctrlXFactor = (.6 + prng.next() * .2)
					ctrlYFactor = (.75 + prng.next() * .16)
				} else {
					length = clamp(prng.nextNormal(118, 22), 60, 165)
					lean = clamp(prng.nextNormal(.5, .2), .06, .9)
					ctrlXFactor = (.18 + prng.next() * .2)
					ctrlYFactor = (1.02 + prng.next() * .16)
				}
				const reach = length * lean
				const rise = length * clamp(prng.nextNormal(.56, .09), .35, .74)
				const tipX = rootX + reach
				const tipY = rootY - rise
				const ctrlX = rootX + reach * ctrlXFactor
				const ctrlY = rootY - rise * ctrlYFactor

				const gradient = ctx.createLinearGradient(rootX, rootY, tipX, tipY)
				gradient.addColorStop(0, palette.root)
				gradient.addColorStop(.55, palette.tip)
				gradient.addColorStop(1, prng.next() > .6 ? palette.ear : palette.tip)
				ctx.globalAlpha = .5 + prng.next() * .45
				ctx.fillStyle = gradient
				ctx.beginPath()
				ctx.moveTo(rootX - width / 2, rootY)
				ctx.quadraticCurveTo(ctrlX - width * .3, ctrlY, tipX, tipY)
				ctx.quadraticCurveTo(ctrlX + width * .5, ctrlY + width * .6, rootX + width / 2, rootY)
				ctx.closePath()
				ctx.fill()

				if (hasEar) {
					const dirX = tipX - ctrlX, dirY = tipY - ctrlY
					const norm = Math.hypot(dirX, dirY) || 1
					const ux = dirX / norm, uy = dirY / norm
					const grains = 5 + Math.floor(prng.next() * 3)
					const grainLength = 3.6 + prng.next() * 1.2
					ctx.globalAlpha = .7 + prng.next() * .25
					ctx.fillStyle = palette.ear
					ctx.strokeStyle = palette.ear
					ctx.lineWidth = .35
					for (let grain = 0; grain < grains; grain++) {
						const side = grain % 2 ? 1 : -1
						const along = grain * grainLength * .62
						const gx = tipX + ux * along - uy * side * .8
						const gy = tipY + uy * along + ux * side * .8
						const angle = Math.atan2(uy, ux) + side * .26
						ctx.beginPath()
						ctx.ellipse(gx, gy, grainLength / 2, 1.05, angle, 0, TAU)
						ctx.fill()
						ctx.beginPath()
						ctx.moveTo(gx, gy)
						ctx.lineTo(gx + Math.cos(angle) * 6, gy + Math.sin(angle) * 6)
						ctx.stroke()
					}
				}
			}
			ctx.restore()
		}
	}

	sharpCtx.setTransform(1, 0, 0, 1, 0, 0)
	sharpCtx.globalAlpha = 1
	sharpCtx.beginPath()
	sharpCtx.rect(0, foregroundY * atlasScale, canvas.width, foreground.height)
	sharpCtx.clip()
	if ("filter" in sharpCtx)
		sharpCtx.filter = `blur(${FOREGROUND_BLUR * atlasScale}px)`
	sharpCtx.drawImage(foreground, 0, foregroundY * atlasScale)
	atlasCache.set(atlasScale, canvas)
	return canvas
}

interface Props {
	active: boolean
	still?: boolean
}

const isCoarsePointer = () => window.matchMedia("(pointer: coarse)").matches

const HarvestWind = ({ active, still = false }: Props) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const setActiveRef = useRef<(active: boolean)=>void>(null)

	useEffect(() => {
		const container = containerRef.current
		const canvas = canvasRef.current
		const ctx = canvas?.getContext("2d", { alpha: true })
		if (!container || !canvas || !ctx) return

		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
		const mobile = isCoarsePointer()
		const maxDpr = 2
		const targetFps = mobile ? 24 : 60
		const atlasScale = mobile ? 3 : 4
		const floatersEnabled = !mobile
		const dimensions = { width: 0, height: 0, horizon: 0, mobile: false }
		const atlas = createAtlas(atlasScale)
		const glowSprite = createGlowSprite()
		let fieldGradient: CanvasGradient
		let horizonGradient: CanvasGradient
		let sunGradient: CanvasGradient
		let motes: Mote[] = []
		let staticLayer: HTMLCanvasElement | null = null
		let staticCount = 0
		let tiles: Tile[] = []
		let gusts: Gust[] = []
		let floaters: Floater[] = []
		let raf = 0
		let lastFrame = 0
		let nextFrameAt = 0
		let clock = 0
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
				: dimensions.mobile ? 7 : 11
			const viewportScale = clamp(dimensions.width / 1280, .85, 1.75)
			tiles = []
			staticCount = 0
			clearTop = dimensions.horizon - 12
			for (let row = 0; row < rowCount; row++) {
				if (mobile && row == rowCount - MOBILE_ANIMATED_ROWS) staticCount = tiles.length
				prng.setSeed(seed + row)
				const depth = row / (rowCount - 1.3)
				const projectedDepth = Math.pow(depth, 1.22)
				const scale = (.2 + projectedDepth * 1.45) * viewportScale
				const width = SPRITE_WIDTH * scale
				const height = SPRITE_HEIGHT * scale
				const step = TILE_STRIDE * scale
				const y = dimensions.horizon + projectedDepth * (dimensions.height - dimensions.horizon + SPRITE_HEIGHT/4)
				const palette = row == rowCount - 1 ? FOREGROUND_DEPTH
					: projectedDepth < .22 ? 0 : projectedDepth < .6 ? 1 : 2
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
						alpha: Math.min(1, .5 + projectedDepth * .55),
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
				strength: .06 + Math.random() * .06,
				startedAt: now,
				duration: 3000 + Math.random() * 2200,
				centerX: 0,
				centerY: 0,
				frameStrength: 0,
			})
			nextGustAt = now + 2000 + Math.random() * 2200
		}

		const spawnFloater = (now: number) => {
			const depth = Math.random()
			const fromEdge = Math.random() > .35
			floaters.push({
				x: fromEdge ? -60 : Math.random() * dimensions.width * .7,
				y: dimensions.height * (.2 + Math.random() * .75),
				length: 14 + depth * depth * 70,
				width: 1.6 + depth * 4.4,
				speed: .7 + depth * 1.7,
				drift: (Math.random() - .35) * .35,
				angle: -.5 + Math.random(),
				spin: (Math.random() - .5) * .02,
				phase: Math.random() * TAU,
				alpha: depth > .85 ? .34 : .4 + depth * .4,
				fill: FLOATER_COLORS[Math.floor(Math.random() * FLOATER_COLORS.length)],
				bornAt: now,
				lifetime: 7000 + Math.random() * 6000,
			})
			nextFloaterAt = now + 450 + Math.random() * 1100
		}

		const createMotes = () => {
			motes = Array.from({ length: floatersEnabled ? MOTE_COUNT : 0 }, () => ({
				x: Math.random() * dimensions.width,
				y: Math.random() * dimensions.height,
				radius: .6 + Math.random() * 1.5,
				speed: .12 + Math.random() * .3,
				phase: Math.random() * TAU,
			}))
		}

		const drawField = (now: number) => {
			if (staticLayer) {
				ctx.setTransform(1, 0, 0, 1, 0, 0)
				ctx.globalAlpha = 1
				ctx.drawImage(staticLayer, 0, 0)
				ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
			} else {
				drawGround()
			}

			for (let j = 0; j < gusts.length; j++) {
				const gust = gusts[j]
				const progress = (now - gust.startedAt) / gust.duration
				gust.centerX = -gust.radiusX + progress * (dimensions.width + gust.radiusX * 2)
				gust.centerY = gust.y - progress * dimensions.height * .035
				gust.frameStrength = Math.sin(progress * Math.PI) * gust.strength
			}

			drawTiles(now, staticLayer ? staticCount : 0, tiles.length)
			if (!staticLayer) drawLight()
		}

		const drawGround = () => {
			ctx.globalAlpha = 1
			ctx.fillStyle = fieldGradient
			ctx.fillRect(0, dimensions.horizon, dimensions.width, dimensions.height - dimensions.horizon)
			ctx.fillStyle = horizonGradient
			ctx.fillRect(0, dimensions.horizon - 12, dimensions.width, dimensions.height * .18)
			drawTerraces()
		}

		const drawTiles = (now: number, start: number, end: number) => {
			const breathTime = ((now % breath_period) / breath_period) * TAU
			for (let i = start; i < end; i++) {
				const tile = tiles[i]
				let bend = .03
					+ Math.sin(now * .0007 - tile.x * .0042 + tile.y * .011) * .022
					+ Math.sin(now * .00042 * tile.speed + tile.phase) * .008

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

		const createStaticLayer = () => {
			staticLayer = null
			if (!mobile || !staticCount) return
			ctx.clearRect(0, 0, dimensions.width, dimensions.height)
			drawGround()
			drawTiles(0, 0, staticCount)
			drawLight()
			const layer = document.createElement("canvas")
			layer.width = canvas.width
			layer.height = canvas.height
			layer.getContext("2d")!.drawImage(canvas, 0, 0)
			ctx.clearRect(0, 0, dimensions.width, dimensions.height)
			staticLayer = layer
		}

		const drawTerraces = () => {
			const fieldHeight = dimensions.height - dimensions.horizon
			ctx.strokeStyle = "#b5601f"
			ctx.lineWidth = 1
			for (let i = 0; i < 5; i++) {
				const y = dimensions.horizon + fieldHeight * (.012 + i * i * .0065)
				ctx.globalAlpha = .2 + i * .04
				ctx.beginPath()
				ctx.moveTo(0, y + (i % 2 ? 3 : -2))
				ctx.quadraticCurveTo(dimensions.width * (.3 + i * .1), y - 4 + i, dimensions.width, y + (i % 2 ? -2 : 4))
				ctx.stroke()
			}
			ctx.globalAlpha = 1
		}

		const drawLight = () => {
			const fieldHeight = dimensions.height - dimensions.horizon
			ctx.save()
			ctx.beginPath()
			ctx.rect(0, dimensions.horizon, dimensions.width, fieldHeight)
			ctx.clip()
			ctx.globalCompositeOperation = "lighter"
			ctx.globalAlpha = 1
			ctx.fillStyle = sunGradient
			ctx.fillRect(0, dimensions.horizon, dimensions.width, fieldHeight)
			for (let j = 0; j < gusts.length; j++) {
				const gust = gusts[j]
				ctx.globalAlpha = Math.min(.3, gust.frameStrength * 2.6)
				ctx.drawImage(
					glowSprite,
					gust.centerX - gust.radiusX,
					gust.centerY - gust.radiusY * .6,
					gust.radiusX * 2,
					gust.radiusY * 1.2,
				)
			}
			ctx.restore()
		}

		const drawMotes = (now: number, delta: number) => {
			const step = delta / (1000 / 60)
			ctx.globalCompositeOperation = "lighter"
			ctx.fillStyle = "#ffeeb0"
			for (let i = 0; i < motes.length; i++) {
				const mote = motes[i]
				mote.x += mote.speed * step
				mote.y -= (mote.speed * .35 + Math.sin(now * .0006 + mote.phase) * .08) * step
				if (mote.x > dimensions.width + 4) mote.x = -4
				if (mote.y < -4) mote.y = dimensions.height + 4
				ctx.globalAlpha = .12 + (.5 + .5 * Math.sin(now * .0018 + mote.phase * 3)) * .5
				ctx.beginPath()
				ctx.arc(mote.x, mote.y, mote.radius, 0, TAU)
				ctx.fill()
			}
			ctx.globalCompositeOperation = "source-over"
		}

		const drawFloaters = (now: number, delta: number) => {
			const step = delta / (1000 / 60)

			for (let i = floaters.length - 1; i >= 0; i--) {
				const floater = floaters[i]
				const progress = (now - floater.bornAt) / floater.lifetime
				if (progress >= 1 || floater.x > dimensions.width + 80) {
					floaters.splice(i, 1)
					continue
				}
				let push = 1
				for (let j = 0; j < gusts.length; j++) {
					const gust = gusts[j]
					const dx = (floater.x - gust.centerX) / gust.radiusX
					const dy = (floater.y - gust.centerY) / gust.radiusY
					const distance = dx * dx + dy * dy
					if (distance < 1) push += (1 - distance) * gust.frameStrength * 14
				}
				floater.phase += .03 * step
				floater.angle += floater.spin * step * push
				floater.x += floater.speed * step * push
				floater.y += (Math.sin(floater.phase) * .45 - floater.drift) * step

				ctx.save()
				ctx.translate(floater.x, floater.y)
				ctx.rotate(floater.angle + Math.sin(floater.phase) * .3)
				ctx.scale(1, .35 + Math.abs(Math.cos(floater.phase * 1.7)) * .65)
				ctx.globalAlpha = floater.alpha * Math.min(1, progress / .12, (1 - progress) / .25)
				ctx.fillStyle = floater.fill
				ctx.beginPath()
				ctx.moveTo(-floater.length / 2, 0)
				ctx.quadraticCurveTo(0, -floater.width, floater.length / 2, 0)
				ctx.quadraticCurveTo(0, floater.width * .35, -floater.length / 2, 0)
				ctx.fill()
				ctx.restore()
			}
		}

		const draw = (now: number, delta = 0) => {
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
			const top = floatersEnabled ? 0 : clearTop
			ctx.clearRect(0, top, dimensions.width, dimensions.height - top)
			drawField(now)
			if (delta && floatersEnabled) {
				drawMotes(now, delta)
				drawFloaters(now, delta)
			}
			ctx.globalAlpha = 1
		}

		const animate = (frameTime: number) => {
			raf = 0
			if (!nextFrameAt || frameTime >= nextFrameAt - .5) {
				const delta = lastFrame ? Math.min(frameTime - lastFrame, 50) : frameDuration
				lastFrame = frameTime
				nextFrameAt = nextFrameAt ? nextFrameAt + frameDuration : frameTime + frameDuration
				if (nextFrameAt <= frameTime) nextFrameAt = frameTime + frameDuration
				clock += delta
				const now = clock

				for (let i = gusts.length - 1; i >= 0; i--) {
					if (now - gusts[i].startedAt >= gusts[i].duration) gusts.splice(i, 1)
				}
				if (now >= nextGustAt && gusts.length < MAX_GUSTS) spawnGust(now)

				if (floatersEnabled) {
					const floaterLimit = dimensions.mobile ? 4 : 10
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
			if (mobile)
				dpr = Math.max(1, Math.min(dpr, Math.sqrt(MOBILE_PIXEL_BUDGET / (rect.width * rect.height))))
			dimensions.width = rect.width
			dimensions.height = rect.height
			dimensions.horizon = rect.height * HORIZON
			dimensions.mobile = rect.width < 600 || rect.height < 540
			canvas.width = Math.max(1, Math.floor(rect.width * dpr))
			canvas.height = Math.max(1, Math.floor(rect.height * dpr))
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
			ctx.imageSmoothingEnabled = true

			fieldGradient = ctx.createLinearGradient(0, dimensions.horizon, 0, dimensions.height)
			fieldGradient.addColorStop(0, "rgb(250 205 110 / 44%)")
			fieldGradient.addColorStop(.07, "rgb(247 190 80 / 46%)")
			fieldGradient.addColorStop(.22, "rgb(226 140 44 / 36%)")
			fieldGradient.addColorStop(.62, "rgb(110 44 20 / 42%)")
			fieldGradient.addColorStop(1, "rgb(30 10 8 / 66%)")

			const sunX = dimensions.width * SUN_X
			const sunRadius = Math.max(dimensions.width, dimensions.height) * .5
			sunGradient = ctx.createRadialGradient(sunX, dimensions.horizon, 0, sunX, dimensions.horizon, sunRadius)
			sunGradient.addColorStop(0, "rgb(255 240 170 / 46%)")
			sunGradient.addColorStop(.25, "rgb(255 205 100 / 20%)")
			sunGradient.addColorStop(1, "rgb(255 180 70 / 0%)")

			horizonGradient = ctx.createLinearGradient(0, dimensions.horizon - 12, 0, dimensions.horizon + dimensions.height * .16)
			horizonGradient.addColorStop(0, "rgb(255 243 208 / 0%)")
			horizonGradient.addColorStop(.2, "rgb(255 225 111 / 25%)")
			horizonGradient.addColorStop(.55, "rgb(242 166 41 / 9%)")
			horizonGradient.addColorStop(1, "rgb(242 166 41 / 0%)")

			gusts = []
			createTiles()
			createStaticLayer()
			createMotes()
			floaters = []
			nextGustAt = clock + 2000 + Math.random() * 2200
			nextFloaterAt = clock + 600
			draw(reducedMotion ? 0 : clock)
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
		const syncActivity = () => setActiveRef.current?.(
			active && !document.hidden && !(still && isCoarsePointer()))
		syncActivity()
		document.addEventListener("visibilitychange", syncActivity)
		return () => document.removeEventListener("visibilitychange", syncActivity)
	}, [active, still])

	return (
		<div ref={containerRef} className={styles["harvest-wind"]} data-active={active} aria-hidden>
			<div className={styles.clouds} />
			<div className={styles.hills} />
			<canvas ref={canvasRef} />
			<div className={styles.rays} />
			<div className={styles.flare} />
			<div className={styles.grain} />
		</div>
	)
}

export default memo(HarvestWind)

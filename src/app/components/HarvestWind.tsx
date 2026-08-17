import { memo, useEffect, useRef } from "react"
import styles from "./particles.module.scss"

const DESKTOP_COUNT = 42
const MOBILE_COUNT = 26
const POINTER_RADIUS = 160
const POINTER_RADIUS_SQ = POINTER_RADIUS * POINTER_RADIUS

interface Wisp {
	x: number
	y: number
	length: number
	width: number
	speed: number
	drift: number
	phase: number
	alpha: number
	sparkle: boolean
}

const HarvestWind = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

		const canvas = canvasRef.current
		const ctx = canvas?.getContext("2d", { alpha: true })
		if (!canvas || !ctx) return

		const pointer = { x: -1000, y: -1000 }
		const dimensions = { width: 0, height: 0 }
		let wisps: Wisp[] = []
		let raf = 0

		const createWisp = (initial = false): Wisp => ({
			x: initial ? Math.random() * dimensions.width : -80,
			y: initial ? Math.random() * dimensions.height : dimensions.height * (0.45 + Math.random() * 0.65),
			length: 28 + Math.random() * 70,
			width: 0.5 + Math.random() * 1.4,
			speed: 0.45 + Math.random() * 0.85,
			drift: 0.08 + Math.random() * 0.28,
			phase: Math.random() * Math.PI * 2,
			alpha: 0.18 + Math.random() * 0.42,
			sparkle: Math.random() > 0.82,
		})

		const resize = () => {
			const rect = canvas.getBoundingClientRect()
			const dpr = Math.min(window.devicePixelRatio || 1, 2)
			dimensions.width = rect.width
			dimensions.height = rect.height
			canvas.width = Math.floor(rect.width * dpr)
			canvas.height = Math.floor(rect.height * dpr)
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
			const count = rect.width < 600 ? MOBILE_COUNT : DESKTOP_COUNT
			wisps = Array.from({ length: count }, () => createWisp(true))
		}

		const onPointerMove = (event: PointerEvent) => {
			pointer.x = event.clientX
			pointer.y = event.clientY
		}

		const draw = () => {
			ctx.clearRect(0, 0, dimensions.width, dimensions.height)

			for (let i = 0; i < wisps.length; i++) {
				const wisp = wisps[i]
				const dx = pointer.x - wisp.x
				const dy = pointer.y - wisp.y
				const distanceSq = dx * dx + dy * dy

				if (distanceSq < POINTER_RADIUS_SQ) {
					const force = (POINTER_RADIUS - Math.sqrt(distanceSq)) / POINTER_RADIUS
					wisp.x -= dx * force * 0.012
					wisp.y -= dy * force * 0.004
				}

				wisp.phase += 0.012
				wisp.x += wisp.speed
				wisp.y -= wisp.drift + Math.sin(wisp.phase) * 0.12

				if (wisp.x > dimensions.width + wisp.length || wisp.y < -wisp.length) {
					wisps[i] = createWisp()
					continue
				}

				ctx.save()
				ctx.translate(wisp.x, wisp.y)
				ctx.rotate(-0.34 + Math.sin(wisp.phase) * 0.12)
				ctx.globalAlpha = wisp.alpha
				ctx.strokeStyle = "#ffe6a0"
				ctx.lineWidth = wisp.width
				ctx.lineCap = "round"
				ctx.beginPath()
				ctx.moveTo(-wisp.length * 0.45, wisp.length * 0.12)
				ctx.quadraticCurveTo(0, -wisp.length * 0.2, wisp.length * 0.55, 0)
				ctx.stroke()

				if (wisp.sparkle) {
					ctx.globalAlpha = wisp.alpha * (0.5 + Math.sin(wisp.phase * 3) * 0.4)
					ctx.fillStyle = "#fff3d0"
					ctx.shadowColor = "#ffd96a"
					ctx.shadowBlur = 10
					ctx.beginPath()
					ctx.arc(wisp.length * 0.55, 0, wisp.width * 1.4, 0, Math.PI * 2)
					ctx.fill()
				}
				ctx.restore()
			}

			raf = requestAnimationFrame(draw)
		}

		resize()
		window.addEventListener("resize", resize, { passive: true })
		window.addEventListener("pointermove", onPointerMove, { passive: true })
		raf = requestAnimationFrame(draw)

		return () => {
			cancelAnimationFrame(raf)
			window.removeEventListener("resize", resize)
			window.removeEventListener("pointermove", onPointerMove)
		}
	}, [])

	return <canvas ref={canvasRef} className={styles["harvest-wind"]} aria-hidden />
}

export default memo(HarvestWind)

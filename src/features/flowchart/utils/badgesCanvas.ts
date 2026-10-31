import { DY, FcOverlayDrawer, path2D, StyleReader } from "@tsukiweb/common/flowchart"
import { PointId } from "app/utils/types"
import { BADGE_PATHS, FLAG_BACKGROUND, FLAG_CONTENT, HOURGLASS, POINT_BACKGROUND, QUIZ_ICON, QUIZ_NUMBER_X, STRIKE_COLOR, flagPersists, pointPersists } from "../components/badges"
import { getNodeBadges } from "./badges"
import { FcNode } from "./flowchart"


type BadgeFill = 'background' | PointId | (string & {})

type BadgeIcon = { text: string } | { icon: string } | { heart: true } | { dots: true }

type BadgeLayout = { x: number, y: number } & (
	| { type: 'regard', char: PointId, value: number }
	| { type: 'point', id: string }
	| { type: 'flag', flag: string }
	| { type: 'quiz', n: number }
	| { type: 'select', link: string }
	| { type: 'condition', angle: number, iconX: number, iconY: number,
		icon: BadgeIcon, fill: BadgeFill, negative: boolean }
)

type Condition = NonNullable<NonNullable<ReturnType<typeof getNodeBadges>>['condition']>

type BBox = [left: number, top: number, right: number, bottom: number]

const REGARD_REGEX = /^%(\w+)_point/
const BADGE_RIGHT_INSET = 3
const FLAG_RIGHT_INSET = 3.5
const FLAG_SPACING = DY * 2.6
const SHADOW_OFFSET = 0.4
const ICON_POINTS = ["kagi", "kaibyo"]
const COND_UNIT = DY * 0.8
const TEXT_SIZE = 4
const DOTS_RADIUS = 0.4
const DOTS_GAP = 1.2
/** zoom range (screen pixels per flowchart unit) over which the hourglass appears */
const HOURGLASS_ZOOM = [2.2, 3.2]


//##############################################################################
//#region                           LAYOUT
//##############################################################################

function conditionLayout(node: FcNode, condition: Condition): BadgeLayout {
	let x, y, angle, iconX, iconY, icon: string | undefined, align, m
	let badgeIcon: BadgeIcon, fill: BadgeFill
	if (typeof condition == 'object') {
		let above, below
		({condition, above, below, icon, align} = condition)
		if (above) {
			const anchorNode = node.flowchart.getNode(above)!
			x = anchorNode.centerX
			y = anchorNode.top - DY
		} else if (below) {
			const anchorNode = node.flowchart.getNode(below)!
			x = anchorNode.centerX
			y = anchorNode.bottom + DY
		} else {
			x = node.centerX
			y = node.top - DY
		}
		if (align) {
			const anchorNode = node.flowchart.getNode(align)!
			y = anchorNode.top - DY
		}
		if (x < node.centerX) {
			angle = -90
			iconX = DY*0.1
			iconY = DY*0.48
			x += DY+0.1
		} else if (x > node.centerX) {
			angle = 90
			iconX = -DY*0.1
			iconY = DY*0.48
			x -= DY+0.1
		} else {
			angle = 0
			iconX = 0
			iconY = DY*0.56
			y += DY+0.1
		}
		if (icon)
			condition = icon
	} else {
		angle = 0
		iconX = 0
		iconY = DY*0.56
		x = node.centerX
		y = node.top + 0.1
	}
	let negative = condition.startsWith('!')
	if (negative)
		condition = condition.substring(1)
	if (condition.includes('||') || condition.includes('&&')) {
		badgeIcon = { dots: true }
		fill = 'background'
		negative = false
	} else if (condition.startsWith('%flg')) {
		let flag = condition.substring(4)
		if (flag.startsWith('_'))
			flag = flag.substring(1)
		badgeIcon = flag.length > 1 ? { icon: flag } : { text: flag }
		fill = FLAG_BACKGROUND
	} else if ((m = condition.match(REGARD_REGEX))) {
		const id = m[1]
		if (ICON_POINTS.includes(id)) {
			badgeIcon = { icon: id }
			fill = POINT_BACKGROUND
		} else {
			badgeIcon = { heart: true }
			fill = id
		}
	} else if (condition.startsWith('%quiz')) {
		badgeIcon = { icon: 'quiz' }
		fill = FLAG_BACKGROUND
	} else {
		badgeIcon = { dots: true }
		fill = 'background'
	}
	return { type: 'condition', x, y, angle, iconX, iconY, icon: badgeIcon, fill, negative }
}

/** Position and content of the badges of a node, in flowchart coordinates */
function getBadgesLayout(node: FcNode, isLinkEnabled: (node: FcNode) => boolean): BadgeLayout[] {
	const badge = getNodeBadges(node.id)
	if (!badge) return []

	const { flags, char, value, select, condition } = badge
	const cornerX = node.right - (node.width > 0 ? BADGE_RIGHT_INSET : 0)
	const cornerY = node.bottom - (node.height > 0 ? DY / 2 : 0)
	const layouts: BadgeLayout[] = []

	if (char) {
		layouts.push(ICON_POINTS.includes(char)
			? { type: 'point', x: cornerX, y: cornerY, id: char }
			: { type: 'regard', x: cornerX, y: cornerY, char, value: value! })
	}
	const flagX = node.right - (node.width > 0 ? FLAG_RIGHT_INSET : 0)
	flags?.forEach((flag, i) => {
		const y = cornerY - (char ? i + 1 : i) * FLAG_SPACING
		layouts.push(flag.startsWith('quiz')
			? { type: 'quiz', x: flagX, y, n: parseInt(flag.at(-1)!) || 0 }
			: { type: 'flag', x: flagX, y, flag })
	})
	if (select)
		layouts.push({ type: 'select', x: node.centerX, y: node.bottom, link: isLinkEnabled(node)
			? `fc-link enabled${node.group ? ` group-${node.group}` : ''}`
			: "fc-link disabled" })
	if (condition)
		layouts.push(conditionLayout(node, condition))
	return layouts
}

//#endregion ###################################################################
//#region                           DRAWING
//##############################################################################

function fillStyle(ctx: CanvasRenderingContext2D, fill: BadgeFill, style: StyleReader, bbox: BBox) {
	if (fill == 'background')
		return style.color("var(--badge-background)")
	if (fill.startsWith('#'))
		return fill
	if (fill.startsWith('var('))
		return style.color(fill)
	const [left, top, right, bottom] = bbox
	const gradient = ctx.createLinearGradient(left, bottom, right, top)
	gradient.addColorStop(0, style.color(`color-mix(in oklch, var(--color-${fill}) 80%, white)`))
	gradient.addColorStop(1, style.color(`color-mix(in oklch, var(--color-${fill}) 80%, black)`))
	return gradient
}

function drawShape(ctx: CanvasRenderingContext2D, d: string, fill: string | CanvasGradient) {
	ctx.fillStyle = fill
	ctx.fill(path2D(d))
	ctx.strokeStyle = "white"
	ctx.lineWidth = 0.6
	ctx.stroke(path2D(d))
}

function drawIcon(ctx: CanvasRenderingContext2D, name: string) {
	const d = BADGE_PATHS.icons[name]
	if (!d)
		return
	ctx.fillStyle = "white"
	ctx.fill(path2D(d))
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number,
		font: string, color = "white", halo?: string) {
	ctx.font = `bold ${TEXT_SIZE}px ${font}`
	if (halo) {
		ctx.strokeStyle = halo
		ctx.lineWidth = 0.7
		ctx.strokeText(text, x, y)
	}
	ctx.fillStyle = color
	ctx.fillText(text, x, y)
}

function drawStrike(ctx: CanvasRenderingContext2D) {
	ctx.strokeStyle = STRIKE_COLOR
	ctx.lineWidth = 1
	ctx.stroke(path2D(BADGE_PATHS.strike))
}

/** Pennant, with its content drawn in the flag part */
function drawFlag(ctx: CanvasRenderingContext2D, fill: string, drawContent: VoidFunction) {
	ctx.fillStyle = "rgb(0 0 0 / 0.5)"
	ctx.translate(SHADOW_OFFSET, SHADOW_OFFSET)
	ctx.fill(path2D(BADGE_PATHS.flag))
	ctx.translate(-SHADOW_OFFSET, -SHADOW_OFFSET)
	ctx.strokeStyle = "white"
	ctx.lineWidth = 0.6
	ctx.stroke(path2D(BADGE_PATHS.flagPole))
	drawShape(ctx, BADGE_PATHS.flag, fill)
	ctx.save()
	ctx.translate(FLAG_CONTENT.x, FLAG_CONTENT.y)
	ctx.scale(FLAG_CONTENT.scale, FLAG_CONTENT.scale)
	drawContent()
	ctx.restore()
}

function drawBadge(ctx: CanvasRenderingContext2D, badge: BadgeLayout, style: StyleReader,
		font: string, hourglassScale: number) {
	ctx.save()
	ctx.translate(badge.x, badge.y)
	switch (badge.type) {
		case 'regard': {
			const n = Math.abs(badge.value)
			const bbox: BBox = [-2.5 - 5 * (n - 1), -3.3, 2.5, 2.5]
			drawShape(ctx, BADGE_PATHS.regard(badge.value), fillStyle(ctx, badge.char, style, bbox))
			ctx.strokeStyle = badge.value > 0 ? "#00ff00" : "#ff0000"
			ctx.stroke(path2D(badge.value > 0 ? BADGE_PATHS.pointPlus : BADGE_PATHS.pointMinus))
			break
		}
		case 'point':
			ctx.fillStyle = POINT_BACKGROUND
			ctx.beginPath()
			ctx.arc(0, 0, 3, 0, 2 * Math.PI)
			ctx.fill()
			ctx.strokeStyle = "white"
			ctx.lineWidth = 0.6
			ctx.stroke(path2D(BADGE_PATHS.pointArc))
			drawIcon(ctx, badge.id)
			ctx.translate(0.3, 0.4)
			ctx.strokeStyle = "#00ff00"
			ctx.stroke(path2D(BADGE_PATHS.pointPlus))
			break
		case 'flag': {
			const { flag } = badge
			drawFlag(ctx, style.color(FLAG_BACKGROUND), () => flag.length > 1
				? drawIcon(ctx, flag)
				: drawText(ctx, flag, 0, 1.6, font))
			break
		}
		case 'quiz': {
			const { n } = badge
			drawFlag(ctx, style.color(FLAG_BACKGROUND), () => {
				if (n > 0) {
					ctx.save()
					ctx.translate(QUIZ_ICON.x, 0)
					ctx.scale(QUIZ_ICON.scale, QUIZ_ICON.scale)
					drawIcon(ctx, 'quiz')
					ctx.restore()
					drawText(ctx, String(n), QUIZ_NUMBER_X, 1.6, font)
				} else {
					drawIcon(ctx, 'quiz')
				}
			})
			break
		}
		case 'select':
			ctx.fillStyle = style.stroke(badge.link).color
			ctx.fill(path2D(BADGE_PATHS.select))
			drawText(ctx, "?", 0, 1.45, font, style.color("var(--badge-background)"))
			break
		case 'condition': {
			const c = COND_UNIT
			ctx.save()
			ctx.rotate(badge.angle * Math.PI / 180)
			drawShape(ctx, BADGE_PATHS.cond, fillStyle(ctx, badge.fill, style, [-c, -c, c, c * 1.5]))
			ctx.restore()
			const { icon } = badge
			if (badge.negative)
				drawStrike(ctx)
			if ('dots' in icon) {
				ctx.fillStyle = "white"
				ctx.beginPath()
				for (const x of [-DOTS_GAP, 0, DOTS_GAP]) {
					ctx.moveTo(x + DOTS_RADIUS, 0)
					ctx.arc(x, 0, DOTS_RADIUS, 0, 2 * Math.PI)
				}
				ctx.fill()
			} else if ('text' in icon) {
				drawText(ctx, icon.text, badge.iconX, badge.iconY, font, "white",
					badge.negative ? style.color(FLAG_BACKGROUND) : undefined)
			} else if ('icon' in icon) {
				drawIcon(ctx, icon.icon)
			} else {
				ctx.save()
				ctx.translate(0, 0.3)
				ctx.scale(0.6, 0.6)
				ctx.fillStyle = "white"
				ctx.fill(path2D(BADGE_PATHS.heart))
				ctx.restore()
			}
			break
		}
	}
	ctx.restore()
	if (hourglassScale > 0 && ((badge.type == 'regard' && !pointPersists(badge.char))
			|| (badge.type == 'flag' && !flagPersists(badge.flag))))
		drawHourglass(ctx, badge.x + HOURGLASS.x, badge.y + HOURGLASS.y, hourglassScale)
}

/** 0 while the badges are too small for the hourglass to be readable, 1 once zoomed in */
function hourglassVisibility(ctx: CanvasRenderingContext2D) {
	const { a, b } = ctx.getTransform()
	const pixelsPerUnit = Math.hypot(a, b) / devicePixelRatio
	const t = Math.min(1, Math.max(0, (pixelsPerUnit - HOURGLASS_ZOOM[0])
		/ (HOURGLASS_ZOOM[1] - HOURGLASS_ZOOM[0])))
	return t * t * (3 - 2 * t)
}

function drawHourglass(ctx: CanvasRenderingContext2D, x: number, y: number, visibility: number) {
	ctx.save()
	ctx.globalAlpha *= visibility
	ctx.translate(x, y)
	ctx.scale(0.5 + 0.5 * visibility, 0.5 + 0.5 * visibility)
	ctx.beginPath()
	ctx.arc(0, 0, HOURGLASS.radius, 0, 2 * Math.PI)
	ctx.fillStyle = HOURGLASS.background
	ctx.fill()
	ctx.strokeStyle = "white"
	ctx.lineWidth = 0.3
	ctx.stroke()
	ctx.fillStyle = HOURGLASS.sand
	ctx.fill(path2D(HOURGLASS.sandPath))
	ctx.strokeStyle = HOURGLASS.glass
	ctx.lineWidth = 0.2
	ctx.lineJoin = 'round'
	ctx.stroke(path2D(HOURGLASS.glassPath))
	ctx.lineWidth = 0.28
	ctx.stroke(path2D(HOURGLASS.frame))
	ctx.restore()
}

/** @param isLinkEnabled whether the links below `node` are drawn as enabled */
export function createBadgesDrawer(nodes: FcNode[],
		isLinkEnabled: (node: FcNode) => boolean): FcOverlayDrawer {
	const badges = nodes.flatMap(node => getBadgesLayout(node, isLinkEnabled))
	return (ctx, view, style) => {
		const font = style.property('--ui-font') || 'sans-serif'
		const hourglass = hourglassVisibility(ctx)
		ctx.lineCap = 'round'
		ctx.textAlign = 'center'
		for (const badge of badges) {
			if (badge.x > view.left && badge.x < view.right
					&& badge.y > view.top && badge.y < view.bottom)
				drawBadge(ctx, badge, style, font, hourglass)
		}
	}
}

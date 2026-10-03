import { FcNode } from "features/flowchart/utils/flowchart";
import { FLAG_BACKGROUND, createFlagBadge, createPointBadge, createQuizBadge } from "./badges";
import { DY } from "@tsukiweb/common/flowchart";
import { PointId } from "app/utils/types";
import { getNodeBadges } from "features/flowchart/utils/badges";

const REGARD_REGEX = /^%(\w+)_point/
const BADGE_RIGHT_INSET = 3

const SelectBadge = ({node}: {node: FcNode})=> {
	return (
		<use
			className="badge"
			href="#sel-icon"
			transform={`translate(${node.centerX}, ${node.bottom})`}
		/>
	)
}

const RegardBadge = ({node, char, value}: {node: FcNode, char: PointId, value: number})=> {
	const dX = node.width > 0 ? BADGE_RIGHT_INSET : 0
	const dY = node.height > 0 ? DY / 2 : 0
	const transform = `translate(${node.right - dX}, ${node.bottom - dY})`
	if (["kagi", "kaibyo"].includes(char)) {
		return (
			createPointBadge(char, true, {transform})
		)
	}
	return (
		<use
			className="badge"
			href={`#regard_${value}`}
			fill={`url(#${char}_grad)`}
			transform={transform}
		/>
	)
}

const FlagBadge = ({node, flag, offset = 0}: {node: FcNode, flag: string, offset?: number})=> {
	let dX = node.width > 0 ? BADGE_RIGHT_INSET : 0
	let dY = node.height > 0 ? DY / 2 : 0
	dX = node.right - dX
	dY = node.bottom - dY - offset * DY * 2.2
	const props = {transform:`translate(${dX}, ${dY})`}
	if (flag.startsWith('quiz')) {
		const n = parseInt(flag.at(-1)!) || 0
		return createQuizBadge(n, props)
	} else {
		return createFlagBadge(flag, false, props)
	}
}

type Condition = Exclude<Exclude<ReturnType<typeof getNodeBadges>, undefined>['condition'], undefined>
const ConditionBadge = ({node, condition}: {node: FcNode, condition: Condition})=> {
	let x, y, angle, iconX, iconY, icon, fill, negative, m, align
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
			iconY = DY*0.6
			x += DY+0.1
		} else if (x > node.centerX) {
			angle = 90
			iconX = -DY*0.1
			iconY = DY*0.6
			x -= DY+0.1
		} else {
			angle = 0
			iconX = 0
			iconY = DY*0.7
			y += DY+0.1
		}
		if (icon)
			condition = icon
	} else {
		angle = 0
		iconX = 0
		iconY = DY*0.7
		x = node.centerX
		y = node.top + 0.1
	}
	if (condition.startsWith('!')) {
		negative = true
		condition = condition.substring(1)
	} else {
		negative = false
	}
	if (condition.includes('||') || condition.includes('&&')) {
		icon = "⋯"
		fill = "var(--badge-background)"
		negative = false
	} else if (condition.startsWith('%flg')) {
		icon = condition.substring(4)
		if (icon.startsWith('_'))
			icon = icon.substring(1)
		if (icon.length > 1)
			icon = <use href={`#${icon}-icon`}/>
		fill = FLAG_BACKGROUND
		negative !== condition.endsWith('==0')
	} else if ((m = condition.match(REGARD_REGEX))) {
		let id = m[1]
		if (["kagi", "kaibyo"].includes(id)) {
			icon = <use href={`#${id}-icon`}/>
			fill = "#000"
		}
		else { 
			icon = <use href={`#regard_icon`} fill="white" stroke="none" transform="translate(0,0.3) scale(.6)"/>
			fill = `url(#${id}_grad)`
		}
		negative !== condition.endsWith('==0')
	} else if (condition.startsWith('%quiz')) {
		icon = <use href="#quiz-icon"/>
		fill = negative ? "#800" : "#070"
		negative = false
	} else {
		icon = "⋯"
		fill = "var(--badge-background)"
	}
	return <g className="badge" transform={`translate(${x},${y})`}>
		<use href="#cond-icon" fill={fill} {...(angle && {transform:`rotate(${angle})`})}/>
		{typeof icon == 'string' ?
			<text x={iconX} y={iconY} textAnchor="middle"
					stroke="none" fill="white">
				{icon}
			</text>
		: icon
		}
		{negative && <use href="#cond-neg"/>}
	</g>
}


type SceneBadgesProps = {
	node: FcNode
}
export const SceneBadges = ({node}: SceneBadgesProps)=> {
	const badge = getNodeBadges(node.id)
	if (!badge) return null

	let { flags, char, value, select, condition } = badge
	
	return (
		<>
			{char && <RegardBadge node={node} char={char} value={value!} />}

			{flags?.map((f, i)=><FlagBadge key={i} node={node} flag={f} offset={char ? i+1 : i} />)}

			{select && <SelectBadge node={node} />}

			{condition && <ConditionBadge node={node} condition={condition} />}
		</>
	)
}
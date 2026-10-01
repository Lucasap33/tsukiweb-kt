import { GraphicsGroup } from "@tsukiweb/common/graphics"
import { noBb, Bbcode } from "@tsukiweb/common/utils/Bbcode"
import { PointId, SceneName } from "app/utils/types"
import { FcNode } from "features/flowchart/utils/flowchart"
import { tokenizeCondition } from "@tsukiweb/common/script/utils"
import { settings } from "engine/settings"
import { BadgeEntry, getNodeBadges } from "features/flowchart/utils/badges";
import { getSceneGraph } from "engine/utils";
import { createFlagBadge, createPointBadge, createQuizBadge, flagPersists, pointPersists } from "./badges";

const ICON_SIZE = 7
const CHAR_IMG_SIZE = 7


const RegardBadge = ({char}: {char: PointId}) => {
	return ["kagi", "kaibyo"].includes(char) ? (
		<svg className="badge" viewBox={`-${ICON_SIZE/2} -${ICON_SIZE/2} ${ICON_SIZE} ${ICON_SIZE}`}>
			{createPointBadge(char, false)}
		</svg>
	) : (
		<svg className="badge" viewBox={`-${CHAR_IMG_SIZE+ICON_SIZE*0.75} -${CHAR_IMG_SIZE/2} ${CHAR_IMG_SIZE+ICON_SIZE*0.75} ${CHAR_IMG_SIZE}`}>
			<image href={`./res/chars/${char}.webp`}
				className="badge"
				x={-(CHAR_IMG_SIZE+ICON_SIZE*0.75)} y={-CHAR_IMG_SIZE/2} height={CHAR_IMG_SIZE} />
			<use href="#regard_icon"
				fill={`url(#${char}_grad)`}
				strokeWidth=".8"
				transform={`translate(-${ICON_SIZE*0.75*0.5},0.5) scale(.75)`}/>
		</svg>
	)
}

const FlagBadge = ({flag, negative, persists = false}: {flag: string, negative?: boolean, persists?: boolean}) => {
	let content
	if (flag.startsWith("quiz")) {
		const n = parseInt(flag.at(-1)!) || 0
		content = createQuizBadge(n)
	} else {
		content = createFlagBadge(flag, negative)
	}
	return (
		<svg className="badge" viewBox="-3.5 -3.5 7 7">
			{content}
			{persists && <use href="#link-icon" transform="translate(2.6,-2.2)"/>}
		</svg>
	)
}

const RegardValueBadge = ({ char, value, persists=false }: { char: PointId; value: number, persists?: boolean }) => {
	const abs = Math.abs(value)
	const sign = Math.sign(value)
	return (["kagi", "kaibyo"].includes(char)) ? (
		<svg className="badge" viewBox="-3.5 -3.5 7 7">
			{createPointBadge(char, true)}
			{persists && <use href="#link-icon" transform="translate(2.6,-2.2)"/>}
		</svg>
	) : (
		<svg className="badge" viewBox={`-${(abs * ICON_SIZE*0.75 + CHAR_IMG_SIZE)} -${CHAR_IMG_SIZE/2} ${abs * ICON_SIZE*0.75 + CHAR_IMG_SIZE+1} ${CHAR_IMG_SIZE}`}>
			<image
				href={`./res/chars/${char}.webp`}
				className="badge"
				x={-(abs * ICON_SIZE*0.75 + CHAR_IMG_SIZE)}
				y={-CHAR_IMG_SIZE/2}
				height={CHAR_IMG_SIZE}
			/>
			{[...Array(abs)].map((_, i) => (
				<use
					key={i}
					href={`#regard_${sign}`}
					fill={`url(#${char}_grad)`}
					transform={`translate(${-(abs - i) * ICON_SIZE*0.75 + ICON_SIZE*0.75*0.5},0) scale(0.75)`}
				/>
			))}
			{persists && <use href="#link-icon" transform="translate(0,-2.2)"/>}
		</svg>
	)
}

const TokenDisplay = ({ token }: { token: string }) => {
	switch (token) {
		case '&&' : return <span className="separator">&amp;</span>
		case '||' : return <span>/</span>
		case '>=' : return <span>&ge;</span>
		case '<=' : return <span>&le;</span>
		case '==' : return <span>=</span>
		case '!=' : return <span>&ne;</span>
		default : return <span>{token}</span>
	}
}

const SceneCondition = ({condition}: {condition: string})=> {
	return tokenizeCondition(condition).map((token, i, tokens)=> {
		if (token.length == 0) return null
		if (token == '!') return null
		if (!token.startsWith('%'))
			return <TokenDisplay key={i} token={token} /> // operator or number
		if (token.endsWith('_point')) {
			const char = token.split('_')[0].substring(1) // between '%' and '_'
			return <RegardBadge key={i} char={char as PointId} />
		}
		else if (token.startsWith('%flg')) {
			let flag = token.substring(4)
			if (flag.startsWith('_'))
				flag = flag.substring(1)
			const negative = (i > 0 && (tokens[i-1] == '!'))
			return <FlagBadge key={i} flag={flag} negative={negative} />
		}
		else if (token.startsWith('%quiz')) {
			const negative = (i > 0 && (tokens[i-1] == '!'))
			return <FlagBadge key={i} flag={token.substring(1)} negative={negative}/>
		}
	})
}

const SceneIllustration = ({node}: {node: FcNode})=> {
	const graph = node.scene ? getSceneGraph(node.id as SceneName) : null
	return <>
		<div className="background">
			{graph && <GraphicsGroup images={graph} />}
		</div>
		<div className="desc">
			<div className="title">
			{node.displayName.split('[br/]').map((line, i) =>
				<div key={i}>{noBb(line)}</div>)
			}
			</div>
			<div className="id">
				{node.id.replace("openning", "opening")}
			</div>
		</div>
	</>
}

const SceneBadges = ({badges}: {badges: BadgeEntry})=> {
	if (!badges) return null

	let {condition, flags, char, value} = badges
	if (typeof condition == "object")
		condition = condition.condition

	return <>
		{condition &&
			<div className="condition">
				<SceneCondition condition={condition}/>
			</div>
		}

		{(flags || (char && value != null)) &&
			<div className="badges">
				{flags?.map(f=><FlagBadge key={f} flag={f} persists={flagPersists(f)} />)}
				{char && value != null && <RegardValueBadge char={char} value={value} persists={pointPersists(char)} />}
			</div>
		}
	</>
}

const SceneChoices = ({select}: {select: BadgeEntry['select'] })=> {
	if (!select) return null

	return (
		<div className="choices-container">
			{select.map(({text, condition}, i) =>
				<div key={i} className="choice">
					{settings.flowchartBadges && condition &&
						<div className="condition">
							<SceneCondition condition={condition}/>
						</div>
					}
					<Bbcode text={text} />
				</div>
			)}
		</div>
	)
}

type PopoverProps = {
	node: FcNode
}
const ScenePopover = ({ node }: PopoverProps) => {
	const badges = getNodeBadges(node.id)

	return (
		<div className="scene-popover-content">
			<div className="scoop">
				<SceneIllustration node={node} />
			</div>
			{badges && <SceneChoices select={badges.select} />}
			{settings.flowchartBadges && badges &&
				<SceneBadges badges={badges} />
			}
		</div>
	)
}

export default ScenePopover

import { GraphicsGroup } from "@tsukiweb/common/graphics"
import { noBb, Bbcode } from "@tsukiweb/common/utils/Bbcode"
import { PointId, SceneName } from "app/utils/types"
import { FcNode } from "features/flowchart/utils/flowchart"
import { tokenizeCondition } from "@tsukiweb/common/script/utils"
import { settings } from "engine/settings"
import { BadgeEntry, getNodeBadges } from "features/flowchart/utils/badges";
import { getSceneGraph } from "engine/utils";
import { flagPersists, HourglassIcon, pointPersists } from "./badges";
import { KtFlagBadge, KtPointBadge } from "assets/icons/badges";
import { ReactNode } from "react";

const Transient = ({children, transient}: {children: ReactNode, transient: boolean})=>
	transient ?
		<span className="transient-badge">
			{children}
			<HourglassIcon className="hourglass"/>
		</span>
	: children


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
			return <KtPointBadge key={i} name={char as PointId}/>
		}
		else if (token.startsWith('%flg')) {
			let flag = token.substring(4)
			if (flag.startsWith('_'))
				flag = flag.substring(1)
			const negative = (i > 0 && (tokens[i-1] == '!'))
			return <KtFlagBadge key={i} flag={flag} negative={negative} />
		}
		else if (token.startsWith('%quiz')) {
			const negative = (i > 0 && (tokens[i-1] == '!'))
			return <KtFlagBadge key={i} flag={token.substring(1)} negative={negative}/>
		}
	})
}

const SceneIllustration = ({node}: {node: FcNode})=> {
	const graph = node.scene ? getSceneGraph(node.id as SceneName) : null
	return <>
		<div className="background">
			{graph && <GraphicsGroup key={node.id} images={graph} />}
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
				{flags?.map(f=>
					<Transient key={f} transient={!flagPersists(f)}>
						<KtFlagBadge flag={f}/>
					</Transient>
				)}
				{char && value != null &&
					<Transient transient={!pointPersists(char)}>
						<KtPointBadge name={char} value={value}/>
					</Transient>
				}
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

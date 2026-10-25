import { ScriptPlayer } from "engine/ScriptPlayer"
import { strings } from "translation/lang"
import { PointId } from "app/utils/types";
import { badgeViewBox, FLAG_CONTENT } from "features/flowchart/components/badges";


const RegardRow = ({ char, value, max }: {char: PointId, value: number, max: number}) => {
	const iconParams = {
		className:"heart-icon",
		fill: `url(#${char}_grad)`
	}
	const n = (max == 0) ? value : Math.min(value, max)
	return (
		<div className="row">
			<img className="char" src={`./res/chars/${char}.webp`}
				alt={strings.characters[char as keyof typeof strings.characters] ?? char} />
			<svg className="hearts-list" viewBox="-3.3 -3.3 13.5 6.3">
				<use href="#regard_icon" {...iconParams} className="badge"/>
				<text x="3" y="2" fontSize={4} fill="#fff">
					&times;{n}
				</text>
			</svg>
		</div>
	)
}

const FlagsList = ({ flags }: { flags: string[] }) => {
	return (
		<div className="flags-list">
			{flags.map(flag =>
				<svg key={flag} className="badge" viewBox={badgeViewBox()}>
					<use href="#flag-icon"/>
					<g transform={`translate(${FLAG_CONTENT.x},${FLAG_CONTENT.y}) scale(${FLAG_CONTENT.scale})`}>
						<text y="1.6" stroke="none" fill="white" textAnchor="middle">
							{flag}
						</text>
					</g>
				</svg>
			)}
		</div>
	)
}

type Props = {
	script: ScriptPlayer,
	flags?: never
	points?: never
} | {
	script?: never,
	flags: Set<string>|Array<string>,
	points: Partial<Record<PointId, number>>
}
export const ProgressPanel = ({script, flags, points}: Props) => {

	if (script) {
		flags = script.flags
		points = Object.fromEntries(script.points.entries())
	}

	return (
		<div className="progress-panel">
			<FlagsList flags={Array.from(flags!)}/>
		</div>
	)
}
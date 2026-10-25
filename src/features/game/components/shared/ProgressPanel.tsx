import { ScriptPlayer } from "engine/ScriptPlayer"
import { PointId } from "app/utils/types"
import { BADGES_DEFINES } from "features/flowchart/components/badges"
import { FlagBadge, RegardBadge} from "@tsukiweb/common/icons/badges"

const PointsRow = ({ char, value }: {char: PointId, value: number}) => {
	return (
		<div className="row">
			<RegardBadge char={char} img={`./res/chars/${char}.webp`}/>
			&times;{value}
		</div>
	)
}

const FlagsList = ({ flags }: { flags: string[] }) => {
	return (
		<div className="flags-list">
			{flags.map(flag => <FlagBadge flag={flag}/>)}
		</div>
	)
}

type Props = {
	script: ScriptPlayer
	flags?: never
	points?: never
} | {
	script?: never
	flags: Set<string>|Array<string>
	points: Partial<Record<PointId, number>>
}
export const ProgressPanel = ({script, flags, points}: Props) => {

	if (script) {
		flags = script.flags
		points = Object.fromEntries(script.points.entries())
	}

	return (
		<div className="progress-panel">
			<svg width="20" height="20" className="defs">{BADGES_DEFINES}</svg>

			{Object.entries(points ?? {}).map(([id, n])=>
				<PointsRow key={id} char={id as PointId} value={n}/>
			)}
			<FlagsList flags={Array.from(flags!)}/>
		</div>
	)
}
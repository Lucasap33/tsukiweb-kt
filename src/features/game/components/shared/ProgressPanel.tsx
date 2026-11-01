import { ScriptPlayer } from "engine/ScriptPlayer"
import { PointId } from "app/utils/types"
import { KtFlagBadge, KtPointBadge } from "assets/icons/badges"

const PointsRow = ({ char, value }: {char: PointId, value: number}) => {
	return (
		<div className="row">
			<KtPointBadge name={char}/>
			&times;{value}
		</div>
	)
}

const FlagsList = ({ flags }: { flags: string[] }) => {
	return (
		<div className="flags-list">
			{flags.map(flag => <KtFlagBadge key={flag} flag={flag}/>)}
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

			{Object.entries(points ?? {}).map(([id, n])=>
				id == 'answer' ? undefined :
				<PointsRow key={id} char={id as PointId} value={n}/>
			)}
			<FlagsList flags={Array.from(flags!)}/>
		</div>
	)
}
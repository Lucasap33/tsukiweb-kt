import "../styles/progress.scss"
import { useState } from "react"
import { useStrings } from "translation/lang"
import { settings } from "engine/settings"
import { Button, Modal } from "@tsukiweb/common/ui-core"
import { audio } from "engine/audio"
import { GameProgress, PointId } from "app/utils/types";
import { MdAddCircleOutline, MdRepeat } from "react-icons/md";
import { KtFlagBadge, KtPointBadge } from "assets/icons/badges";

type Props = {
	show: boolean
    onSelect: (progress: GameProgress|undefined)=>void
	progress?: GameProgress
}

const DiffPointBadge = ({name, v1 = 0, v2 = v1}: {name: PointId, v1?: number, v2?: number})=> {
	if (v2 != v1) {
		const pos = v2 > v1
		return (
			<span id={name}>
				<KtPointBadge name={name} value={pos ? 1 : -1}/>
				&times;{v1}
				<span style={{color: pos ? "green" : "red"}}>&rarr;{v2}</span>
			</span>
		)
	}
	else if (v1) {
		return (
			<span id={name}>
				<KtPointBadge name={name}/>
				&times;{v1}
			</span>
		)
	} else {
		return <KtPointBadge id={name} style={{opacity: 0.2}}/>
	}
}

const DiffFlagBadge = ({flag, v1 = false, v2 = v1}: {flag: string, v1?: boolean, v2?: boolean})=> {
	let negative, style
	if (v2 && v1) {
		negative = false
		style = undefined
	}
	else if (!v2 && !v1) {
		negative = false
		style = { opacity: 0.2 }
	}
	else if (v1) {
		negative = true
		style = undefined
	}
	else {
		negative = false
		style = { filter: `drop-shadow(0 0 2px lime)` }
	}
	return (
		<KtFlagBadge flag={flag} negative={negative} style={style}/>
	)
}

const ProgressDisplay = ({progress, change}: {progress: GameProgress, change?: GameProgress})=> {
	const {lastSave, count, points, flags} = progress
    return <div className="progress">
        <div className="progress-info">
			<span className="progress-date">
				{new Date(lastSave).toLocaleDateString()}
			</span>
			&nbsp;
			<span className="progress-count">
				<MdRepeat/>
				{count}
				{change && change.count != count &&
				<span style={{color: change.count > count ? "green" : "red"}}>
					&rarr;{change.count}
				</span>
				}
			</span>
		</div>
		<div className="progress-regards">
			{(["ren", "kagi", "nana", "kaibyo"] as const).map(x=> 
				<DiffPointBadge key={x} name={x}
					v1={points[x]} v2={change?.points[x]}/>
			)}
		</div>
		<div className="progress-flags">
			{Array.from("12345678ABCDEFGHIJKLMNOPQ", f=>
				<DiffFlagBadge key={f} flag={f}
					v1={flags.includes(f)} v2={change?.flags.includes(f)}/>
			)}
		</div>
    </div>
}
const ModalProgressSelection = ({show, onSelect, progress}: Props) => {
	const strings = useStrings()
    const [selected, setSelected] = useState<GameProgress|undefined>(undefined)

    const progresses = settings.progresses
    const empty: GameProgress = { flags: [], points: {}, count: 0, lastSave: 0 }
	const newProgress = progress

	//TODO display diff on loop count, points and flags (using negative flags)
	// when selecting a progress in the list if a progress is provided

	return (
		<Modal
			show={show}
			onRequestClose={() => { onSelect(undefined) }}
			className="translation-switch-modale"
		>
			<div className="content">
				<div className="progresses">
					{progresses.map((progress, i) => {
						
						return (
							<Button
								key={i}
								variant="select"
								onClick={setSelected.bind(undefined, progress)}
								onDoubleClick={onSelect.bind(undefined, progress)}
								className="progress"
								active={selected == progress}
								audio={audio}
								clickSound="glass"
								nav-auto={1}
							>
								<ProgressDisplay progress={progress} change={selected == progress ? newProgress : undefined}/>
							</Button>
						)
					})}
                    
					<Button
                        variant="select"
						onClick={setSelected.bind(undefined, empty)}
						onDoubleClick={onSelect.bind(undefined, empty)}
						className="progress create"
						active={selected == empty}
                        audio={audio}
                        clickSound="glass"
						nav-auto={1}
					>
						<MdAddCircleOutline aria-hidden /> {strings.saves.create}
					</Button>
				</div>
			</div>

            <Button onClick={onSelect.bind(undefined, selected)}
                nav-auto={1}
                audio={audio}
                active={selected != undefined}
            >
                {strings.ok}
            </Button>
            <Button onClick={onSelect.bind(undefined, undefined)}
                nav-auto={1}
                audio={audio}
            >
                {strings.no}
            </Button>
		</Modal>
	)
}

export default ModalProgressSelection
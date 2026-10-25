import { Dispatch, useState } from "react"
import { useStrings } from "translation/lang"
import { settings } from "engine/settings"
import { Button, Modal } from "@tsukiweb/common/ui-core"
import { audio } from "engine/audio"
import { GameProgress } from "app/utils/types";
import { MdAddCircleOutline, MdRepeat } from "react-icons/md";
import { ProgressPanel } from "features/game/components/shared/ProgressPanel";

type Props = {
	show: boolean
    onSelect: (progress: GameProgress|undefined)=>void
}

const ProgressDisplay = ({progress}: {progress: GameProgress})=> {
    return <div className="progress">
        <div className="progress-count">
            <MdRepeat/>
            {progress.count}
        </div>
        <div className="progress-date">
            {new Date(progress.lastSave).toLocaleDateString()}
        </div>
        <ProgressPanel flags={progress.flags} points={progress.points}/>

    </div>
}
const ModalProgressSelection = ({show, onSelect}: Props) => {
	const strings = useStrings()
    const [selected, setSelected] = useState<GameProgress|undefined>(undefined)

    const progresses = settings.progresses
    const empty: GameProgress = { flags: [], points: {}, count: 0, lastSave: 0 }

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
								className="progress"
								active={selected == progress}
								audio={audio}
								clickSound="glass"
								nav-auto={1}
							>
								<ProgressDisplay progress={progress}/>
							</Button>
						)
					})}
                    
					<Button
                        variant="select"
						onClick={setSelected.bind(undefined, empty)}
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
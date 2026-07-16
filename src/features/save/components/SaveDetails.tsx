import { SaveState, savesManager } from "../../../engine/savestates"
import { MdDeleteOutline, MdOutlineFileDownload } from "react-icons/md"
import { GraphicsGroup } from "@tsukiweb-common/graphics"
import { strings } from "translation/lang"
import classNames from "classnames"
import { jsonMerge } from "@tsukiweb-common/utils/utils"
import { Button } from "@tsukiweb-common/ui-core"
import { ProgressPanel } from "features/game/components/shared/ProgressPanel";
import { getSceneTitle, isScene } from "engine/utils";
import { SceneName } from "app/utils/types";

type SaveDetailsProps = {
	id?: number
	saveState?: SaveState
	deleteSave: (id: number)=>void
}
const SaveDetails = ({id, saveState, deleteSave}: SaveDetailsProps)=> {
	const lastPage = saveState?.pages.at(-1)
	const progress = saveState?.scenes.reduce((s1, s2)=>jsonMerge(s2, s1))
	const graphics = jsonMerge(saveState?.graphics ?? {},
			lastPage?.graphics ?? {bg: "#000"})
	const points = progress?.points ?? {}
	const flags = progress?.flags ?? []
	const lastScene = saveState?.pages.findLast(p=>p.label && isScene(p.label))?.label as SceneName|undefined

	return (
		<section className={classNames("info", { "preview-save": saveState !== undefined })}>		
			{id != undefined && saveState != undefined && <>
				<div className="graphics-wrapper">
					{(graphics) &&
						<GraphicsGroup images={graphics} />
					}

					<div className="deta">
						<div>{lastScene && getSceneTitle(lastScene)}</div>
					</div>
				</div>
				<div className="save-details-content">
					<ProgressPanel regard={points} flags={flags}/>

					<div className="actions">
						<Button onClick={deleteSave.bind(null, id)}
							nav-auto={1}
							aria-label={strings.saves.delete}
						>
							<MdDeleteOutline aria-hidden />
						</Button>
						<Button onClick={() => savesManager.exportSave(id)}
							nav-auto={1}
							aria-label={strings.saves.export}
						>
							<MdOutlineFileDownload aria-hidden />
						</Button>
					</div>
				</div>
			</>}
		</section>
	)
}

export default SaveDetails

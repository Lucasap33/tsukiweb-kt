import { GraphicsGroup } from "@tsukiweb-common/graphics"
import { bb } from "@tsukiweb-common/utils/Bbcode"
import { OsieteEnding } from "../utils/endings";
import { getSceneGraph, getSceneTitle } from "engine/utils";

type PopoverProps = {
	ending: OsieteEnding
}
const EndingPopover = ({ ending }: PopoverProps) => {
	const graph = ending.scene ? getSceneGraph(ending.scene) : null
	
	return (
		<div className="scene-popover-content ending">
			<div className="scoop">
				<div className="background">
					{graph && <GraphicsGroup images={graph} />}
				</div>
			</div>

			<div className="desc">
				{ending?.name &&
					<div className="title">
						{getSceneTitle(ending.scene)}
					</div>
				}
				<div className="id">
					{ending.scene}
				</div>
			</div>
		</div>
	)
}

export default EndingPopover
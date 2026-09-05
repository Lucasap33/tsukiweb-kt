import { GraphicsGroup } from "@tsukiweb/common/graphics"
import { noBb } from "@tsukiweb/common/utils/Bbcode"
import { SceneName } from "app/utils/types"
import { getSceneGraph } from "engine/utils"
import { FcNode } from "features/flowchart/utils/flowchart"

const ScenePopover = ({ node }: {node: FcNode}) => {
	const graph = node.scene ? getSceneGraph(node.id as SceneName) : null

	return (
		<div className="scene-popover-content">
			<div className="scoop">
				<div className="background">
					{graph && <GraphicsGroup images={graph} />}
				</div>
				<div className="desc">
					<div className="title">
						{node.displayName.split('[br/]').map((line, i) =>
							<div key={i}>{noBb(line)}</div>
						)}
					</div>
					<div className="id">{node.id}</div>
				</div>
			</div>
		</div>
	)
}

export default ScenePopover

import { SceneName } from "../app/utils/types";
import { SCENE_ATTRS } from "../app/utils/constants";
import { strings } from "../translation/lang"
import { ThumbnailsGraphics } from "@tsukiweb/common/graphics/types";


//#endregion ###################################################################
//#region                          LABEL INFO
//##############################################################################

export function isScene(label: string): label is SceneName {
	if (/^\*?s\d+$/.test(label))
		return true
	if (/^\*?quiz\d(_\d+)?$/.test(label))
		return true
	return false
}

export function getSceneTitle(label: SceneName): string | undefined {
	return strings.scenario.scenes[label] ?? SCENE_ATTRS["scene-names"][label]
}

export function getSceneGraph(scene: SceneName): ThumbnailsGraphics {
  return SCENE_ATTRS["scene-graphs"][scene] ?? { bg: "#000000" }
}

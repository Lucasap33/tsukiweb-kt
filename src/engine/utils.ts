import { LabelName, SceneName } from "../app/utils/types";
import { APP_VERSION, SCENE_ATTRS } from "../app/utils/constants";
import { strings, waitLanguageLoad } from "../translation/lang"
import { credits, scenesDir } from "translation/assets";
import { ASSETS_PATH } from "@tsukiweb/common/constants";
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

export function nextLabel(label: LabelName): LabelName {
	if (/^s\d+a?$/.test(label))
		return `f${label.substring(1)}` as LabelName
	if (/^quizz\d_10$/.test(label))
		return `f135`
	return 'endofplay'
}

export function getSceneGraph(scene: SceneName): ThumbnailsGraphics {
  return SCENE_ATTRS["scene-graphs"][scene] ?? { bg: "#000000" }
}

//#endregion ###################################################################
//#region                         FETCH BLOCKS
//##############################################################################

const LOGIC_FILE = 'logic.txt'

async function fetchScene(sceneId: string): Promise<string[]> {
	await waitLanguageLoad()
	if (/^s\d+a?$/.test(sceneId))
		sceneId = `s${sceneId.substring(1).padStart(3, '0')}`;
	else if (sceneId == "ending") {
		return creditsScript(true)
	}

	const path = `${scenesDir()}/${sceneId}.txt?v=${APP_VERSION}`
	const script = await fetch(path).then(
		(response) => response.ok ? response.text() : undefined,
		(_failErr) => undefined)
	
	if (script == undefined)
		throw Error(`Cannot load file ${path}`)
	
	return script?.trim().split(/\r?\n/);
}

let cachedLogicScript: string | null = null

async function fetchLogicBlock(label: string) : Promise<string[]> {
	await waitLanguageLoad()

	if (!cachedLogicScript) {
		const path = `${ASSETS_PATH}${LOGIC_FILE}?v=${APP_VERSION}`
		cachedLogicScript = await fetch(path)
			.then(response => response.text())
	}
	
	if (!cachedLogicScript) {
		throw Error(`Failed to load logic file`)
	}
	
	const logicScript = cachedLogicScript
	
	let start = logicScript.search(new RegExp(`^\\*${label}\\b`, "m"))
	if (start == -1)
		return []
	start = logicScript.indexOf('\n', start+1)+1 // move to next line
	let end = logicScript.indexOf('\n*', start) // position of next label
	let nextLabel, lines
	if (end >= 0) {
		nextLabel = logicScript.substring(end+1, logicScript.indexOf('\n', end+1))
	} else {
		nextLabel = '*endofplay'
		end = logicScript.length
	}
	lines = logicScript.substring(start, end).split(/\r?\n/)
	// add goto at the end in case the script intends on continuing to next block
	const lastLine = lines.at(-1) as string
	if (!(lastLine.startsWith('select') || lastLine.startsWith('goto')))
		lines.push(`goto ${nextLabel}`)
	return lines
}

export async function fetchBlockLines(label: LabelName): Promise<string[]> {
	if (isScene(label))
		return fetchScene(label)
	else
		return fetchLogicBlock(label)
}

export function creditsScript(insertEndOfPlay: boolean = false): string[] {
	return [
		'play "*10"',
		'bg #000000,crossfade,400',
		...(credits().map(([text, delay])=> {
			const delayCmd = `delay ${delay}`
			if (!text)
				return delayCmd
			const textCmd = `bg ${text},crossfade,800`
			return [textCmd, delayCmd]
		}).flat()),
		'bg #000000,crossfade,1500',
		...(insertEndOfPlay ? ["goto *endofplay"] : [])
	]
}

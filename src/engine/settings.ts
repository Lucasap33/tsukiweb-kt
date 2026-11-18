import { JSONObject, NoMethods, PartialJSON } from "@tsukiweb/common/types"
import { Settings as SettingsBase } from "@tsukiweb/common/utils/settings"
import { textFileUserDownload, requestJSONs, twoDigits } from "@tsukiweb/common/utils/utils"
import { savesManager, SaveState } from "./savestates"
import { toast } from "react-toastify"
import { strings, TrackSourceId } from "translation/lang"
import { APP_VERSION, FULLSAVE_EXT } from "app/utils/constants"
import { progresses } from "./progress";
import { GameProgress } from "app/utils/types";

const restoreSymbol = Symbol("restore")

class Settings extends SettingsBase {
  
  language: string = "default"

  trackSource: TrackSourceId = 'tsukibako'
  titleMusic: string = '"*8"'
  dailyMessage: boolean = true
  readDailyMessages: Array<number|string> = []

  eventImages: Array<string> = new Array()
  quiz: Array<number> = []

  override getDiff() {
    const diff = super.getDiff()
    diff.language = this.language // force language to be stored
    return diff
  }
  
  /**
   * Allow {@link importGameData} to use the `restore` method
   */
  [restoreSymbol](obj: JSONObject) {
    this.restore(obj)
  }
  protected override restore(diff: JSONObject | PartialJSON): void {
    if (diff.progresses) {
      // ONLY FOR BETA : move saved progresses to separate
      const list = (diff.progresses as GameProgress[])
      for (const [i, p] of list.entries()) {
        progresses.add(p, i == list.length-1)
      }
    }

    super.restore(diff)
  }
  
  constructor() {
    super("settings", false)
    if (this.constructor == Settings)
      this.init()
  }
}

export const settings = new Settings()


export async function computeSaveHash() {
  // compute hash from event images, completed scenes and savestates
  const buffer = new TextEncoder().encode(JSON.stringify({
    eventImages: settings.eventImages,
    completedScenes: settings.completedScenes,
    saves: savesManager.listSaves()
  }))
  const hashBuffer = await window.crypto.subtle.digest('SHA-1', buffer)
  const lastQuad = new Uint32Array(hashBuffer).at(-1)
  if (lastQuad == undefined)
    throw Error(`Empty hash`)
  return lastQuad
}

type Savefile = {
  version: string
  settings: PartialJSON<NoMethods<Settings>>,
  saveStates?: SaveState[],
  progresses: GameProgress[]
}

export const exportGameData = () => {
  const {lastFullExport, ...exportedSettings} = settings
	const content: Savefile = {
		version: APP_VERSION,
		settings: settings.getDiff(),
		saveStates: savesManager.listSaves(),
    progresses: progresses.list
	}
	const date = new Date()
	const year = date.getFullYear(), month = date.getMonth()+1,
				day = date.getDate(), hour = date.getHours(), min = date.getMinutes()
	const dateString = [year, month, day].map(twoDigits).join('-')
	const timeString = [hour, min].map(twoDigits).join('-')
	textFileUserDownload(JSON.stringify(content), `${dateString}_${timeString}.${FULLSAVE_EXT}`, `application/${FULLSAVE_EXT}+json`)
  const timeStamp = date.getTime()
  settings.lastFullExport.date = timeStamp
  computeSaveHash().then(hash=> {
    if (settings.lastFullExport.date == timeStamp)
      settings.lastFullExport.hash = hash
  })
}

/**
 * Import game data from a parsed JSON object
 */
export const importGameDataFromJSON = async (json: Savefile | SaveState) => {
	if (!("settings" in json)) {
		await savesManager.importSaveFile(JSON.stringify(json))
		return
	}
  if (!json.version)
    json.version = "0.3.6" // last version without a 'version' attribute
  settings[restoreSymbol](json.settings)
  if (json.saveStates != undefined) {
    savesManager.clear()
    await savesManager.add(...json.saveStates)
  }
  const timeStamp = Date.now()
  settings.lastFullExport.date = timeStamp
  computeSaveHash().then(hash=> {
    if (settings.lastFullExport.date == timeStamp)
      settings.lastFullExport.hash = hash
  })
}

export const importGameData = async (accept = `.${FULLSAVE_EXT}`): Promise<boolean> => {
  try {
    const json = (await requestJSONs({accept}) as (Savefile | SaveState)[])?.[0]
    if (!json)
      return false
    await importGameDataFromJSON(json)

    toast(strings.game["toast-load-success"], {
      toastId: "loaded-data",
      type: "success",
    })
		return true
  } catch (e) {
    console.error(e)
    toast(strings.game["toast-load-fail"], {
      toastId: "failed-data",
      type: "error",
    })
		return false
  }
}

// expose completion outside the settings object
export const viewedScene = settings.viewedScene.bind(settings)


//TODO clean unused settings from previous versions

declare global {
  interface Window {
    [key: string]: any
  }
}

window.settings = settings

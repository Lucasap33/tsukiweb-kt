import { NumVarName } from "@tsukiweb-common/script/types"
import { endings } from "../features/endings/utils/endings"
import { ScriptPlayer } from "engine/ScriptPlayer"
import { CharId } from "app/utils/types";

//#endregion ###################################################################
//#region                         GET VARIABLES
//##############################################################################

export function getGameVariable(script: ScriptPlayer, name: NumVarName): number {
	switch (name) {
		default:
			if (/^%flg[1-9A-Z]$/.test(name)) {
			  	// flags
				return script.flags.has(name.substring(4)) ? 1 : 0
			} else if (/^\w+_point$/.test(name)) {
					// regard
				const char = name.substring(name.indexOf('_')+1)
				return script.getPoints(char as CharId) // TODO override getPoints to use seen scenes for non-erased points
			} else {
				throw Error(`Unknown variable ${name}`)
			}
	}
}
//#endregion ###################################################################
//#region                         SET VARIABLES
//##############################################################################

export function setGameVariable(script: ScriptPlayer, name: NumVarName,
                                value: number) {
  if (/^%flg[1-9A-Z]$/.test(name)) {
    if (value > 0)
      script.flags.add(name.substring(4))
    else
      script.flags.delete(name.substring(4))
  } else if (/^\w+_point$/.test(name)) {
    // regard
    const char = name.substring(name.indexOf('_')+1)
    script.setPoints(char as CharId, value)
  } else {
    throw Error(`Unknown or read-only variable ${name}`)
  }
}

import { ScriptPlayerBase } from "@tsukiweb/common/script/ScriptPlayer"
import { CharId, LabelName } from "app/utils/types";
import { creditsScript, fetchBlockLines, isScene, nextLabel } from "engine/utils";
import { settings } from "engine/settings";
import { getGameVariable, setGameVariable } from "engine/variables";
import { CommandRecord, NumVarName, VarName, VarType } from "@tsukiweb/common/script/types";
import { History } from "./history";
import { extractInstructions } from "@tsukiweb/common/script/utils";

//#endregion ###################################################################
//#region                             TYPES
//##############################################################################

export type Points = Record<CharId|'kagi'|'answer', number>

//#endregion ###################################################################
//#region                         BASE COMMANDS
//##############################################################################

/**
 * implementation-specific commands
 */
const commands: CommandRecord<ScriptPlayer> = {
    'click'  : processClick,
    'osiete' : (label)=> {
        // TODO : dialog box to ask user if the scene is not already seen.
        // if yes, `goto label`, if not, 
        // `goto *endofplay`
        return [{cmd:'goto', arg: label}]
    },
    'eroskip': processEroSkip,
    'gosub': processGoSub,
}

function processClick(arg: string, _: string, script: ScriptPlayer,
                      onFinish: VoidFunction) {
    if (arg.length > 0) {
        // inserted a delay in the `click` argument. (Not standard Nscripter).
        const delay = parseInt(arg)
        return { next: onFinish, autoPlayDelay: delay }
    } else {
        return { next: onFinish }
    }
}

function processEroSkip(nb_pages: string, _cmd: string, script: ScriptPlayer, onFinish: VoidFunction) {
    switch (settings.eroSkip) {
        case 'no' : return
        case 'ask' :
            if (script.onEroSkipPrompt) {
                script.onEroSkipPrompt(+nb_pages).then(confirmed => {
                    if (confirmed) {
                        script.skipPages(+nb_pages, false)
                    }
                    onFinish()
                })
                return {
                    next: ()=>{}, // prevent continuing to next instruction
                }
            }
            return
    }
}

function processGoSub(arg: string, _: string, script: ScriptPlayer, onFinish: VoidFunction) {
    const label = arg.substring(1)
    if (label == 'ending') // include the credits as part of the scene
        return creditsScript(false).flatMap(extractInstructions)
    return [{cmd: 'goto', arg}]
}

//#endregion
//##############################################################################

export class ScriptPlayer extends ScriptPlayerBase<LabelName, CharId, {}, {}, History> {

//#endregion ###################################################################
//#region                         ATTRS & PROPS
//##############################################################################
    
//_____________________________private attributes_______________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


//_______________________public attributes & properties_________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    
    onEroSkipPrompt?: (nbPages: number) => Promise<boolean>

//#endregion ###################################################################
//#region                          CONSTRUCTOR
//##############################################################################

    constructor(history: History) {
        const initContext = history.empty ? {
            ...ScriptPlayer.defaultBlockContext(),
            ...ScriptPlayer.defaultPageContext()
        } : history.getPageContext()
        
        super(history, initContext)
        this.setCommands(commands)
        this.addEventListener('afterBlock', (label)=> {
            if (isScene(label) && !settings.completedScenes.includes(label))
                settings.completedScenes.push(label)
        })
    }

//#endregion ###################################################################
//#region                        PUBLIC METHODS
//##############################################################################

    override isLinePageBreak(line: string, index: number, sceneLines: string[],
                    label: LabelName, playing: boolean): boolean {
        if (super.isLinePageBreak(line, index, sceneLines, label, playing))
            return true
        if (line.startsWith('phase')) {
            if (playing) // count all phases as page while playing game
                return true
            // when counting pages outside of gameplay,
            // avoid counting 2 pages for conditional phases which have 2 'phase'
            if (!sceneLines[index+1].startsWith('skip'))
                return true
        }
        return false
    }

    override pageContent() {
        return { }
    }
    
    override blockContent() {
        return { }
    }

    //static override defaultPageContext() { return ScriptPlayerBase.defaultPageContext() }
    
    //static override defaultBlockContext() { return ScriptPlayerBase.defaultBlockContext() }

//#endregion ###################################################################
//#region                      INHERITED ABSTRACTS
//##############################################################################

    override writeVariable<T extends VarName>(name: T, value: VarType<T>) {
        setGameVariable(this, name as NumVarName, value as number)
    }
    override readVariable<T extends VarName>(name: T): VarType<T> {
        return getGameVariable(this, name as NumVarName) as VarType<T>
    }

    override fetchLines(label: LabelName): Promise<string[]> {
        return fetchBlockLines(label)
    }
    
    protected override nextLabel(label: LabelName): LabelName | null {
        const result = nextLabel(label)
        if (result == "endofplay")
            return null
        return result
    }

//#endregion
//##############################################################################

}

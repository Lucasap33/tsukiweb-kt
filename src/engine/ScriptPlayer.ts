import { ScriptPlayerBase } from "@tsukiweb/common/script/ScriptPlayer"
import { PointId, LabelName, SceneName } from "app/utils/types";
import { isScene } from "engine/utils";
import { settings, viewedScene } from "engine/settings";
import { assets } from "translation/assets";
import { CommandRecord, VarName, VarType } from "@tsukiweb/common/script/types";
import { History } from "./history";
import { extractInstructions } from "@tsukiweb/common/script/utils";
import { SCENE_ATTRS } from "app/utils/constants";
import { creditsScript, fetchBlockLines } from "./script-loader"

//#endregion ###################################################################
//#region                             TYPES
//##############################################################################

export type Points = Record<PointId, number>

//#endregion ###################################################################
//#region                         BASE COMMANDS
//##############################################################################

/**
 * implementation-specific commands
 */
const commands: CommandRecord<ScriptPlayer> = {
    'click'  : processClick,
    'eroskip': processEroSkip,
    'gosub': processGoSub,
    'rngsel': processRngSel,
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

function processGoSub(arg: string) {
    const label = arg.substring(1)
    if (label == 'ending') // include the credits as part of the scene
        return creditsScript(false).flatMap(extractInstructions)
    return [{cmd: 'goto', arg}]
}
function processRngSel(arg: string) {
    let labels = arg.split(',')
    const notSeen = labels.filter(s=>!viewedScene(s))
    if (notSeen.length > 0)
        labels = notSeen
    const index = Math.floor(Math.random() * notSeen.length)
    return [{cmd: 'goto', arg: labels[index]}]
}

//#endregion
//##############################################################################

export class ScriptPlayer extends ScriptPlayerBase<LabelName, PointId, {},
                            {deathCount: number}, History> {

//#endregion ###################################################################
//#region                         ATTRS & PROPS
//##############################################################################
    
//_____________________________private attributes_______________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    private _tempVariables = new Map<string, string|number>()
    private _deathCount = 0
    private _canSave = false
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
        if (initContext.deathCount)
            this._deathCount = initContext.deathCount

        this.addEventListener('finish', ()=> {
            if (!this.singleScene && !this.extra)
                this._canSave = true
        })

    }

//#endregion ###################################################################
//#region                        PRIVATE METHODS
//##############################################################################

    viewedScene(label: SceneName) {
        return viewedScene(label) || this.history.hasScene(label)
    }

//#endregion ###################################################################
//#region                        PUBLIC METHODS
//##############################################################################

    get deathCount() {
        return this._deathCount
    }
    get canSaveProgress() {
        return this._canSave
    }

    onProgressSaved() {
        this._canSave = true
    }

    override isLinePageBreak(line: string, index: number, sceneLines: string[],
                    label: LabelName): boolean {
        if (super.isLinePageBreak(line, index, sceneLines, label))
            return true
        if (line.startsWith('prompt')) {
            return true
        }
        return false
    }

    override pageContent() {
        return {
            points: {//...Object.fromEntries(this.points.entries()),
                // answer_point is the only variable that varies inside a scene
                answer: this.getPoints('answer')
            }
        }
    }
    
    override blockContent() {
        return { deathCount: this._deathCount }
    }

    override hasFlag(flag: string) {
        if (super.hasFlag(flag))
            return true
        if (flag.length == 1)
            return SCENE_ATTRS["scene-points"].flags[flag].some(s=>this.viewedScene(s))
        return false
    }

    //static override defaultPageContext() { return ScriptPlayerBase.defaultPageContext() }
    
    static override defaultBlockContext() {
        return  {
            ...ScriptPlayerBase.defaultBlockContext(),
            deathCount: 0,
        }
    }

//#endregion ###################################################################
//#region                      INHERITED ABSTRACTS
//##############################################################################
    override writeVariable<T extends VarName>(name: T, value: VarType<T>) {
        let m
        if ((m = name.match(/^%flg_?([\dA-Za-z]+)$/))) {
            if (value != 0)
                this.setFlag(m[1])
            else
                this.deleteFlag(m[1])
        } else if ((m = name.match(/^%(\w+)_point$/))) {
            this.setPoints(m[1] as PointId, value as number)
        } else if (["%answer", "%2100"].includes(name)) {
            this._tempVariables.set(name, value)
        } else {
			throw Error(`Unknown or read-only variable ${name}`)
        }
    }

    override readVariable<T extends VarName>(name: T): VarType<T> {
        let m
        if ((m = name.match(/^%flg_?([\dA-Za-z]+)$/))) {
            return (this.hasFlag(m[1]) ? 1 : 0) as VarType<T>
        } else if ((m = name.match(/^%(\w+)_point$/))) {
            return this.getPoints(m[1] as PointId) as VarType<T>
        } else if (this._tempVariables.has(name)) {
            return this._tempVariables.get(name) as VarType<T>
        } else switch (name as string) {
            case '%answer': return 0 as VarType<T>
            case '%smooth': return settings.smoothFlashes as VarType<T>
            default : throw Error(`Unknown variable ${name}`)
        }
    }

    override fetchLines(label: LabelName): Promise<string[]> {
        return fetchBlockLines(label)
    }
    
    protected override nextLabel(label: LabelName): LabelName | null {
        if (/^s\d+a?$/.test(label))
            return `${label}_end` as LabelName
        if (/^quiz\d$/.test(label))
            return `${label}_end` as LabelName
        return null
    }

    protected override preloadAssets(list: Set<string>): void {
        for (const asset of list)
            assets.load(undefined, asset)
    }

//#endregion
//##############################################################################

}

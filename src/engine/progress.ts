import { Stored } from "@tsukiweb/common/utils/storage";
import { EMPTY_PROGRESS } from "app/utils/constants";
import { GameProgress } from "app/utils/types";


class GameProgresses extends Stored {

    private _progresses: Array<GameProgress>
    constructor() {
        super("progresses", false)
        this._progresses = new Array()
        this.restoreFromStorage()
    }
    get list() {
        return this._progresses
    }
    
    override serializeToStorage() {
        return JSON.stringify(this._progresses)
    }
    override deserializeFromStorage(str: string) {
        this._progresses.splice(0, this._progresses.length, ...JSON.parse(str))
    }
    delete(progress: GameProgress, save = true) {
        const i = this._progresses.indexOf(progress)
        if (i>= 0) {
            this._progresses.splice(i, 1);
            if (save)
                this.saveToStorage()
        }
    }
    replace(from: GameProgress, to: GameProgress) {
        this.delete(from, false)
        this.add(to, true)
    }
    add(progress: GameProgress, save = true) {
        this._progresses.push(progress)
        this._progresses.sort((a, b)=> b.lastSave - a.lastSave)
        if (save)
            this.saveToStorage()
    }
    getEmpty() {
        return EMPTY_PROGRESS
    }
}

export const progresses = new GameProgresses();